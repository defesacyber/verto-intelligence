import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardProject {
  id: string;
  name: string;
  location: string;
  city: string;
  uf: string;
  is_capital: boolean;
  property_type: 'residential' | 'commercial' | 'land' | 'mixed';
  status: 'draft' | 'analysis' | 'approved' | 'rejected';
  vgv: number;
  roi: number;
  margin: number;
  created_at: string;
}

interface UseDashboardProjectsFilters {
  region?: string;
  city?: string;
  uf?: string;
}

// Map of capital values to their city and UF
const capitalMap: Record<string, { city: string; uf: string }> = {
  'aracaju': { city: 'Aracaju', uf: 'SE' },
  'belem': { city: 'Belém', uf: 'PA' },
  'belo-horizonte': { city: 'Belo Horizonte', uf: 'MG' },
  'boa-vista': { city: 'Boa Vista', uf: 'RR' },
  'brasilia': { city: 'Brasília', uf: 'DF' },
  'campo-grande': { city: 'Campo Grande', uf: 'MS' },
  'cuiaba': { city: 'Cuiabá', uf: 'MT' },
  'curitiba': { city: 'Curitiba', uf: 'PR' },
  'florianopolis': { city: 'Florianópolis', uf: 'SC' },
  'fortaleza': { city: 'Fortaleza', uf: 'CE' },
  'goiania': { city: 'Goiânia', uf: 'GO' },
  'joao-pessoa': { city: 'João Pessoa', uf: 'PB' },
  'macapa': { city: 'Macapá', uf: 'AP' },
  'maceio': { city: 'Maceió', uf: 'AL' },
  'manaus': { city: 'Manaus', uf: 'AM' },
  'natal': { city: 'Natal', uf: 'RN' },
  'palmas': { city: 'Palmas', uf: 'TO' },
  'porto-alegre': { city: 'Porto Alegre', uf: 'RS' },
  'porto-velho': { city: 'Porto Velho', uf: 'RO' },
  'recife': { city: 'Recife', uf: 'PE' },
  'rio-branco': { city: 'Rio Branco', uf: 'AC' },
  'rio-de-janeiro': { city: 'Rio de Janeiro', uf: 'RJ' },
  'salvador': { city: 'Salvador', uf: 'BA' },
  'sao-luis': { city: 'São Luís', uf: 'MA' },
  'sao-paulo': { city: 'São Paulo', uf: 'SP' },
  'teresina': { city: 'Teresina', uf: 'PI' },
  'vitoria': { city: 'Vitória', uf: 'ES' },
};

export function useDashboardProjects(filters?: UseDashboardProjectsFilters) {
  return useQuery({
    queryKey: ['dashboard-projects', filters],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('id, name, location, city, uf, is_capital, property_type, status, vgv, roi, margin, created_at')
        .order('created_at', { ascending: false });

      // Apply region filter (capital selection)
      if (filters?.region && filters.region !== 'all' && filters.region !== 'brasil') {
        const capital = capitalMap[filters.region];
        if (capital) {
          query = query.eq('city', capital.city).eq('uf', capital.uf);
        }
      }

      // Apply city search filter
      if (filters?.city && filters.city.trim()) {
        query = query.ilike('city', `%${filters.city.trim()}%`);
      }

      // Apply UF filter
      if (filters?.uf && filters.uf.trim()) {
        query = query.eq('uf', filters.uf.trim().toUpperCase());
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []) as DashboardProject[];
    },
  });
}

export function useDashboardStats(filters?: UseDashboardProjectsFilters) {
  const { data: projects, isLoading, error } = useDashboardProjects(filters);

  const stats = {
    activeProjects: projects?.filter(p => p.status !== 'rejected').length || 0,
    totalVgv: projects?.reduce((sum, p) => sum + Number(p.vgv), 0) || 0,
    avgRoi: projects?.length 
      ? projects.reduce((sum, p) => sum + Number(p.roi), 0) / projects.length 
      : 0,
    avgMargin: projects?.length 
      ? projects.reduce((sum, p) => sum + Number(p.margin), 0) / projects.length 
      : 0,
  };

  return { stats, projects, isLoading, error };
}
