/**
 * Pre-Deploy Verification Script
 * Verifica se o ambiente está configurado corretamente antes do deploy
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const errors = [];
const warnings = [];
const success = [];

console.log('\n🔍 Verificando configuração de deployment...\n');

// 1. Verificar arquivo .env.production
if (existsSync('.env.production')) {
  success.push('✓ Arquivo .env.production encontrado');

  const envContent = readFileSync('.env.production', 'utf-8');

  // Verificar variáveis obrigatórias
  const requiredVars = [
    'VITE_SUPABASE_PROJECT_ID',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY'
  ];

  requiredVars.forEach(varName => {
    if (envContent.includes(varName) && !envContent.includes(`${varName}=your_`)) {
      success.push(`  ✓ ${varName} configurada`);
    } else {
      errors.push(`  ✗ ${varName} não configurada ou usando valor placeholder`);
    }
  });
} else {
  errors.push('✗ Arquivo .env.production não encontrado');
}

// 2. Verificar package.json
if (existsSync('package.json')) {
  success.push('✓ package.json encontrado');

  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

  // Verificar scripts necessários
  const requiredScripts = ['build', 'preview', 'test'];
  requiredScripts.forEach(script => {
    if (pkg.scripts && pkg.scripts[script]) {
      success.push(`  ✓ Script '${script}' definido`);
    } else {
      warnings.push(`  ⚠ Script '${script}' não encontrado`);
    }
  });

  // Verificar dependências críticas
  const requiredDeps = [
    '@supabase/supabase-js',
    'react',
    'react-dom',
    'react-router-dom',
    '@tanstack/react-query'
  ];

  requiredDeps.forEach(dep => {
    if ((pkg.dependencies && pkg.dependencies[dep]) ||
        (pkg.devDependencies && pkg.devDependencies[dep])) {
      success.push(`  ✓ Dependência '${dep}' instalada`);
    } else {
      errors.push(`  ✗ Dependência '${dep}' não encontrada`);
    }
  });
} else {
  errors.push('✗ package.json não encontrado');
}

// 3. Verificar estrutura Supabase
if (existsSync('supabase')) {
  success.push('✓ Diretório supabase/ encontrado');

  // Verificar config.toml
  if (existsSync('supabase/config.toml')) {
    success.push('  ✓ supabase/config.toml encontrado');

    const configContent = readFileSync('supabase/config.toml', 'utf-8');

    // Verificar JWT verification
    const functionsWithJWT = configContent.match(/verify_jwt\s*=\s*true/g);
    const functionsWithoutJWT = configContent.match(/verify_jwt\s*=\s*false/g);

    if (functionsWithJWT && functionsWithJWT.length > 0) {
      success.push(`  ✓ ${functionsWithJWT.length} funções com JWT habilitado`);
    }

    if (functionsWithoutJWT && functionsWithoutJWT.length > 1) {
      warnings.push(`  ⚠ ${functionsWithoutJWT.length} funções com JWT desabilitado`);
    }
  } else {
    errors.push('  ✗ supabase/config.toml não encontrado');
  }

  // Verificar migrations
  if (existsSync('supabase/migrations')) {
    success.push('  ✓ Diretório migrations/ encontrado');
  } else {
    warnings.push('  ⚠ Diretório migrations/ não encontrado');
  }

  // Verificar Edge Functions
  if (existsSync('supabase/functions')) {
    success.push('  ✓ Diretório functions/ encontrado');

    // Verificar _shared/cors.ts
    if (existsSync('supabase/functions/_shared/cors.ts')) {
      success.push('    ✓ _shared/cors.ts implementado (CORS seguro)');
    } else {
      warnings.push('    ⚠ _shared/cors.ts não encontrado (CORS pode estar inseguro)');
    }
  } else {
    errors.push('  ✗ Diretório functions/ não encontrado');
  }
} else {
  errors.push('✗ Diretório supabase/ não encontrado');
}

// 4. Verificar .gitignore
if (existsSync('.gitignore')) {
  success.push('✓ .gitignore encontrado');

  const gitignoreContent = readFileSync('.gitignore', 'utf-8');

  const sensitiveFiles = ['.env', '.env.local', '.env.production'];
  sensitiveFiles.forEach(file => {
    if (gitignoreContent.includes(file)) {
      success.push(`  ✓ ${file} está no .gitignore`);
    } else {
      errors.push(`  ✗ ${file} NÃO está no .gitignore (RISCO DE SEGURANÇA)`);
    }
  });
} else {
  warnings.push('⚠ .gitignore não encontrado');
}

// 5. Verificar documentação
const docs = [
  'DEPLOYMENT.md',
  'SUPABASE_SECRETS.md',
  'README.md'
];

docs.forEach(doc => {
  if (existsSync(doc)) {
    success.push(`✓ ${doc} disponível`);
  } else {
    warnings.push(`⚠ ${doc} não encontrado`);
  }
});

// 6. Verificar src/lib/api.ts (não deve ter mocks)
if (existsSync('src/lib/api.ts')) {
  const apiContent = readFileSync('src/lib/api.ts', 'utf-8');

  if (apiContent.includes('MOCK') || apiContent.includes('placeholder')) {
    warnings.push('⚠ src/lib/api.ts pode conter código mock ou placeholder');
  } else {
    success.push('✓ src/lib/api.ts parece estar usando APIs reais');
  }

  // Verificar se usa variáveis de ambiente
  if (apiContent.includes('import.meta.env')) {
    success.push('  ✓ Usando variáveis de ambiente (import.meta.env)');
  } else {
    errors.push('  ✗ NÃO está usando variáveis de ambiente');
  }
}

// Imprimir resultados
console.log('\n📊 RESULTADOS:\n');

if (success.length > 0) {
  console.log('✅ SUCESSO:');
  success.forEach(msg => console.log(msg));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️  AVISOS:');
  warnings.forEach(msg => console.log(msg));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ ERROS CRÍTICOS:');
  errors.forEach(msg => console.log(msg));
  console.log('');
}

// Conclusão
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (errors.length === 0) {
  console.log('✅ PRONTO PARA DEPLOY!');
  console.log('');
  console.log('Próximos passos:');
  console.log('1. npm run build (testar build local)');
  console.log('2. npm run preview (verificar build)');
  console.log('3. Configurar secrets no Supabase (ver SUPABASE_SECRETS.md)');
  console.log('4. supabase db push (aplicar migrations)');
  console.log('5. supabase functions deploy (deploy das funções)');
  console.log('6. Deploy do frontend (Vercel/Netlify)');
  process.exit(0);
} else {
  console.log('❌ CORRIJA OS ERROS ANTES DE FAZER DEPLOY');
  console.log('');
  console.log('Verifique os erros listados acima e corrija antes de continuar.');
  process.exit(1);
}
