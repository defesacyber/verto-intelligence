# Checklist de Rollout em Produção

## 1. Estratégia de Banco de Dados (ordem segura)

1. Produção existente (já com migrations):
- Use somente as migrations oficiais com timestamp em [supabase/migrations](supabase/migrations).
- Não execute manualmente [SUPABASE_SETUP.sql](SUPABASE_SETUP.sql) em produção existente.
- Não execute em produção os scripts ad-hoc sem timestamp até consolidar em migration versionada:
  - [supabase/migrations/fix-additional-security-alerts.sql](supabase/migrations/fix-additional-security-alerts.sql)
  - [supabase/migrations/fix-critical-security-alerts.sql](supabase/migrations/fix-critical-security-alerts.sql)

2. Ambiente novo (greenfield):
- Opção A (recomendada): usar o pipeline de migrations em [supabase/migrations](supabase/migrations).
- Opção B (somente bootstrap): executar [SUPABASE_SETUP.sql](SUPABASE_SETUP.sql) uma única vez em banco vazio.

3. Ordem de aplicação (migrations oficiais já no repositório):
- Aplicar em ordem lexicográfica por nome de arquivo dentro de [supabase/migrations](supabase/migrations).
- Últimas migrations críticas já presentes:
  - [supabase/migrations/20260326193000_consolidate_security_hardening.sql](supabase/migrations/20260326193000_consolidate_security_hardening.sql)
  - [supabase/migrations/20260207120000_fix_security_alerts.sql](supabase/migrations/20260207120000_fix_security_alerts.sql)
  - [supabase/migrations/20260207130000_ensure_users_table.sql](supabase/migrations/20260207130000_ensure_users_table.sql)
  - [supabase/migrations/20260207140000_fix_function_search_paths.sql](supabase/migrations/20260207140000_fix_function_search_paths.sql)

## 2. Secrets e Variáveis de Ambiente

## Frontend (host/app)

Obrigatórias:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY

Opcional:
- VITE_TRPC_URL

Referências de uso:
- [src/lib/api.ts](src/lib/api.ts#L9)
- [src/lib/env.ts](src/lib/env.ts#L19)
- [src/lib/trpc.ts](src/lib/trpc.ts#L10)

## Supabase Edge Functions (secrets)

Obrigatórias:
- SUPABASE_URL
- SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- ALLOWED_ORIGINS

Integrações opcionais conforme features habilitadas:
- FIRECRAWL_API_KEY
- RESEND_API_KEY
- DATAZAP_API_KEY
- FIPEZAP_API_KEY
- SECOVI_API_KEY
- ADEMI_API_KEY

Referências de uso:
- [supabase/functions/auth/index.ts](supabase/functions/auth/index.ts#L30)
- [supabase/functions/idi-alert-email/index.ts](supabase/functions/idi-alert-email/index.ts#L57)
- [supabase/functions/firecrawl-search/index.ts](supabase/functions/firecrawl-search/index.ts#L76)
- [supabase/functions/market-indices/index.ts](supabase/functions/market-indices/index.ts#L540)

## 3. Configuração de Segurança antes do Cutover

1. Confirmar verify_jwt por função em [supabase/config.toml](supabase/config.toml):
- auth: false
- demais funções críticas: true

2. Confirmar CORS por ALLOWED_ORIGINS:
- Definir lista explícita de domínios de produção (sem coringa).
- Validar que preflight OPTIONS responde apenas origens permitidas.

3. Confirmar RLS e views:
- Policies de reports completas em [SUPABASE_SETUP.sql](SUPABASE_SETUP.sql#L299).
- Views com security_invoker em [SUPABASE_SETUP.sql](SUPABASE_SETUP.sql#L418).

## 4. Sequência Operacional de Deploy

1. Congelar janela de deploy e comunicar stakeholders.
2. Backup lógico do banco de produção.
3. Aplicar migrations oficiais em [supabase/migrations](supabase/migrations).
4. Atualizar secrets do projeto Supabase (incluindo ALLOWED_ORIGINS).
5. Publicar Edge Functions.
6. Publicar frontend com variáveis VITE corretas.
7. Executar smoke tests.
8. Monitorar logs e métricas por pelo menos 30 minutos.

### Execução automatizada de smoke tests

Script pronto em [scripts/smoke-tests.ps1](scripts/smoke-tests.ps1).

Exemplo:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke-tests.ps1 \
  -SupabaseUrl "https://SEU-PROJETO.supabase.co" \
  -AnonKey "SEU_ANON_KEY" \
  -Email "usuario_teste@dominio.com" \
  -Password "SENHA_USUARIO_TESTE" \
  -Origin "https://seu-dominio-producao.com"
```

## 5. Smoke Tests Pós-Deploy

## Autenticação

1. Login válido retorna 200:
- Endpoint: /functions/v1/auth/login

2. Registro válido retorna 200:
- Endpoint: /functions/v1/auth/register

3. Endpoint protegido sem token retorna 401:
- projects/reports/firecrawl

## APIs de Negócio

1. Projects:
- Listar projetos do usuário autenticado retorna 200.
- Buscar projeto de outro usuário retorna 404 ou 401.

2. Reports:
- Gerar relatório com project_id válido retorna 201.
- Export com report_id inválido retorna 400.

3. Market data:
- list-states e list-cities retornam 200 com payload válido.

4. Firecrawl:
- Usuário não admin retorna 403.
- Admin com payload inválido retorna 400.

## Segurança

1. CORS:
- Origem não permitida deve ser rejeitada por política de origem.

2. JWT:
- Funções com verify_jwt true rejeitam token ausente/inválido.

3. RLS:
- Usuário A não lê dados privados do usuário B em projects/reports.

## 6. Critério de Go/No-Go

Go somente se:
- Build do frontend passou.
- Testes automatizados passaram.
- Lint sem erros bloqueantes.
- Smoke tests de auth, projects, reports e CORS/JWT passaram.
- Logs sem erro crítico em janela de monitoramento inicial.

No-Go se:
- Qualquer falha de autenticação/autorização cruzada de usuário.
- Falha de migration sem rollback validado.
- Endpoint crítico com erro 5xx recorrente.

## 7. Plano de Rollback

1. Reverter deploy do frontend para versão anterior.
2. Reverter funções para versão anterior.
3. Restaurar banco a partir do backup se houver migration destrutiva.
4. Revalidar smoke tests mínimos (login, projects list, reports list).

## 8. Pós-Rollout (D+1)

1. Rotacionar chaves sensíveis se houve exposição durante testes.
2. Consolidar scripts ad-hoc sem timestamp em migration oficial versionada.
3. Registrar evidências de deploy e resultados de smoke tests.
