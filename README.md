# Verto Intelligence v3 — Inteligência Imobiliária

> **Versão premium** consolidada a partir do melhor de dois repositórios anteriores.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Supabase (Auth, Database, Edge Functions, Storage)
- **Pagamentos**: Stripe (subscriptions)
- **Mapas**: Mapbox GL
- **Charts**: Recharts
- **PDF**: jsPDF v4 + jsPDF-autotable
- **Excel**: ExcelJS (streaming, formatação avançada)
- **Dados macro**: Banco Central do Brasil (BCB API)
- **Scraping**: Firecrawl (somente admin)

## Funcionalidades principais

- Dashboard imobiliário com indicadores IDI, FipeZap, BCB em tempo real
- Pesquisa de Mercado Wizard (7 blocos: Macro, Cidade, Bairro, Concorrentes, Demanda, Velocidade, Conclusão)
- Motor Financeiro: NPV, TIR (Newton-Raphson), Payback, Fluxo de Caixa
- Análise de Viabilidade por projeto
- Exportação PDF e Excel de relatórios
- Sistema de alertas IDI por e-mail
- Comparativo de cidades
- Assinaturas com Stripe
- Tour guiado para novos usuários

## Segurança

- Rate limiting por IP (100 req/min) e por usuário
- Validação e sanitização de inputs em todas as edge functions
- CORS com whitelist de origens
- JWT verificado em rotas autenticadas
- RLS (Row Level Security) em todas as tabelas
- Views com `security_invoker = true`
- Functions com `search_path = public, pg_temp`

## Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento local
npm run dev

# Testes
npm run test          # watch mode
npm run test:run      # single run
npm run test:coverage # com coverage report
npm run test:ui       # UI visual do vitest

# Build
npm run build:dev     # desenvolvimento
npm run build:prod    # produção (roda pre-deploy-check antes)

# Lint
npm run lint
```

## Deploy

```bash
# Verificar configuração antes do deploy
node scripts/pre-deploy-check.js

# Aplicar migrations no Supabase
supabase db push

# Deploy das edge functions
supabase functions deploy

# Build e deploy do frontend (Vercel/Netlify)
npm run build:prod
```

## Estrutura

```
src/
├── components/
│   ├── ErrorBoundary.tsx        # Captura de erros React
│   ├── auth/AuthGuard.tsx       # Proteção de rotas
│   ├── dashboard/               # Cards e widgets do dashboard
│   ├── landing/                 # Landing page e onboarding
│   ├── layout/DashboardLayout   # Layout autenticado com sidebar
│   ├── market-research/         # Wizard de pesquisa de mercado
│   └── market/                  # Componentes de mercado
├── contexts/
│   └── SidebarContext.tsx       # Estado do sidebar (localStorage)
├── hooks/                       # Hooks customizados
├── lib/
│   ├── engine/
│   │   └── financial-engine.ts  # NPV, TIR, Payback, CashFlow
│   ├── env.ts                   # Validação de variáveis de ambiente
│   ├── performance.ts           # debounce, throttle, hooks de performance
│   └── project-schema.ts        # Schema Zod para formulários
├── pages/                       # Páginas (lazy loaded exceto críticas)
├── test/                        # Setup e utilitários de teste
└── types/                       # Tipos TypeScript por domínio

supabase/
├── functions/
│   ├── _shared/
│   │   ├── auth.ts              # verifyJWT reutilizável
│   │   ├── cors.ts              # CORS com helpers jsonResponse/errorResponse
│   │   ├── rate-limit.ts        # Rate limiting por IP e usuário
│   │   ├── validation.ts        # Sanitização de inputs
│   │   └── bcb-client.ts        # Cliente BCB (SELIC, IPCA, INCC...)
│   ├── market-research/         # Pesquisa de mercado (8 ações)
│   ├── subscriptions/           # Stripe subscriptions
│   ├── firecrawl-search/        # Scraping (somente admin)
│   └── [demais funções]
└── migrations/                  # 26+ migrations com security hardening
```

## Variáveis de ambiente

```env
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...

# Edge Functions (Supabase secrets)
ALLOWED_ORIGINS=https://app.vertointelligence.com.br,https://www.vertointelligence.com.br
FIRECRAWL_API_KEY=fc-...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
