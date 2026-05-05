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

async function fixUserRecord() {
    console.log('\n🔧 Corrigindo registro do usuário luizalencar@gmail.com...\n');
    console.log('='.repeat(60));

    const email = 'luizalencar@gmail.com';
    const userId = '998f3d50-edff-4d0d-a460-67388837fc4d';

    // Insert user into users table
    const { data, error } = await supabase
        .from('users')
        .insert({
            id: userId,
            email: email,
            name: email.split('@')[0],
            login_method: 'email',
            role: 'user',
            last_signed_in: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Erro ao criar registro:', error.message);
        return;
    }

    console.log('✅ Registro criado com sucesso na tabela users!');
    console.log('   ID:', data.id);
    console.log('   Email:', data.email);
    console.log('   Nome:', data.name);
    console.log('   Role:', data.role);

    // Create notification preferences
    const { error: prefsError } = await supabase
        .from('notification_preferences')
        .insert({
            user_id: userId,
            weekly_reports: true,
            monthly_reports: true,
            quarterly_reports: true,
            subscription_alerts: true,
            plan_change_alerts: true
        });

    if (prefsError) {
        console.warn('⚠️  Aviso: Não foi possível criar preferências de notificação:', prefsError.message);
    } else {
        console.log('✅ Preferências de notificação criadas!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Correção concluída!\n');
}

fixUserRecord();
