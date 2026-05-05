-- Verificar e aumentar tamanhos de campos em idi_score_cache
ALTER TABLE public.idi_score_cache ALTER COLUMN tipo_imovel TYPE character varying(50);