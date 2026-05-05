-- Aumentar o tamanho do campo UF na tabela idi_score_cache para evitar erros
ALTER TABLE public.idi_score_cache ALTER COLUMN uf TYPE character varying(5);
ALTER TABLE public.idi_score_cache ALTER COLUMN cidade TYPE character varying(255);

-- Garantir que existe um unique constraint correto para o upsert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'idi_score_cache_mes_cidade_uf_tipo_imovel_key'
    ) THEN
        ALTER TABLE public.idi_score_cache ADD CONSTRAINT idi_score_cache_mes_cidade_uf_tipo_imovel_key 
        UNIQUE (mes, cidade, uf, tipo_imovel);
    END IF;
END $$;