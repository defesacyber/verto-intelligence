import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Project, CreateProjectInput, PropertyType, TargetAudience, ProjectStatus } from '@/lib/types';
import type { ViabilityResult, ProjectInput } from '@/lib/viability-calculator';
import { useToast } from '@/hooks/use-toast';
import { calculateViability } from '@/lib/viability-calculator';

interface UseProjectsOptions {
  page?: number;
  pageSize?: number;
  status?: string;
}

// Supabase row type for 'projects' table
interface ProjectRow {
  id: string;
  user_id: string;
  name: string;
  city: string;
  uf: string;
  location?: string | null;
  property_type: PropertyType;
  target_audience: TargetAudience | null;
  total_area: number | null;
  total_units: number | null;
  avg_unit_size: number | null;
  vgv: number | null;
  launch_date?: string | null;
  delivery_date?: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  neighborhood?: string | null;
  address?: string | null;
  region_id?: string | null;
  neighborhood_id?: string | null;
  sector_id?: string | null;
}

// Transform database row to Project type
function transformProject(row: ProjectRow): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    city: row.city,
    state: row.uf,
    neighborhood: row.neighborhood ?? row.location ?? undefined,
    address: row.address ?? row.location ?? undefined,
    propertyType: row.property_type,
    targetAudience: row.target_audience ?? 'media',
    totalArea: Number(row.total_area ?? 0),
    totalUnits: Number(row.total_units ?? 0),
    avgUnitSize: Number(row.avg_unit_size ?? 0),
    estimatedPrice: Number(row.vgv ?? 0),
    launchDate: row.launch_date,
    deliveryDate: row.delivery_date,
    regionId: row.region_id,
    neighborhoodId: row.neighborhood_id,
    sectorId: row.sector_id,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useProjects(options: UseProjectsOptions = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const { toast } = useToast();

  const fetchProjects = useCallback(async (opts?: UseProjectsOptions) => {
    try {
      setIsLoading(true);
      const params = { ...options, ...opts };
      const page = params.page || 1;
      const pageSize = params.pageSize || 10;
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('projects')
        .select('id, user_id, name, city, uf, location, property_type, target_audience, total_area, total_units, avg_unit_size, vgv, launch_date, delivery_date, status, created_at, updated_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (params.status) {
        query = query.eq('status', params.status);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setProjects(((data || []) as ProjectRow[]).map(transformProject));
      setTotal(count || 0);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao carregar projetos',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [options, toast]);

  const getProject = useCallback(async (id: string): Promise<Project | null> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, user_id, name, city, uf, location, property_type, target_audience, total_area, total_units, avg_unit_size, vgv, launch_date, delivery_date, status, created_at, updated_at')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      return transformProject(data as ProjectRow);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao carregar projeto',
        description: message,
        variant: 'destructive',
      });
      return null;
    }
  }, [toast]);

  const createProject = useCallback(async (data: CreateProjectInput): Promise<Project | null> => {
    try {
      setIsLoading(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Usuário não autenticado');

      const { data: project, error } = await supabase
        .from('projects')
        .insert({
          user_id: userData.user.id,
          name: data.name,
          city: data.city,
          uf: data.state,
          location: `${data.city} - ${data.state}`,
          is_capital: false,
          neighborhood: data.neighborhood,
          address: data.address,
          property_type: data.propertyType,
          target_audience: data.targetAudience,
          total_area: data.totalArea,
          total_units: data.totalUnits,
          avg_unit_size: data.avgUnitSize,
          vgv: data.estimatedPrice,
          launch_date: data.launchDate,
          delivery_date: data.deliveryDate,
          status: 'rascunho',
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Projeto criado!',
        description: `O projeto "${data.name}" foi criado com sucesso.`,
      });

      return transformProject(project);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao criar projeto',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const updateProject = useCallback(async (id: string, data: Partial<CreateProjectInput>): Promise<Project | null> => {
    try {
      setIsLoading(true);

      const updateData: Partial<ProjectRow> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.city !== undefined) updateData.city = data.city;
      if (data.state !== undefined) updateData.uf = data.state;
      if (data.neighborhood !== undefined) updateData.neighborhood = data.neighborhood;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.propertyType !== undefined) updateData.property_type = data.propertyType;
      if (data.targetAudience !== undefined) updateData.target_audience = data.targetAudience;
      if (data.totalArea !== undefined) updateData.total_area = data.totalArea;
      if (data.totalUnits !== undefined) updateData.total_units = data.totalUnits;
      if (data.avgUnitSize !== undefined) updateData.avg_unit_size = data.avgUnitSize;
      if (data.estimatedPrice !== undefined) updateData.vgv = data.estimatedPrice;
      if (data.launchDate !== undefined) updateData.launch_date = data.launchDate;
      if (data.deliveryDate !== undefined) updateData.delivery_date = data.deliveryDate;
      if (data.city && data.state) updateData.location = `${data.city} - ${data.state}`;

      const { data: project, error } = await supabase
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Projeto atualizado!',
        description: 'As alterações foram salvas.',
      });

      return transformProject(project as ProjectRow);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao atualizar projeto',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const deleteProject = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Projeto excluído',
        description: 'O projeto foi removido com sucesso.',
      });

      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro ao excluir projeto',
        description: message,
        variant: 'destructive',
      });
      return false;
    }
  }, [toast]);

  const analyzeProject = useCallback(async (id: string): Promise<ViabilityResult | null> => {
    try {
      setIsLoading(true);

      const project = await getProject(id);
      if (!project) throw new Error('Projeto não encontrado');

      // Convert Project to ProjectInput for viability calculation
      const projectInput: ProjectInput = {
        landArea: project.totalArea,
        landCost: project.estimatedPrice * 0.2, // Estimate land as 20% of total
        constructionCostPerM2: 3500, // Default construction cost
        totalUnits: project.totalUnits,
        averageUnitArea: project.avgUnitSize,
        averageSalePrice: project.estimatedPrice,
        constructionMonths: 24, // Default 24 months
        salesMonths: 18, // Default 18 months
        financingRate: 12, // Default 12% financing rate
        otherCosts: project.estimatedPrice * 0.05, // Estimate 5% other costs
      };

      const result = calculateViability(projectInput);

      toast({
        title: 'Análise concluída!',
        description: 'A análise de viabilidade foi gerada.',
      });

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: 'Erro na análise',
        description: message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast, getProject]);

  return {
    projects,
    isLoading,
    total,
    fetchProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    analyzeProject,
  };
}
