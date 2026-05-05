-- Expandir tabela projects com campos adicionais
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS target_audience TEXT DEFAULT 'media',
ADD COLUMN IF NOT EXISTS total_area NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_units INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_unit_size NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS launch_date DATE,
ADD COLUMN IF NOT EXISTS delivery_date DATE,
ADD COLUMN IF NOT EXISTS region_id UUID,
ADD COLUMN IF NOT EXISTS neighborhood_id UUID,
ADD COLUMN IF NOT EXISTS sector_id UUID;

-- Atualizar projetos existentes com valores calculados do VGV
UPDATE public.projects 
SET total_units = CASE 
  WHEN vgv > 0 THEN GREATEST(1, FLOOR(vgv / 500000)::INTEGER)
  ELSE 1 
END,
avg_unit_size = 80,
total_area = CASE 
  WHEN vgv > 0 THEN FLOOR(vgv / 5000)
  ELSE 100 
END
WHERE total_units = 0 OR total_units IS NULL;