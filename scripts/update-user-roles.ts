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

async function updateUserRole(email: string, role: 'user' | 'admin') {
    console.log('\n' + '='.repeat(60));
    console.log(`🔄 Atualizando role para: ${email}`);
    console.log('='.repeat(60));

    try {
        // Update role in users table
        const { data, error } = await supabase
            .from('users')
            .update({ role: role, updated_at: new Date().toISOString() })
            .eq('email', email)
            .select()
            .single();

        if (error) {
            console.error('❌ Erro ao atualizar role:', error.message);
            return false;
        }

        console.log('✅ Role atualizada com sucesso!');
        console.log('   Email:', data.email);
        console.log('   Nome:', data.name);
        console.log('   Role:', data.role);
        console.log('   Atualizado em:', new Date(data.updated_at).toLocaleString('pt-BR'));

        return true;
    } catch (error) {
        console.error('❌ Erro inesperado:', error);
        return false;
    }
}

async function main() {
    console.log('\n👑 Atualizando usuários para admin...\n');

    const users = [
        { email: 'luizalencar@gmail.com', role: 'admin' as const },
        { email: 'fabioqmarques@gmail.com', role: 'admin' as const },
    ];

    let success = 0;
    let failed = 0;

    for (const user of users) {
        const result = await updateUserRole(user.email, user.role);
        if (result) {
            success++;
        } else {
            failed++;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS');
    console.log('='.repeat(60));
    console.log(`✅ Sucesso: ${success}/${users.length}`);
    console.log(`❌ Falhou: ${failed}/${users.length}`);

    if (success === users.length) {
        console.log('\n🎉 Todos os usuários agora são administradores!');
    }
    console.log('\n');
}

main();
