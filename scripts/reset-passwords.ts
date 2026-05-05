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

async function resetPassword(email: string, newPassword: string) {
    console.log('\n' + '='.repeat(60));
    console.log(`🔄 Resetando senha para: ${email}`);
    console.log('='.repeat(60));

    try {
        // Get user by email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('❌ Erro ao listar usuários:', listError.message);
            return false;
        }

        const user = users.find(u => u.email === email);

        if (!user) {
            console.error('❌ Usuário não encontrado no Supabase Auth');
            return false;
        }

        console.log('✅ Usuário encontrado');
        console.log('   ID:', user.id);
        console.log('   Email:', user.email);

        // Update user password
        const { error } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (error) {
            console.error('❌ Erro ao resetar senha:', error.message);
            return false;
        }

        console.log('✅ Senha resetada com sucesso!');
        console.log('   Nova senha:', newPassword);

        return true;
    } catch (error) {
        console.error('❌ Erro inesperado:', error);
        return false;
    }
}

async function main() {
    console.log('\n🔐 Resetando senhas dos usuários...\n');

    const users = [
        { email: 'luizalencar@gmail.com', password: '123456' },
        { email: 'fabioqmarques@gmail.com', password: '123456' },
    ];

    for (const user of users) {
        await resetPassword(user.email, user.password);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Processo concluído!');
    console.log('='.repeat(60));
    console.log('\n🔐 Credenciais atualizadas:');
    users.forEach(u => {
        console.log(`   Email: ${u.email}`);
        console.log(`   Senha: ${u.password}\n`);
    });
}

main();
