# Verto Intelligence v3 — Knowledge Base
> Base de conhecimento completa para IA e desenvolvedores humanos.  
> Última atualização: 2026-05-04 | Versão: 3.0.0

---

## Índice

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura & Decisões de Design](#2-arquitetura--decisões-de-design)
3. [Fluxos de Dados](#3-fluxos-de-dados)
4. [Regras de Negócio](#4-regras-de-negócio)
5. [Guia de Deploy](#5-guia-de-deploy)
6. [Referência de Variáveis de Ambiente](#6-referência-de-variáveis-de-ambiente)
7. [Banco de Dados — Esquema & RLS](#7-banco-de-dados--esquema--rls)
8. [Edge Functions — Catálogo](#8-edge-functions--catálogo)
9. [Testes](#9-testes)
10. [Erros Comuns & Soluções](#10-erros-comuns--soluções)

---

## 1. Visão Geral do Sistema

Verto Intelligence é uma plataforma SaaS de **inteligência imobiliária** voltada a incorporadoras, construtoras e investidores brasileiros. Permite:

- Criar e gerenciar projetos imobiliários com análise de viabilidade financeira completa (VPL, TIR, Payback, Margem).
- Realizar pesquisa de mercado automatizada por cidade (preços FipeZap, indicadores macro do BCB, IDI).
- Gerar relatórios executivos em Excel e PDF.
- Controlar acesso por plano de assinatura (Básico / Profissional / Premium).

### Stack Resumida

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui |
| State management | TanStack Query v5 (React Query) |
| Roteamento | React Router DOM v6 |
| Backend | Supabase (Auth + PostgreSQL + Edge Functions + Storage) |
| Runtime Edge | Deno (Supabase Edge Functions) |
| Pagamentos | Stripe |
| Mapas | Mapbox GL |
| Scraping | Firecrawl API (admin only) |
| CI/CD | GitHub Actions |
| Containerização | Docker + NGINX |

---

## 2. Arquitetura & Decisões de Design

### 2.1 Separação Frontend / Backend

Não existe servidor Node.js dedicado. Todo o BFF (Backend for Frontend) é implementado como **Supabase Edge Functions** (Deno). O frontend React faz requisições diretamente para:

1. `supabase.auth.*` — autenticação
2. `supabase.from(tabela).*` — CRUD com RLS automático
3. `supabase.functions.invoke(nome, { body })` — lógica de negócio complexa, integrações externas

**Por que Edge Functions e não uma API REST própria?**  
Reduz infraestrutura, elimina cold starts severos (Deno é rápido), e o JWT do Supabase Auth valida automaticamente permissões via RLS sem código extra.

### 2.2 Código Splitting de Rotas

```typescript
// Eager (sem lazy) — rotas críticas para TTI mínimo
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Lazy — rotas autenticadas carregam apenas quando acessadas
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Projects  = lazy(() => import("./pages/Projects"));
// ...etc
```

**Regra:** nunca mova `Index`, `Login`, `Signup` ou `NotFound` para lazy. Estas 4 rotas determinam a percepção de performance no primeiro acesso.

### 2.3 React Query — Configuração Global

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,        // dados frescos por 5 min → sem re-fetch desnecessário
      gcTime: 30 * 60 * 1000,          // cache mantido por 30 min (sobrevive navegação)
      retry: 2,
      retryDelay: (i) => Math.min(1000 * 2 ** i, 30000), // backoff exponencial até 30s
      refetchOnWindowFocus: false,      // não re-fetcha ao alt+tab de volta
      refetchOnMount: false,            // não re-fetcha se dados ainda frescos
      refetchOnReconnect: true,         // re-fetcha ao voltar online (mobile-friendly)
    },
    mutations: { retry: 1 },
  },
});
```

**Não altere** `refetchOnWindowFocus` para `true` — causa chamadas desnecessárias à API Supabase e aumenta custo.

### 2.4 Padrão _shared/ nas Edge Functions

Todas as Edge Functions importam de `supabase/functions/_shared/`:

```
_shared/
├── auth.ts           — verifyJWT(), getUserIdFromToken()
├── cors.ts           — getCorsHeaders(), jsonResponse(), errorResponse()
├── rate-limit.ts     — rateLimit(), rateLimitByIP(), rateLimitByUser(), RateLimitPresets
├── validation.ts     — sanitizeString(), validateEmail(), validateUUID(), validateNumber()
├── bcb-client.ts     — fetchBCBSeries(), getLatestValue(), fetchPTAX()
└── market-data-helper.ts — helpers de análise de mercado
```

**Nunca** copie código de CORS ou rate-limit inline em funções individuais. Sempre importe de `_shared/`. Atualizar um arquivo `_shared/` afeta todas as funções automaticamente.

### 2.5 Segurança em Camadas

```
Requisição → CORS preflight → Rate Limit (IP/user) → JWT verify → RLS (Postgres) → Dado
```

1. **CORS** — whitelist via `ALLOWED_ORIGINS` env var (CSV). Em dev, fallback para `localhost:5173` e `localhost:3000`.
2. **Rate Limit** — in-memory store na Edge Function. Presets: `auth` (5/min), `api` (100/min), `sensitive` (3/min).
3. **JWT** — `verifyJWT()` em `_shared/auth.ts` valida o token Supabase antes de qualquer operação.
4. **RLS** — todas as tabelas têm Row Level Security habilitado. Usuário só acessa seus próprios registros.

**Limitação do Rate Limit atual:** o store é in-memory por instância de Edge Function. Se houver múltiplas instâncias simultâneas, o limite não é compartilhado. Para produção de alta escala, substituir por Redis (Upstash).

### 2.6 Autenticação — Fluxo

```
Usuário faz login
  → supabase.auth.signInWithPassword()
  → AuthStateChange dispara em useAuth.ts
  → transformUser() mescla auth.users com public.users
  → Atualiza last_signed_in na tabela public.users
  → Estado global (React context) atualizado
  → AuthGuard libera rotas protegidas
```

O campo `role` vem de `public.users.role` (não de `auth.users.user_metadata`). Roles disponíveis: `'user'` e `'admin'`.

### 2.7 ErrorBoundary

`<ErrorBoundary>` envolve todo o app em `App.tsx`. Se qualquer componente filho lançar uma exceção não tratada durante renderização, o boundary captura e exibe fallback em vez de tela branca.

---

## 3. Fluxos de Dados

### 3.1 Fluxo Completo: Componente → Dados

```
Componente React
  └→ Hook customizado (useProjects, useAuth, useDashboardSummary...)
       └→ useQuery / useMutation (React Query)
            └→ Supabase Client
                 ├→ supabase.from()  → PostgreSQL via REST (RLS automático)
                 └→ supabase.functions.invoke()  → Edge Function (Deno)
                       └→ _shared/ (auth, cors, rate-limit, validation)
                            └→ APIs externas (BCB, FipeZap, Firecrawl, Stripe)
```

### 3.2 Fluxo de Projeto — CRUD Completo

**Criar projeto:**
```
NewProject.tsx
  → useProjects().createProject(input)
  → supabase.from('projects').insert({ ...snake_case_fields, user_id: user.id })
  → RLS valida user_id === auth.uid()
  → Retorna project com id gerado
  → React Query invalida cache 'projects'
  → UI re-renderiza lista atualizada
```

**Analisar viabilidade:**
```
ProjectInputs.tsx
  → useProjects().analyzeProject(project)
  → Converte Project → ProjectInput
  → calculateViability(input)  [100% local, sem chamada de rede]
  → Retorna ViabilityResult com 3 cenários + score
  → Resultado exibido em ProjectAnalysis.tsx
```

**Importante:** `calculateViability()` roda inteiramente no browser, sem edge function. Não há latência de rede nesta operação.

### 3.3 Fluxo de Pesquisa de Mercado (7 Blocos)

A pesquisa de mercado é um wizard de 7 etapas, cada uma chamando a edge function `market-research`:

```
Bloco 1: fetch-macro
  → BCB API: SELIC (432), IPCA (433), INCC (192), IGP-M (189), PIB, câmbio PTAX
  → Cache: staleTime 24h (dados macro mudam devagar)

Bloco 2: fetch-city-data
  → FipeZap: preço médio m², variação 12 meses, por tipo de imóvel
  → Firecrawl (admin): dados suplementares de portais

Bloco 3: fetch-neighborhood-data
  → Bairros da cidade: preço médio, oferta estimada, perfil de renda

Bloco 4: evaluate-product-adequacy
  → Cruza tipo de produto (apartamento/casa/comercial) + público-alvo com dados do bairro
  → Score de adequação 0-100

Bloco 5: calculate-demand
  → IDI: Índice de Demanda Imobiliária (proprietário Verto Intelligence)
  → Fórmula: combinação ponderada de oferta, demanda, variação de preço, renda

Bloco 6: project-sales-velocity
  → VGV estimado ÷ (preço médio m² × absorção mensal do mercado)
  → Resulta em meses para absorção total

Bloco 7: generate-conclusion
  → Consolida todos os blocos anteriores
  → Gera texto de conclusão e recomendação de produto
  → Opcionalmente salva em reports via save-report
```

### 3.4 Fluxo do Dashboard

```
Dashboard.tsx
  → useDashboardSummary(city?)
  → useQuery(['dashboard-summary', city], () =>
      supabase.functions.invoke('dashboard-summary', { body: { city } })
    )
  → Edge Function agrega:
      - Projetos do usuário (últimos 5)
      - Indicadores macro (BCB)
      - IDI da cidade
      - Gráficos de evolução de preços
  → Em caso de erro/timeout: usa FALLBACK_DASHBOARD_DATA hardcoded
  → staleTime: 5min, gcTime: 30min
```

**O fallback de dados do dashboard é intencional** — garante que o usuário sempre vê algo útil mesmo quando a BCB API estiver fora.

### 3.5 Fluxo de Autenticação Detalhado

```
Login.tsx → supabase.auth.signInWithPassword({ email, password })
  ↓ (sucesso)
AuthStateChange event → useAuth.ts onAuthStateChange callback
  ↓
transformUser(supabaseUser, dbUser):
  - id: supabaseUser.id
  - email: supabaseUser.email
  - name: dbUser.name || supabaseUser.user_metadata.full_name
  - role: dbUser.role  ← SEMPRE da tabela public.users, nunca do JWT metadata
  - lifetime_access: dbUser.lifetime_access
  - subscription: carregado separadamente de public.subscriptions
  ↓
supabase.from('users').update({ last_signed_in: new Date().toISOString() })
  ↓
Estado atualizado → AuthGuard libera → redirect para /dashboard
```

---

## 4. Regras de Negócio

### 4.1 Motor Financeiro — Fórmulas Exatas

#### VPL (Valor Presente Líquido / NPV)

```typescript
function calculateNPV(cashFlows: number[], annualDiscountRate: number): number {
  const monthlyRate = (1 + annualDiscountRate / 100) ** (1/12) - 1;
  return cashFlows.reduce((npv, cf, t) => npv + cf / (1 + monthlyRate) ** t, 0);
}
```

- `cashFlows[0]` é o investimento inicial (valor negativo)
- `annualDiscountRate` em percentual (ex: 12 para 12% a.a.)
- Taxa mensal calculada por equivalência geométrica, não divisão simples

#### TIR (Taxa Interna de Retorno / IRR)

```typescript
function calculateIRR(cashFlows: number[], maxIterations = 1000): number | null {
  let rate = 0.01; // estimativa inicial 1% a.m.
  for (let i = 0; i < maxIterations; i++) {
    const npv   = cashFlows.reduce((s, cf, t) => s + cf / (1 + rate) ** t, 0);
    const dnpv  = cashFlows.reduce((s, cf, t) => s - t * cf / (1 + rate) ** (t + 1), 0);
    const delta = npv / dnpv;
    rate -= delta;
    if (Math.abs(delta) < 1e-10) break;
  }
  // Anualiza: ((1 + rate_mensal)^12 - 1) * 100
  return ((1 + rate) ** 12 - 1) * 100;
}
```

Método: Newton-Raphson. Retorna `null` se não convergir em `maxIterations` iterações.

#### Payback com Interpolação Linear

```typescript
function calculatePayback(cashFlows: number[]): number | null {
  let accumulated = 0;
  for (let i = 0; i < cashFlows.length; i++) {
    const prev = accumulated;
    accumulated += cashFlows[i];
    if (accumulated >= 0 && i > 0) {
      // interpolação linear entre mês i-1 e mês i
      return i - 1 + Math.abs(prev) / cashFlows[i];
    }
  }
  return null; // investimento não recuperado no período
}
```

Retorna meses (decimal). `null` indica payback não atingido nos meses fornecidos.

### 4.2 Cenários de Viabilidade

Três cenários calculados automaticamente para cada projeto:

```typescript
const SCENARIO_FACTORS = {
  pessimistic: { salesMultiplier: 0.85, costMultiplier: 1.15, timeMultiplier: 1.30 },
  projected:   { salesMultiplier: 1.00, costMultiplier: 1.00, timeMultiplier: 1.00 },
  optimistic:  { salesMultiplier: 1.12, costMultiplier: 0.92, timeMultiplier: 0.80 },
};
```

Para cada cenário, `calculateScenario()` retorna:
- `vgv`: VGV total ajustado (unidades × preço × fator de vendas)
- `totalCost`: custo total (terreno + construção + outros) × fator de custo
- `profit`: vgv − totalCost
- `margin`: profit / vgv × 100 (%)
- `roi`: profit / totalCost × 100 (%)
- `tir`: TIR simplificada anualizada (%)
- `payback`: meses para recuperação do investimento

### 4.3 Score de Viabilidade (0–100 pontos)

O score consolida 4 dimensões com pesos diferentes:

| Dimensão | Peso | Excelente | Recomendado | Mínimo |
|----------|------|-----------|-------------|--------|
| ROI | 30 pts | ≥ 35% | ≥ 25% | ≥ 15% |
| TIR | 25 pts | ≥ 25% a.a. | ≥ 18% a.a. | ≥ 12% a.a. |
| Margem | 25 pts | ≥ 40% | ≥ 30% | ≥ 20% |
| Payback | 20 pts | ≤ 24 meses | ≤ 36 meses | ≤ 48 meses |

**Lógica de pontuação por dimensão (exemplo ROI):**
```
ROI ≥ excelente  → 30 pts
ROI ≥ recomendado → 20 pts
ROI ≥ mínimo     →  10 pts
ROI < mínimo     →   0 pts
```

**Penalidade:** se o cenário pessimista tiver margem negativa, desconta 15 pontos do total.

**Classificação final:**
- 80–100: ✅ Altamente Viável
- 60–79:  🟡 Viável com ressalvas
- 40–59:  🟠 Viabilidade Questionável
- 0–39:   🔴 Inviável

### 4.4 IDI — Índice de Demanda Imobiliária

O IDI é um indicador proprietário Verto Intelligence calculado pela edge function `market-research` no bloco `calculate-demand`. Combina:

- **Oferta** (imóveis disponíveis vs. histórico da cidade)
- **Demanda** (pesquisas e leads coletados por Firecrawl)
- **Variação de preço 12m** (FipeZap — mercado aquecido = IDI maior)
- **Renda média** do bairro (adequação ao público-alvo)

Retorna score de 0 a 100. Interpretação:
- ≥ 70: Alta demanda, absorção rápida esperada
- 40–69: Demanda moderada, absorção normal
- < 40: Baixa demanda, risco de estoque

### 4.5 Planos de Assinatura

```typescript
const SUBSCRIPTION_PLANS = {
  basico:        { price: 29.90,  projects: 3,         features: ['análise básica', 'relatórios PDF'] },
  profissional:  { price: 39.90,  projects: 10,        features: ['análise avançada', 'pesquisa de mercado', 'relatórios Excel'] },
  premium:       { price: 69.90,  projects: Infinity,  features: ['tudo do profissional', 'API access', 'white-label'] },
};
```

**Regras de limite:**
- Ao criar projeto: verificar `user.subscription.plan` e contar projetos ativos do usuário.
- Usuários com `lifetime_access: true` (tabela `public.users`) ignoram limites de projetos de qualquer plano.
- Projetos com status `cancelado` ou `concluido` **não contam** para o limite do plano.

### 4.6 Tipos de Imóvel e Público-Alvo

**PropertyType:**
```
'apartamento' | 'casa' | 'comercial' | 'terreno' | 'misto'
```

**TargetAudience:**
```
'economico' | 'media' | 'media_alta' | 'alta' | 'luxo'
```

Estes valores são usados na etapa `evaluate-product-adequacy` para cruzar com dados de renda média dos bairros.

### 4.7 Status do Projeto — Ciclo de Vida

```
rascunho → analise → aprovado → em_construcao → concluido
                                                    ↑
rascunho → analise → cancelado ←─────────────────────
```

- `rascunho`: projeto criado sem análise completa
- `analise`: dados inseridos, aguardando validação do viability engine
- `aprovado`: viabilidade validada, projeto aprovado para execução
- `em_construcao`: projeto em andamento físico
- `concluido`: projeto finalizado (não conta para limite de plano)
- `cancelado`: projeto abandonado (não conta para limite de plano)

### 4.8 Indicadores Macro — Séries BCB

```typescript
const BCB_SERIES = {
  SELIC:  432,   // Taxa SELIC meta (% a.a.)
  IPCA:   433,   // IPCA acumulado 12 meses (%)
  INCC:   192,   // INCC-M mensal (%)
  IGPM:   189,   // IGP-M mensal (%)
  INCC_M: 192,   // alias para INCC
};
```

Endpoint BCB: `https://api.bcb.gov.br/dados/serie/bcdata.sgs.{codigo}/dados/ultimos/1?formato=json`

Cache recomendado para indicadores macro: **24 horas** (dados publicados mensalmente pelo BCB).

---

## 5. Guia de Deploy

### 5.1 Pré-requisitos

- Node.js ≥ 18
- npm ≥ 9
- Supabase CLI (`npm install -g supabase`)
- Conta Supabase (projeto criado)
- Conta Stripe (para pagamentos)
- Chave Firecrawl (para scraping — apenas funcionalidade admin)
- Chave Mapbox (para mapas)

### 5.2 Setup Local — Passo a Passo

```bash
# 1. Clone e instale dependências
git clone <repo>
cd verto-intelligence
npm install

# 2. Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas chaves (veja seção 6)

# 3. Inicie Supabase local (opcional, para dev)
supabase start

# 4. Execute migrações
supabase db push

# 5. Deploy das Edge Functions
supabase functions deploy --no-verify-jwt
# (--no-verify-jwt apenas para desenvolvimento; remova em produção)

# 6. Inicie o servidor de desenvolvimento
npm run dev
```

### 5.3 Migrações de Banco de Dados

As migrações ficam em `supabase/migrations/`. Sempre crie novos arquivos de migração, nunca edite os existentes:

```bash
# Criar nova migração
supabase migration new nome_da_migracao

# Aplicar em produção
supabase db push --linked

# Verificar status
supabase migration list
```

**Ordem crítica de migrações:**
1. `create_tables` — cria tabelas básicas (users, projects, subscriptions)
2. `enable_rls` — habilita RLS em todas as tabelas
3. `create_policies` — políticas de acesso por user_id
4. `create_indexes` — índices de performance
5. Migrações subsequentes (features adicionais)

### 5.4 Deploy das Edge Functions

```bash
# Deploy de uma função específica
supabase functions deploy dashboard-summary

# Deploy de todas as funções
supabase functions deploy

# Definir secrets (variáveis de ambiente das funções)
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set FIRECRAWL_API_KEY=fc-...
supabase secrets set ALLOWED_ORIGINS=https://app.vertointelligence.com.br
```

**Lista de secrets necessários para Edge Functions:**

| Secret | Função(ões) que usa |
|--------|---------------------|
| `STRIPE_SECRET_KEY` | subscription-manager, webhook-stripe |
| `STRIPE_WEBHOOK_SECRET` | webhook-stripe |
| `FIRECRAWL_API_KEY` | market-research |
| `ALLOWED_ORIGINS` | todas (CORS whitelist) |
| `BCB_BASE_URL` | market-research, dashboard-summary (opcional, tem default) |

### 5.5 Deploy Frontend

#### Via Vercel (recomendado)

```bash
# Instale Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Configure variáveis de ambiente no dashboard Vercel:
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_MAPBOX_TOKEN, VITE_STRIPE_PUBLISHABLE_KEY
```

#### Via Docker + NGINX

```bash
# Build da imagem
docker build -t verto-intelligence .

# Run
docker run -p 80:80 \
  -e VITE_SUPABASE_URL=https://xxx.supabase.co \
  -e VITE_SUPABASE_ANON_KEY=eyJ... \
  verto-intelligence
```

O `Dockerfile` faz multi-stage build (node:18-alpine para build, nginx:alpine para serve). O `nginx.conf` configura SPA routing (`try_files $uri $uri/ /index.html`).

### 5.6 Configuração Stripe

```bash
# 1. Crie produtos e preços no Stripe Dashboard
#    - Básico: R$ 29,90/mês
#    - Profissional: R$ 39,90/mês
#    - Premium: R$ 69,90/mês

# 2. Configure webhook no Stripe Dashboard:
#    URL: https://xxx.supabase.co/functions/v1/webhook-stripe
#    Eventos: checkout.session.completed, customer.subscription.updated,
#             customer.subscription.deleted, invoice.payment_failed

# 3. Copie o Webhook Signing Secret para:
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5.7 Verificação de Pre-Deploy

O script `scripts/pre-deploy-check.js` (executado em `npm run build:prod`) valida:

- Existência de `.env.production` com todas as variáveis obrigatórias
- `package.json` com version definida
- `supabase/config.toml` presente
- `.gitignore` cobrindo `.env*` e `node_modules`
- Existência desta documentação

Se qualquer checagem falhar, o build é abortado com mensagem de erro clara.

### 5.8 CI/CD — GitHub Actions

Arquivo: `.github/workflows/ci.yml`

**Triggers:** push para `main` e `develop`

**Steps:**
1. Checkout
2. Setup Node 20
3. `npm ci` (install limpo)
4. `npm run lint` (ESLint)
5. `tsc --noEmit` (typecheck)
6. `npm run test:coverage` (vitest + coverage)
7. `npm run build` (vite build)

**Para habilitar deploy automático:** adicione steps de deploy após o build usando secrets do repositório GitHub.

---

## 6. Referência de Variáveis de Ambiente

### Frontend (prefixo `VITE_`)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | ✅ | URL do projeto Supabase (ex: `https://abc.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Chave anônima pública do Supabase |
| `VITE_MAPBOX_TOKEN` | ✅ | Token público Mapbox para mapas |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ✅ | Chave pública Stripe |
| `VITE_APP_URL` | recomendado | URL da aplicação em produção |

### Edge Functions (Supabase Secrets)

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `STRIPE_SECRET_KEY` | ✅ | Chave secreta Stripe (`sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | Secret de assinatura do webhook Stripe |
| `FIRECRAWL_API_KEY` | admin only | Chave Firecrawl para scraping |
| `ALLOWED_ORIGINS` | ✅ prod | CSV de origens permitidas (CORS) |
| `BCB_BASE_URL` | opcional | Default: `https://api.bcb.gov.br` |

**Atenção:** variáveis `VITE_*` são expostas no bundle do frontend. Nunca coloque chaves secretas com prefixo `VITE_`.

---

## 7. Banco de Dados — Esquema & RLS

### 7.1 Tabelas Principais

#### `public.users`
```sql
id              uuid PRIMARY KEY REFERENCES auth.users(id)
email           text NOT NULL
name            text
role            text DEFAULT 'user'  -- 'user' | 'admin'
lifetime_access boolean DEFAULT false
last_signed_in  timestamptz
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

#### `public.projects`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE
name            text NOT NULL
description     text
property_type   text  -- 'apartamento' | 'casa' | 'comercial' | 'terreno' | 'misto'
target_audience text  -- 'economico' | 'media' | 'media_alta' | 'alta' | 'luxo'
city            text
state           text
total_area      numeric
units           integer
price_per_sqm   numeric
construction_cost_per_sqm numeric
land_cost       numeric
other_costs     numeric
status          text DEFAULT 'rascunho'
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

#### `public.subscriptions`
```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid REFERENCES public.users(id) ON DELETE CASCADE
plan            text  -- 'basico' | 'profissional' | 'premium'
status          text  -- 'active' | 'canceled' | 'past_due'
stripe_customer_id      text
stripe_subscription_id  text
current_period_start    timestamptz
current_period_end      timestamptz
created_at      timestamptz DEFAULT now()
updated_at      timestamptz DEFAULT now()
```

#### `public.reports`
```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES public.users(id) ON DELETE CASCADE
project_id  uuid REFERENCES public.projects(id) ON DELETE SET NULL
title       text NOT NULL
type        text  -- 'viability' | 'market' | 'executive'
data        jsonb  -- dados completos do relatório
file_url    text   -- URL no Supabase Storage (se gerado)
created_at  timestamptz DEFAULT now()
```

### 7.2 Políticas RLS Padrão

Cada tabela tem políticas que garantem isolamento por usuário:

```sql
-- Exemplo para public.projects
CREATE POLICY "Users can view own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);
```

**Admins** têm políticas separadas com `EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')`.

### 7.3 Trigger de Sincronização

Ao criar usuário via `auth.users` (cadastro), um trigger sincroniza automaticamente para `public.users`:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 8. Edge Functions — Catálogo

| Função | Método | Auth | Rate Limit | Descrição |
|--------|--------|------|-----------|-----------|
| `dashboard-summary` | POST | JWT | 100/min/user | Agrega dados do dashboard |
| `market-research` | POST | JWT | 60/min/IP | Wizard de pesquisa de mercado (8 actions) |
| `generate-report` | POST | JWT | 10/min/user | Gera PDF/Excel de relatórios |
| `subscription-manager` | POST | JWT | 10/min/user | Gerencia assinaturas Stripe |
| `webhook-stripe` | POST | None | N/A | Recebe eventos Stripe |
| `admin-scraper` | POST | JWT+Admin | 5/min | Scraping via Firecrawl (admin only) |
| `bcb-proxy` | GET | None | 30/min/IP | Proxy para API BCB (cache de 24h) |

### Anatomia de uma Edge Function

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest, jsonResponse, errorResponse } from "../_shared/cors.ts";
import { verifyJWT } from "../_shared/auth.ts";
import { rateLimitByUser, RateLimitPresets } from "../_shared/rate-limit.ts";

serve(async (req) => {
  const origin = req.headers.get('origin');
  
  // 1. CORS preflight
  if (req.method === 'OPTIONS') return handleCorsPreflightRequest(origin);
  
  // 2. Autenticação
  const { user, error: authError } = await verifyJWT(req);
  if (authError) return errorResponse('Unauthorized', 401, origin);
  
  // 3. Rate limiting
  const limited = await rateLimitByUser(user.id, RateLimitPresets.api);
  if (limited) return errorResponse('Rate limit exceeded', 429, origin);
  
  // 4. Lógica de negócio
  try {
    const body = await req.json();
    // ... processamento
    return jsonResponse({ data: resultado }, 200, origin);
  } catch (err) {
    return errorResponse(err.message, 500, origin);
  }
});
```

---

## 9. Testes

### Estrutura

```
src/
└── test/
    ├── setup.ts                    — configura @testing-library/jest-dom globalmente
    ├── lib/
    │   ├── financial-engine.test.ts
    │   └── viability-calculator.test.ts
    └── hooks/
        └── useAuth.test.ts
```

### Executar Testes

```bash
npm test               # modo watch (desenvolvimento)
npm run test:run       # execução única (CI)
npm run test:coverage  # com relatório de cobertura
npm run test:ui        # UI interativa do vitest
```

### Cobertura Mínima Esperada

O `vitest.config.ts` define thresholds de cobertura:
- Branches: 70%
- Functions: 80%
- Lines: 80%
- Statements: 80%

### O Que Testar (e o Que Não Testar)

**Testar:**
- `calculateNPV()`, `calculateIRR()`, `calculatePayback()` — lógica financeira crítica
- `calculateViability()`, `calculateScenario()` — scoring e cenários
- `transformUser()` — transformação de dados de autenticação
- `sanitizeString()`, `validateEmail()` etc. — validação de inputs

**Não testar (deixe para o Supabase testar):**
- RLS policies (testadas via integration tests no Supabase)
- Edge Functions individualmente (use Supabase Function Tests se necessário)
- Componentes UI triviais (botões, inputs sem lógica)

---

## 10. Erros Comuns & Soluções

### `PGRST116: JWT expired`
**Causa:** Token Supabase expirado (padrão: 1 hora).  
**Solução:** O `supabase-js` renova tokens automaticamente via `onAuthStateChange`. Se ocorrer, verificar se `supabase.auth.getSession()` está sendo chamado corretamente em `useAuth.ts`.

### `FunctionsHttpError: 429 Rate limit exceeded`
**Causa:** Usuário ou IP atingiu o limite da edge function.  
**Solução no frontend:** implementar retry com exponential backoff. O React Query já faz isso automaticamente com `retryDelay`.  
**Solução no backend:** verificar se o preset correto está sendo usado — `RateLimitPresets.api` (100/min) vs `RateLimitPresets.auth` (5/min).

### `CORS error` em desenvolvimento
**Causa:** `ALLOWED_ORIGINS` não configurado nas Edge Functions.  
**Solução:** Em desenvolvimento local, `cors.ts` faz fallback automático para `localhost:5173`. Para produção, configure o secret:
```bash
supabase secrets set ALLOWED_ORIGINS=https://app.vertointelligence.com.br
```

### `calculateIRR` retorna `null`
**Causa:** Fluxo de caixa sem cruzamento de zero (todos negativos ou todos positivos), ou projeto com parâmetros extremos.  
**Solução:** Verificar se `cashFlows` contém pelo menos um valor positivo e um negativo. Exibir `N/A` na UI quando `tir === null`.

### React Query retorna dados obsoletos após mutação
**Causa:** Cache não foi invalidado após `useMutation`.  
**Solução:** Sempre chamar `queryClient.invalidateQueries({ queryKey: ['projects'] })` no `onSuccess` da mutation.

```typescript
useMutation({
  mutationFn: createProject,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['projects'] });
  },
});
```

### Stripe Webhook 400 — `No signatures found matching the expected signature`
**Causa:** `STRIPE_WEBHOOK_SECRET` incorreto ou corpo da requisição foi modificado antes da validação.  
**Solução:** O corpo **deve** ser lido como `ArrayBuffer` antes de verificar assinatura:
```typescript
const body = await req.arrayBuffer();
const signature = req.headers.get('stripe-signature');
const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
```

### Edge Function timeout (> 10s)
**Causa:** Chamadas a APIs externas lentas (BCB, FipeZap).  
**Solução:** Implemente `Promise.allSettled()` para chamadas paralelas e defina timeout explícito com `AbortController`:
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 8000);
const resp = await fetch(url, { signal: controller.signal });
clearTimeout(timeout);
```

---

## Apêndice: Convenções de Código

### Nomenclatura
- **Tabelas Postgres:** `snake_case` (ex: `user_id`, `created_at`)
- **Tipos TypeScript:** `camelCase` (ex: `userId`, `createdAt`)
- **Hooks:** prefixo `use` + PascalCase (ex: `useProjects`, `useAuth`)
- **Componentes:** PascalCase (ex: `ProjectCard`, `DashboardMetric`)
- **Constantes:** `UPPER_SNAKE_CASE` (ex: `VIABILITY_THRESHOLDS`, `BCB_SERIES`)

### Imports — Ordem
1. Bibliotecas externas (`react`, `react-router-dom`, etc.)
2. Componentes UI (`@/components/ui/...`)
3. Componentes da aplicação (`@/components/...`)
4. Hooks (`@/hooks/...`)
5. Libs e utilitários (`@/lib/...`)
6. Tipos (`@/types/...`)

### Tratamento de Erros
- Sempre `try/catch` em chamadas a `supabase.functions.invoke()`
- Logar erros com `console.error` (não `console.log`) para facilitar filtros em produção
- Exibir mensagens amigáveis ao usuário via `toast()` (sonner), nunca mensagens técnicas raw

---

*Documento gerado automaticamente a partir da análise do repositório Verto Intelligence v3.*  
*Para dúvidas sobre decisões de arquitetura, consultar `ANALISE_COMPARATIVA_PREMIUM.md` na raiz do projeto.*
