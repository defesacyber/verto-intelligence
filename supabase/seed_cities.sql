-- Seed: Popular cidades principais do Brasil
-- Execute este script no Supabase SQL Editor após aplicar as migrations

INSERT INTO public.cities (id, nome, uf, ibge_code, population) VALUES
(3550308, 'São Paulo', 'SP', '3550308', 12396372),
(3304557, 'Rio de Janeiro', 'RJ', '3304557', 6775561),
(3106200, 'Belo Horizonte', 'MG', '3106200', 2530701),
(5300108, 'Brasília', 'DF', '5300108', 3094325),
(4106902, 'Curitiba', 'PR', '4106902', 1963726),
(4314902, 'Porto Alegre', 'RS', '4314902', 1492530),
(1302603, 'Manaus', 'AM', '1302603', 2255903),
(2927408, 'Salvador', 'BA', '2927408', 2900319),
(2304400, 'Fortaleza', 'CE', '2304400', 2703391),
(5208707, 'Goiânia', 'GO', '5208707', 1555626),
(2611606, 'Recife', 'PE', '2611606', 1661017),
(1501402, 'Belém', 'PA', '1501402', 1506420),
(3518800, 'Guarulhos', 'SP', '3518800', 1403694),
(3509502, 'Campinas', 'SP', '3509502', 1223237),
(4205407, 'Florianópolis', 'SC', '4205407', 508826),
(2111300, 'São Luís', 'MA', '2111300', 1115932),
(1600303, 'Macapá', 'AP', '1600303', 522357),
(2704302, 'Maceió', 'AL', '2704302', 1031597),
(2507507, 'João Pessoa', 'PB', '2507507', 825796),
(2800308, 'Aracaju', 'SE', '2800308', 664908),
(1721000, 'Palmas', 'TO', '1721000', 313349),
(1200401, 'Rio Branco', 'AC', '1200401', 419452),
(1100205, 'Porto Velho', 'RO', '1100205', 548952),
(1400100, 'Boa Vista', 'RR', '1400100', 419652),
(5103403, 'Cuiabá', 'MT', '5103403', 650912),
(5002704, 'Campo Grande', 'MS', '5002704', 916001)
ON CONFLICT (id) DO UPDATE SET
  population = EXCLUDED.population,
  updated_at = now();

-- Verificar inserção
SELECT COUNT(*) as total_cidades FROM public.cities;
