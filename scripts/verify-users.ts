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
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Error: Missing environment variables');
    process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function verifyUsers() {
    console.log('\n🔍 Verificando usuários no Supabase...\n');
    console.log('='.repeat(60));

    const emailsToCheck = ['luizalencar@gmail.com', 'fabioqmarques@gmail.com'];

    for (const email of emailsToCheck) {
        console.log(`\n📧 Verificando: ${email}`);
        console.log('-'.repeat(60));

        // Check in Auth
        const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

        if (authError) {
            console.error('❌ Erro ao listar usuários:', authError.message);
            continue;
        }

        const authUser = authUsers.users.find(u => u.email === email);

        if (authUser) {
            console.log('✅ Encontrado no Supabase Auth');
            console.log('   ID:', authUser.id);
            console.log('   Email:', authUser.email);
            console.log('   Email confirmado:', authUser.email_confirmed_at ? 'Sim' : 'Não');
            console.log('   Criado em:', new Date(authUser.created_at).toLocaleString('pt-BR'));
            console.log('   Último login:', authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca');

            // Check in users table
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (userError) {
                console.log('⚠️  Não encontrado na tabela users');
            } else {
                console.log('✅ Encontrado na tabela users');
                console.log('   Nome:', userData.name);
                console.log('   Role:', userData.role);
                console.log('   Método de login:', userData.login_method);
            }
        } else {
            console.log('❌ Não encontrado no Supabase Auth');
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Verificação concluída!\n');
}

verifyUsers();
