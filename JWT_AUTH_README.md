# Autenticação Customizada com JWT

Este projeto agora inclui um sistema de autenticação customizada usando JWT (JSON Web Tokens) através das Edge Functions do Supabase.

## 🚀 Funcionalidades

- **Login customizado**: Autenticação usando credenciais do Supabase Auth
- **JWT generation**: Geração de tokens JWT customizados com informações do usuário
- **Token verification**: Validação de tokens JWT
- **Token refresh**: Renovação automática de tokens expirados
- **Role-based access**: Controle de acesso baseado em roles (user/admin)

## ⚙️ Configuração

### 1. Secrets no Supabase Dashboard

Acesse: https://supabase.com/dashboard → Seu projeto → Settings → Edge Functions → Secrets

Adicione estas secrets:

```
SUPABASE_URL=https://azmzmlcvzatfduejddeu.supabase.co
SUPABASE_ANON_KEY=sb_publishable_0EPkj_UV2GWzWn04DkD5eQ_W8nRM3Tq
SUPABASE_SERVICE_ROLE_KEY=[sua-service-role-key]
JWT_SECRET=FLzE2+iohceyCLTGa97BLJcFZdn3CY7AkeG20MEII80=
```

### 2. Deploy da Edge Function

```bash
supabase functions deploy auth-custom
```

### 3. Uso no Frontend

```typescript
import { CustomAuth } from '@/lib/custom-auth-example';

const auth = new CustomAuth();

// Login
const user = await auth.login('user@example.com', 'password');

// Verificar token
const isValid = await auth.verifyToken();

// Logout
auth.logout();
```

## 📡 Endpoints da API

### POST `/functions/v1/auth-custom/login-custom`
Login usando credenciais do Supabase Auth e retorna JWT customizado.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "result": {
    "data": {
      "user": {
        "id": "user-uuid",
        "email": "user@example.com",
        "name": "User Name",
        "role": "admin"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 86400
    }
  }
}
```

### POST `/functions/v1/auth-custom/verify-token`
Verifica se um token JWT é válido.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "result": {
    "data": {
      "user": {
        "id": "user-uuid",
        "email": "user@example.com",
        "name": "User Name",
        "role": "admin"
      },
      "valid": true
    }
  }
}
```

### POST `/functions/v1/auth-custom/refresh-token`
Renova um token JWT expirado.

**Headers:**
```
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "result": {
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expires_in": 86400
    }
  }
}
```

## 🔐 Segurança

- **JWT Secret**: Chave de 256 bits gerada criptograficamente
- **Token Expiry**: Tokens expiram em 24 horas
- **Role-based Access**: Controle de permissões baseado em roles
- **CORS Protection**: Headers CORS configurados
- **Token Validation**: Verificação de assinatura e expiração

## 🧪 Testando

### 1. Login
```bash
curl -X POST https://your-project.supabase.co/functions/v1/auth-custom/login-custom \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

### 2. Verificar Token
```bash
curl -X POST https://your-project.supabase.co/functions/v1/auth-custom/verify-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Refresh Token
```bash
curl -X POST https://your-project.supabase.co/functions/v1/auth-custom/refresh-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔄 Migração

Para migrar da autenticação padrão do Supabase para JWT customizado:

1. Configure as secrets no Supabase Dashboard
2. Deploy a função `auth-custom`
3. Atualize seu frontend para usar `CustomAuth` em vez de `supabase.auth`
4. Teste todas as funcionalidades

## 📝 Próximos Passos

- [ ] Implementar middleware para validação automática de tokens
- [ ] Adicionar suporte a refresh tokens automático
- [ ] Criar sistema de permissões baseado em roles
- [ ] Implementar rate limiting
- [ ] Adicionar logging detalhado de autenticação