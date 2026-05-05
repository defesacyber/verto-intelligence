// =============================================
// SCRIPT DE TESTE - AUTENTICAÇÃO JWT CUSTOMIZADA
// Execute com: npx tsx scripts/test-jwt-auth.ts
// =============================================

import * as https from 'https';

interface AuthResponse {
  result: {
    data: {
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
      token: string;
      expires_in: number;
    };
  };
}

interface VerifyResponse {
  result: {
    data: {
      user: {
        id: string;
        email: string;
        name: string;
        role: string;
      };
      valid: boolean;
    };
  };
}

function testRequest(path: string, method = 'POST', body: any = null, auth?: string): Promise<{status: number, data: any}> {
  return new Promise((resolve, reject) => {
    const headers: any = {
      'Content-Type': 'application/json'
    };

    if (auth) {
      headers['Authorization'] = `Bearer ${auth}`;
    }

    const options = {
      hostname: 'azmzmlcvzatfduejddeu.supabase.co',
      path: `/functions/v1/auth-custom${path}`,
      method: method,
      headers: headers
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode!, data: json });
        } catch (e) {
          resolve({ status: res.statusCode!, data: data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testJWTAutentication() {
  console.log('🧪 Testando Autenticação Customizada com JWT\n');

  // ⚠️ CONFIGURE SUAS CREDENCIAIS AQUI ⚠️
  const TEST_EMAIL = 'defesacyber@gmail.com'; // Substitua pelo seu email
  const TEST_PASSWORD = 'SUA_SENHA_AQUI'; // Substitua pela sua senha

  if (TEST_PASSWORD === 'SUA_SENHA_AQUI') {
    console.log('❌ ERRO: Configure sua senha real no script!');
    console.log('   Edite o arquivo scripts/test-jwt-auth.ts');
    console.log('   Substitua TEST_PASSWORD pela sua senha real\n');
    return;
  }

  try {
    // Teste 1: Login
    console.log('1️⃣ Testando login...');
    console.log(`   Email: ${TEST_EMAIL}`);

    const loginResult = await testRequest('/login-custom', 'POST', {
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    console.log(`   Status: ${loginResult.status}`);

    if (loginResult.status !== 200) {
      console.log(`❌ Login falhou: ${loginResult.data.error}\n`);
      console.log('💡 Possíveis causas:');
      console.log('   - Email ou senha incorretos');
      console.log('   - Usuário não existe no Supabase Auth');
      console.log('   - Usuário não tem entrada na tabela users');
      console.log('   - Função Edge não está deployada\n');
      return;
    }

    const authData: AuthResponse = loginResult.data;
    const { user, token } = authData.result.data;

    console.log('✅ Login successful!');
    console.log(`   User: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Token: ${token.substring(0, 30)}...`);
    console.log(`   Expires in: ${authData.result.data.expires_in} seconds\n`);

    // Teste 2: Verificar token
    console.log('2️⃣ Testando verificação de token...');
    const verifyResult = await testRequest('/verify-token', 'POST', null, token);
    console.log(`   Status: ${verifyResult.status}`);

    if (verifyResult.status === 200) {
      const verifyData: VerifyResponse = verifyResult.data;
      console.log('✅ Token válido!');
      console.log(`   User ID: ${verifyData.result.data.user.id}`);
      console.log(`   Valid: ${verifyData.result.data.valid}\n`);
    } else {
      console.log(`❌ Token inválido: ${verifyResult.data.error}\n`);
      return;
    }

    // Teste 3: Refresh token
    console.log('3️⃣ Testando refresh de token...');
    const refreshResult = await testRequest('/refresh-token', 'POST', null, token);
    console.log(`   Status: ${refreshResult.status}`);

    if (refreshResult.status === 200) {
      const newToken = refreshResult.data.result.data.token;
      console.log('✅ Token renovado!');
      console.log(`   Novo token: ${newToken.substring(0, 30)}...\n`);
    } else {
      console.log(`❌ Refresh falhou: ${refreshResult.data.error}\n`);
    }

    console.log('🎉 Todos os testes da autenticação JWT passaram!\n');
    console.log('📱 Agora você pode usar a autenticação customizada no seu app!');
    console.log('   Consulte: src/lib/custom-auth-example.ts');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar teste
testJWTAutentication();