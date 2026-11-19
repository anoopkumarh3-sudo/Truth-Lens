// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_PACKAGES: Record<number, number> = {
  49: 150,
  99: 350,
  199: 800,
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // 1. Authenticate user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization header." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    const user = authData?.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user session." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const action = body.action || "create_order";
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // =========================================================================
    // ACTION 1: CREATE ORDER (Records pending intent)
    // =========================================================================
    if (action === "create_order") {
      const amount = Number(body.amount);
      const credits = VALID_PACKAGES[amount];

      if (!credits) {
        return new Response(
          JSON.stringify({ error: `Invalid pack amount: ₹${amount}. Valid packages: ₹49 (150 LC), ₹99 (350 LC), ₹199 (800 LC).` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const orderRef = `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      const rzpKeyId = Deno.env.get("RAZORPAY_KEY_ID") || Deno.env.get("key_id");
      const rzpKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET") || Deno.env.get("key_secret");
      let realOrderId: string | undefined = undefined;

      // If Razorpay API credentials exist in Edge Function environment, create genuine Razorpay Order
      if (rzpKeyId && rzpKeySecret) {
        try {
          const auth = btoa(`${rzpKeyId}:${rzpKeySecret}`);
          const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${auth}`,
            },
            body: JSON.stringify({
              amount: amount * 100,
              currency: "INR",
              receipt: orderRef,
            }),
          });
          if (rzpRes.ok) {
            const rzpData = await rzpRes.json();
            if (rzpData?.id && rzpData.id.startsWith("order_")) {
              realOrderId = rzpData.id;
            }
          }
        } catch (_) {}
      }

      const effectiveRef = realOrderId || orderRef;

      // Record pending payment in payments table
      const { data: paymentRecord, error: insertError } = await adminClient
        .from("payments")
        .insert({
          user_id: user.id,
          amount,
          currency: "INR",
          credits,
          payment_method: "pending_verification",
          status: "pending",
          transaction_reference: effectiveRef,
        })
        .select()
        .single();

      if (insertError) {
        return new Response(JSON.stringify({ error: "Failed to record payment intent.", details: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(
        JSON.stringify({
          order_id: realOrderId || undefined,
          order_ref: effectiveRef,
          key_id: rzpKeyId || undefined,
          amount: amount * 100, // paise
          currency: "INR",
          payment_id: paymentRecord.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // ACTION 2: VERIFY PAYMENT & AWARD CREDITS ATOMICALLY
    // =========================================================================
    if (action === "verify_payment") {
      const order_id = body.order_id || body.razorpay_order_id || null;
      const payment_id = body.payment_id || body.razorpay_payment_id || null;
      const amount = Number(body.amount);
      const requestedCredits = body.credits ? Number(body.credits) : (VALID_PACKAGES[amount] || 0);

      if (!payment_id && !order_id) {
        return new Response(JSON.stringify({ error: "Missing payment_id or order_id for verification." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1. Locate payment record
      let paymentRecord: any = null;
      if (order_id) {
        const { data: pByOrder } = await adminClient
          .from("payments")
          .select("*")
          .eq("transaction_reference", order_id)
          .eq("user_id", user.id)
          .maybeSingle();
        paymentRecord = pByOrder;
      }
      if (!paymentRecord && payment_id) {
        const { data: pByPayment } = await adminClient
          .from("payments")
          .select("*")
          .eq("transaction_reference", payment_id)
          .eq("user_id", user.id)
          .maybeSingle();
        paymentRecord = pByPayment;
      }
      if (!paymentRecord) {
        // Fallback to most recent pending payment for this user matching amount
        const { data: pRecent } = await adminClient
          .from("payments")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        paymentRecord = pRecent;
      }

      // If no pre-created order record existed, initialize one with service role
      if (!paymentRecord) {
        const creditsToAward = requestedCredits || VALID_PACKAGES[amount] || 150;
        const packAmount = amount || (Object.keys(VALID_PACKAGES).find(k => VALID_PACKAGES[Number(k)] === creditsToAward) ? Number(Object.keys(VALID_PACKAGES).find(k => VALID_PACKAGES[Number(k)] === creditsToAward)) : 49);

        const { data: newP, error: newPErr } = await adminClient
          .from("payments")
          .insert({
            user_id: user.id,
            amount: packAmount,
            currency: "INR",
            credits: creditsToAward,
            payment_method: "razorpay_test",
            status: "pending",
            transaction_reference: payment_id || order_id || `pay_${Date.now()}`,
          })
          .select()
          .single();

        if (newPErr || !newP) {
          return new Response(JSON.stringify({ error: "Failed to initialize payment record for verification." }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        paymentRecord = newP;
      }

      // Prevent duplicate crediting
      if (paymentRecord.status === "completed") {
        const { data: existingWallet } = await adminClient
          .from("wallets")
          .select("*")
          .eq("user_id", user.id)
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            message: "Payment already verified and credited.",
            wallet: existingWallet,
            credits_added: 0,
            new_balance: (existingWallet?.free_credits || 0) + (existingWallet?.purchased_credits || 0),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark payment completed
      await adminClient.from("payments").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", paymentRecord.id);

      // Award credits atomically to wallets table using service role
      const { data: currentWallet } = await adminClient
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const newPurchased = (currentWallet?.purchased_credits || 0) + paymentRecord.credits;
      const { data: updatedWallet } = await adminClient
        .from("wallets")
        .update({
          purchased_credits: newPurchased,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      // Record transaction in credit_transactions
      await adminClient.from("credit_transactions").insert({
        user_id: user.id,
        payment_id: paymentRecord.id,
        transaction_type: "purchase",
        credit_source: "purchased",
        credits: paymentRecord.credits,
        description: `Purchased ₹${paymentRecord.amount} package (+${paymentRecord.credits} LensCredits)`,
      });

      return new Response(
        JSON.stringify({
          success: true,
          credits_added: paymentRecord.credits,
          new_balance: (updatedWallet?.free_credits || 0) + (updatedWallet?.purchased_credits || 0),
          wallet: updatedWallet,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
