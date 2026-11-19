import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-worker-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const workerSecret = Deno.env.get("WORKER_SECRET");

    // 1. Authorize worker
    const clientWorkerSecret = req.headers.get("x-worker-secret");
    const authHeader = req.headers.get("Authorization");

    const isAuthorized =
      (workerSecret && clientWorkerSecret === workerSecret) ||
      (authHeader && authHeader.includes(supabaseServiceKey));

    if (!isAuthorized) {
      return new Response(JSON.stringify({ error: "Unauthorized worker access." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { analysis_id, status, confidence_score, verdict, metadata } = body;

    if (!analysis_id || !status || !["completed", "failed"].includes(status)) {
      return new Response(JSON.stringify({ error: "Invalid analysis_id or status ('completed' | 'failed' required)." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch analysis record
    const { data: analysis, error: fetchErr } = await adminClient
      .from("analyses")
      .select("*")
      .eq("id", analysis_id)
      .single();

    if (fetchErr || !analysis) {
      return new Response(JSON.stringify({ error: "Analysis record not found." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cost = analysis.credit_cost || 0;

    // 3. Fetch user wallet
    const { data: wallet } = await adminClient
      .from("wallets")
      .select("*")
      .eq("user_id", analysis.user_id)
      .single();

    if (wallet) {
      if (status === "completed") {
        // Settle reserved credits
        const reservedFree = wallet.reserved_free_credits || 0;
        const deductReservedFree = Math.min(reservedFree, cost);
        const deductReservedPurchased = cost - deductReservedFree;

        await adminClient.from("wallets").update({
          reserved_free_credits: Math.max(0, reservedFree - deductReservedFree),
          reserved_purchased_credits: Math.max(0, (wallet.reserved_purchased_credits || 0) - deductReservedPurchased),
          updated_at: new Date().toISOString(),
        }).eq("user_id", analysis.user_id);

        // Record credit transaction
        await adminClient.from("credit_transactions").insert({
          user_id: analysis.user_id,
          analysis_id: analysis.id,
          transaction_type: "consumption",
          credit_source: deductReservedFree > 0 ? "free" : "purchased",
          credits: cost,
          description: `Completed ${analysis.analysis_type} forensic analysis (-${cost} LC)`,
        });
      } else {
        // Refund on failure: release reserved credits back to balances
        const reservedFree = wallet.reserved_free_credits || 0;
        const refundFree = Math.min(reservedFree, cost);
        const refundPurchased = cost - refundFree;

        await adminClient.from("wallets").update({
          free_credits: (wallet.free_credits || 0) + refundFree,
          purchased_credits: (wallet.purchased_credits || 0) + refundPurchased,
          reserved_free_credits: Math.max(0, reservedFree - refundFree),
          reserved_purchased_credits: Math.max(0, (wallet.reserved_purchased_credits || 0) - refundPurchased),
          updated_at: new Date().toISOString(),
        }).eq("user_id", analysis.user_id);
      }
    }

    // 4. Update analysis record
    const { data: updatedAnalysis, error: updateErr } = await adminClient
      .from("analyses")
      .update({
        status,
        confidence_score: typeof confidence_score === "number" ? confidence_score : null,
        verdict: verdict || null,
        metadata: metadata || null,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", analysis_id)
      .select()
      .single();

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, analysis: updatedAnalysis }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
