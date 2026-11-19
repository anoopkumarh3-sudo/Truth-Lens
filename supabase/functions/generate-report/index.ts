import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
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

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid user session." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { analysis_id } = body;

    if (!analysis_id) {
      return new Response(JSON.stringify({ error: "Missing required parameter: analysis_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Fetch analysis and verify ownership
    const { data: analysis, error: fetchError } = await adminClient
      .from("analyses")
      .select("*")
      .eq("id", analysis_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError || !analysis) {
      return new Response(JSON.stringify({ error: "Analysis not found or unauthorized access." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (analysis.status !== "completed") {
      return new Response(
        JSON.stringify({ error: `Cannot generate report: analysis status is '${analysis.status}' (must be 'completed').` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create or fetch report entry
    const reportName = `TruthLens_Dossier_${analysis.analysis_type.toUpperCase()}_${analysis.id.slice(0, 8)}.pdf`;
    const filePath = `${user.id}/reports/${reportName}`;

    const { data: report, error: reportError } = await adminClient
      .from("reports")
      .insert({
        user_id: user.id,
        analysis_id: analysis.id,
        report_name: reportName,
        file_path: filePath,
      })
      .select()
      .single();

    if (reportError) {
      return new Response(JSON.stringify({ error: "Failed to generate report record.", details: reportError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        report,
        message: "Forensic report generated successfully.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || "Internal server error." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
