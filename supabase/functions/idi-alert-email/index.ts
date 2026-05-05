import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));


function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!localPart || !domain) return 'invalid-email';
  if (localPart.length < 3) return `***@${domain}`;
  return `${localPart.slice(0, 2)}***@${domain}`;
}

interface IDIAlert {
  id: string;
  user_id: string;
  cidade: string;
  uf: string;
  alert_type: string;
  threshold_value: number;
  enabled: boolean;
}

interface IDIScore {
  cidade: string;
  uf: string;
  score_idi: number;
  score_idi_normalizado: number;
  score_variacao: number;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("IDI Alert Email function triggered");
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req.headers.get('origin'));
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const authClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user }, error: authError } = await authClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all enabled alerts
    const { data: alerts, error: alertsError } = await supabase
      .from("idi_alerts")
      .select("*")
      .eq("enabled", true);

    if (alertsError) {
      console.error("Error fetching alerts:", alertsError);
      throw new Error("Failed to fetch alerts");
    }

    console.log(`Found ${alerts?.length || 0} enabled alerts`);

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: "No enabled alerts to process" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get latest IDI scores for cities with alerts
    const triggeredAlerts: { alert: IDIAlert; score: IDIScore; email: string; name: string }[] = [];

    for (const alert of alerts as IDIAlert[]) {
      // Get latest IDI score for this city
      const { data: scoreData, error: scoreError } = await supabase
        .from("idi_score_cache")
        .select("*")
        .eq("cidade", alert.cidade)
        .eq("uf", alert.uf)
        .order("mes", { ascending: false })
        .limit(1)
        .single();

      if (scoreError || !scoreData) {
        console.log(`No score found for ${alert.cidade}-${alert.uf}`);
        continue;
      }

      const score = scoreData as IDIScore;
      let shouldTrigger = false;

      // Check if alert should be triggered based on type
      switch (alert.alert_type) {
        case "threshold":
          shouldTrigger = score.score_idi_normalizado >= alert.threshold_value;
          break;
        case "increase":
          shouldTrigger = score.score_variacao >= alert.threshold_value;
          break;
        case "decrease":
          shouldTrigger = score.score_variacao <= -alert.threshold_value;
          break;
      }

      if (shouldTrigger) {
        // Get user email from auth
        const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(alert.user_id);
        
        if (userError || !user?.email) {
          console.log(`Could not get email for user ${alert.user_id}`);
          continue;
        }

        // Get user name from public.users
        const { data: profile } = await supabase
          .from("users")
          .select("name")
          .eq("id", alert.user_id)
          .single();

        triggeredAlerts.push({
          alert,
          score,
          email: user.email,
          name: profile?.name || "Usuário",
        });
      }
    }

    console.log(`${triggeredAlerts.length} alerts triggered`);

    // Send emails for triggered alerts
    let emailsSent = 0;
    for (const { alert, score, email, name } of triggeredAlerts) {
      const alertTypeLabel = {
        threshold: `atingiu o score mínimo de ${alert.threshold_value}`,
        increase: `subiu mais de ${alert.threshold_value}%`,
        decrease: `caiu mais de ${alert.threshold_value}%`,
      }[alert.alert_type] || "atingiu o threshold configurado";

      const message = `O IDI de ${alert.cidade}/${alert.uf} ${alertTypeLabel}. Score atual: ${score.score_idi_normalizado?.toFixed(0) || 'N/A'}/100`;
      let emailSentSuccess = false;

      try {
        await resend.emails.send({
          from: "Verto Intelligence <alertas@resend.dev>",
          to: [email],
          subject: `🔔 Alerta IDI: ${alert.cidade}/${alert.uf}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #2563eb;">Alerta IDI Acionado</h2>
              <p>Olá ${name},</p>
              <p>O IDI da cidade <strong>${alert.cidade}/${alert.uf}</strong> ${alertTypeLabel}.</p>
              
              <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin: 0 0 12px 0; color: #1f2937;">Dados Atuais</h3>
                <p style="margin: 4px 0;"><strong>Score IDI:</strong> ${score.score_idi?.toFixed(1) || "N/A"}</p>
                <p style="margin: 4px 0;"><strong>Score Normalizado:</strong> ${score.score_idi_normalizado?.toFixed(0) || "N/A"}/100</p>
                <p style="margin: 4px 0;"><strong>Variação:</strong> ${score.score_variacao >= 0 ? '+' : ''}${score.score_variacao?.toFixed(2) || 0}%</p>
              </div>
              
              <p>Acesse a plataforma Verto Intelligence para mais detalhes.</p>
              
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                Você recebeu este email porque configurou um alerta para esta cidade. 
                Para cancelar, desative o alerta na plataforma.
              </p>
            </div>
          `,
        });

        emailSentSuccess = true;
        emailsSent++;
        console.log(`Email sent to ${maskEmail(email)} for ${alert.cidade}/${alert.uf}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${maskEmail(email)}:`, emailError);
      }

      // Record in alert history
      try {
        await supabase.from("alert_history").insert({
          user_id: alert.user_id,
          alert_id: alert.id,
          cidade: alert.cidade,
          uf: alert.uf,
          alert_type: alert.alert_type,
          threshold_value: alert.threshold_value,
          triggered_value: score.score_idi_normalizado || score.score_idi || 0,
          message,
          email_sent: emailSentSuccess,
        });
        console.log(`Alert history recorded for ${alert.cidade}/${alert.uf}`);
      } catch (historyError) {
        console.error(`Failed to record alert history:`, historyError);
      }

      // Update last_triggered_at
      await supabase
        .from("idi_alerts")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", alert.id);
    }

    return new Response(
      JSON.stringify({ 
        message: "Alerts processed", 
        triggered: triggeredAlerts.length,
        emails_sent: emailsSent 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in IDI alert email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
