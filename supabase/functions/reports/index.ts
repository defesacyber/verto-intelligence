import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));

  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req.headers.get('origin'));
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const reportId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

    // GET - List reports or get single report
    if (req.method === 'GET') {
      if (reportId && reportId !== 'reports') {
        console.log('Fetching report:', reportId);
        const { data, error } = await supabase
          .from('reports')
          .select('*, projects(*)')
          .eq('id', reportId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Get report error:', error.message);
          return new Response(
            JSON.stringify({ error: 'Report not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ result: { data } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // List all reports
      console.log('Listing reports for user:', user.id);
      const { data, error } = await supabase
        .from('reports')
        .select('*, projects(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('List reports error:', error.message);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ result: { data } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Generate report
    if (req.method === 'POST') {
      const body = await req.json();
      const action = pathParts[pathParts.length - 1];

      if (action === 'generate') {
        if (typeof body?.projectId !== 'string' || body.projectId.length < 8) {
          return new Response(
            JSON.stringify({ error: 'Invalid projectId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Generating report for project:', body.projectId);
        
        // Fetch project data
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', body.projectId)
          .eq('user_id', user.id)
          .single();

        if (projectError || !project) {
          return new Response(
            JSON.stringify({ error: 'Project not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Generate report data
        const reportData = generateReportData(project, body.type || 'viability');

        // Save report
        const { data: report, error: reportError } = await supabase
          .from('reports')
          .insert({
            project_id: body.projectId,
            user_id: user.id,
            type: body.type || 'viability',
            title: `Relatório de ${body.type === 'market' ? 'Mercado' : 'Viabilidade'} - ${project.name}`,
            data: reportData,
          })
          .select()
          .single();

        if (reportError) {
          console.error('Save report error:', reportError.message);
          return new Response(
            JSON.stringify({ error: reportError.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ result: { data: report } }),
          { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (action === 'export') {
        if (typeof body?.reportId !== 'string' || body.reportId.length < 8) {
          return new Response(
            JSON.stringify({ error: 'Invalid reportId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Exporting report:', body.reportId);
        // Return report data for PDF generation on client
        const { data: report, error } = await supabase
          .from('reports')
          .select('*, projects(*)')
          .eq('id', body.reportId)
          .eq('user_id', user.id)
          .single();

        if (error || !report) {
          return new Response(
            JSON.stringify({ error: 'Report not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ result: { data: report } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // DELETE - Delete report
    if (req.method === 'DELETE') {
      if (!reportId || reportId === 'reports') {
        return new Response(
          JSON.stringify({ error: 'Report ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Deleting report:', reportId);
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('id', reportId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete report error:', error.message);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ result: { data: { success: true } } }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Reports function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Generate report data based on project
interface BasicProject {
  id?: string;
  name?: string;
  region?: string;
  price_per_sqm?: number;
  land_cost?: number;
  construction_cost?: number;
  total_units?: number;
  average_unit_price?: number;
}

function generateReportData(project: BasicProject, type: string) {
  const baseData = {
    generatedAt: new Date().toISOString(),
    projectName: project.name,
    projectId: project.id,
  };

  if (type === 'market') {
    return {
      ...baseData,
      type: 'market',
      marketAnalysis: {
        region: project.region || 'Não especificado',
        pricePerSqm: project.price_per_sqm || 0,
        marketTrend: 'estável',
        competitorAnalysis: [],
        demandIndicators: {
          population: 'média',
          income: 'média-alta',
          employment: 'estável',
        },
      },
    };
  }

  // Viability report
  const landCost = project.land_cost || 0;
  const constructionCost = project.construction_cost || 0;
  const totalUnits = project.total_units || 1;
  const avgPrice = project.average_unit_price || 0;
  
  const totalInvestment = landCost + constructionCost;
  const grossRevenue = totalUnits * avgPrice;
  const profit = grossRevenue - totalInvestment;
  const margin = grossRevenue > 0 ? (profit / grossRevenue) * 100 : 0;

  return {
    ...baseData,
    type: 'viability',
    financialSummary: {
      totalInvestment,
      grossRevenue,
      netProfit: profit,
      profitMargin: Math.round(margin * 100) / 100,
      roi: totalInvestment > 0 ? Math.round((profit / totalInvestment) * 10000) / 100 : 0,
    },
    recommendation: margin >= 15 ? 'Projeto viável' : 'Revisar custos',
    riskFactors: [
      { factor: 'Mercado', level: 'médio' },
      { factor: 'Financiamento', level: 'baixo' },
      { factor: 'Regulatório', level: 'baixo' },
    ],
  };
}
