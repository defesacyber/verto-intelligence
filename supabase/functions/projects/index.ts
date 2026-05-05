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
    const projectId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null;

    // GET - List projects or get single project
    if (req.method === 'GET') {
      if (projectId && projectId !== 'projects') {
        console.log('Fetching project:', projectId);
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('id', projectId)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Get project error:', error.message);
          return new Response(
            JSON.stringify({ error: 'Project not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ result: { data } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // List all projects
      console.log('Listing projects for user:', user.id);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('List projects error:', error.message);
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

    // POST - Create project or analyze
    if (req.method === 'POST') {
      const body = await req.json();
      const action = pathParts[pathParts.length - 1];

      if (action === 'analyze') {
        if (typeof body?.projectId !== 'string' || body.projectId.length < 8) {
          return new Response(
            JSON.stringify({ error: 'Invalid projectId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        console.log('Analyzing project:', body.projectId);
        // Perform viability analysis
        const analysis = calculateViability(body);
        return new Response(
          JSON.stringify({ result: { data: analysis } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return new Response(
          JSON.stringify({ error: 'Invalid payload' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Creating project:', body.name);
      const { data, error } = await supabase
        .from('projects')
        .insert({
          ...body,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        console.error('Create project error:', error.message);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ result: { data } }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // PUT - Update project
    if (req.method === 'PUT') {
      if (!projectId || projectId === 'projects') {
        return new Response(
          JSON.stringify({ error: 'Project ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return new Response(
          JSON.stringify({ error: 'Invalid payload' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('Updating project:', projectId);

      // Security: Remove sensitive fields that shouldn't be updated by the user
      const { user_id: _user_id, id: _id, created_at: _created_at, ...updateData } = body;

      const { data, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', projectId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Update project error:', error.message);
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

    // DELETE - Delete project
    if (req.method === 'DELETE') {
      if (!projectId || projectId === 'projects') {
        return new Response(
          JSON.stringify({ error: 'Project ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Deleting project:', projectId);
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Delete project error:', error.message);
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
    console.error('Projects function error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Viability calculation function
interface ViabilityInput {
  landCost?: number;
  constructionCost?: number;
  totalUnits?: number;
  averageUnitPrice?: number;
  financingRate?: number;
  projectDuration?: number;
}

function calculateViability(input: ViabilityInput) {
  const {
    landCost = 0,
    constructionCost = 0,
    totalUnits = 1,
    averageUnitPrice = 0,
    financingRate = 0.12,
    projectDuration = 24,
  } = input;

  const totalInvestment = landCost + constructionCost;
  const grossRevenue = totalUnits * averageUnitPrice;
  const financingCost = totalInvestment * financingRate * (projectDuration / 12);
  const totalCost = totalInvestment + financingCost;
  const profit = grossRevenue - totalCost;
  const profitMargin = grossRevenue > 0 ? (profit / grossRevenue) * 100 : 0;
  const roi = totalInvestment > 0 ? (profit / totalInvestment) * 100 : 0;

  return {
    totalInvestment,
    grossRevenue,
    financingCost,
    totalCost,
    profit,
    profitMargin: Math.round(profitMargin * 100) / 100,
    roi: Math.round(roi * 100) / 100,
    viable: profitMargin >= 15,
    recommendation: profitMargin >= 20 
      ? 'Projeto altamente viável' 
      : profitMargin >= 15 
        ? 'Projeto viável com margem aceitável'
        : profitMargin >= 10
          ? 'Projeto com margem baixa - revisar custos'
          : 'Projeto não recomendado - margem insuficiente',
  };
}
