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
    console.error('Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env file');
    console.error('\nCurrent values:');
    console.error('VITE_SUPABASE_URL:', supabaseUrl || 'NOT SET');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '***SET***' : 'NOT SET');
    process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

interface UserResult {
    email: string;
    success: boolean;
    error?: string;
}

async function createUser(email: string, password: string): Promise<UserResult> {
    try {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔄 Creating user: ${email}`);
        console.log('='.repeat(60));

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email
        });

        if (authError) {
            console.error('❌ Error creating user in Auth:', authError.message);
            return { email, success: false, error: authError.message };
        }

        console.log('✅ User created successfully in Supabase Auth!');
        console.log('   User ID:', authData.user.id);
        console.log('   Email:', authData.user.email);

        // Insert user into custom users table
        const { error: userError } = await supabase
            .from('users')
            .insert({
                id: authData.user.id,
                email: email,
                name: email.split('@')[0], // Use email prefix as name
                login_method: 'email',
                role: 'user',
                last_signed_in: new Date().toISOString()
            })
            .select()
            .single();

        if (userError) {
            console.error('❌ Error creating user in users table:', userError.message);
            return { email, success: false, error: userError.message };
        }

        console.log('✅ User record created in users table!');

        // Create notification preferences
        const { error: prefsError } = await supabase
            .from('notification_preferences')
            .insert({
                user_id: authData.user.id,
                weekly_reports: true,
                monthly_reports: true,
                quarterly_reports: true,
                subscription_alerts: true,
                plan_change_alerts: true
            });

        if (prefsError) {
            console.warn('⚠️  Warning: Could not create notification preferences:', prefsError.message);
        } else {
            console.log('✅ Notification preferences created!');
        }

        console.log('\n🎉 User creation completed successfully!');

        return { email, success: true };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('❌ Unexpected error:', errorMessage);
        return { email, success: false, error: errorMessage };
    }
}

async function createMultipleUsers(users: Array<{ email: string; password: string }>) {
    console.log('\n🚀 Starting batch user creation...');
    console.log(`📊 Total users to create: ${users.length}\n`);

    const results: UserResult[] = [];

    for (const user of users) {
        const result = await createUser(user.email, user.password);
        results.push(result);

        // Add a small delay between requests to avoid rate limiting
        if (users.indexOf(user) < users.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY');
    console.log('='.repeat(60));

    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log(`\n✅ Successfully created: ${successful.length}/${results.length} users`);
    successful.forEach(r => console.log(`   ✓ ${r.email}`));

    if (failed.length > 0) {
        console.log(`\n❌ Failed: ${failed.length}/${results.length} users`);
        failed.forEach(r => console.log(`   ✗ ${r.email} - ${r.error}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('🔐 Login Credentials (for successful users):');
    console.log('='.repeat(60));
    successful.forEach(r => {
        console.log(`\nEmail: ${r.email}`);
        console.log('Password: 123456');
    });
    console.log('\n');
}

// Define users to create
const usersToCreate = [
    { email: 'luizalencar@gmail.com', password: '123456' },
    { email: 'fabioqmarques@gmail.com', password: '123456' }
];

// Run the script
createMultipleUsers(usersToCreate);
