import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing environment variables');
    process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin(email: string, password: string) {
    console.log('\n' + '='.repeat(60));
    console.log(`🔐 Testando login: ${email}`);
    console.log('='.repeat(60));

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error('❌ Erro no login:', error.message);
            console.error('   Código:', error.status);
            console.error('   Detalhes:', JSON.stringify(error, null, 2));
            return false;
        }

        console.log('✅ Login bem-sucedido!');
        console.log('   User ID:', data.user.id);
        console.log('   Email:', data.user.email);
        console.log('   Email confirmado:', data.user.email_confirmed_at ? 'Sim' : 'Não');

        // Check if user exists in users table
        const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .maybeSingle();

        if (dbError) {
            console.warn('⚠️  Erro ao buscar usuário na tabela users:', dbError.message);
        } else if (dbUser) {
            console.log('✅ Usuário encontrado na tabela users');
            console.log('   Nome:', dbUser.name);
            console.log('   Role:', dbUser.role);
        } else {
            console.warn('⚠️  Usuário NÃO encontrado na tabela users');
        }

        // Sign out
        await supabase.auth.signOut();

        return true;
    } catch (error) {
        console.error('❌ Erro inesperado:', error);
        return false;
    }
}

async function runTests() {
    console.log('\n🧪 Iniciando testes de login...\n');

    const tests = [
        { email: 'luizalencar@gmail.com', password: '123456' },
        { email: 'fabioqmarques@gmail.com', password: '123456' },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        const success = await testLogin(test.email, test.password);
        if (success) {
            passed++;
        } else {
            failed++;
        }

        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS');
    console.log('='.repeat(60));
    console.log(`✅ Passou: ${passed}/${tests.length}`);
    console.log(`❌ Falhou: ${failed}/${tests.length}`);
    console.log('\n');
}

runTests();
