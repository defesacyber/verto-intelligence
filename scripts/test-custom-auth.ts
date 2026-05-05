// =============================================
// SCRIPT DE TESTE - AUTENTICAÇÃO CUSTOMIZADA
// =============================================

import fetch from 'node-fetch';

const SUPABASE_URL = 'https://azmzmlcvzatfduejddeu.supabase.co';
const AUTH_CUSTOM_URL = `${SUPABASE_URL}/functions/v1/auth-custom`;

async function testCustomAuth() {
  console.log('🧪 Testando Autenticação Customizada com JWT\n');

  try {
    // Teste 1: Login com credenciais válidas
    console.log('1️⃣ Testando login...');
    const loginResponse = await fetch(`${AUTH_CUSTOM_URL}/login-custom`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'defesacyber@gmail.com', // Substitua por email real
        password: 'password123', // Substitua por senha real
      }),
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      console.log('❌ Login falhou:', error.error);
      return;
    }

    const loginData = await loginResponse.json();
    const { user, token } = loginData.result.data;

    console.log('✅ Login successful!');
    console.log('   User:', user.email);
    console.log('   Role:', user.role);
    console.log('   Token:', token.substring(0, 50) + '...');

    // Teste 2: Verificar token
    console.log('\n2️⃣ Testando verificação de token...');
    const verifyResponse = await fetch(`${AUTH_CUSTOM_URL}/verify-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!verifyResponse.ok) {
      const error = await verifyResponse.json();
      console.log('❌ Verificação falhou:', error.error);
      return;
    }

    const verifyData = await verifyResponse.json();
    console.log('✅ Token válido!');
    console.log('   User ID:', verifyData.result.data.user.id);
    console.log('   Valid:', verifyData.result.data.valid);

    // Teste 3: Refresh token
    console.log('\n3️⃣ Testando refresh de token...');
    const refreshResponse = await fetch(`${AUTH_CUSTOM_URL}/refresh-token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!refreshResponse.ok) {
      const error = await refreshResponse.json();
      console.log('❌ Refresh falhou:', error.error);
      return;
    }

    const refreshData = await refreshResponse.json();
    const newToken = refreshData.result.data.token;

    console.log('✅ Token renovado!');
    console.log('   Novo token:', newToken.substring(0, 50) + '...');
    console.log('   Expira em:', refreshData.result.data.expires_in, 'segundos');

    console.log('\n🎉 Todos os testes passaram!');

  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

// Executar teste
testCustomAuth();