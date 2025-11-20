import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function checkSupabaseSetup() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const databaseUrl = process.env.SUPABASE_DATABASE_URL;

  console.log('🔍 Checking Supabase Setup...\n');

  // Check environment variables
  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
    return;
  }
  if (!supabaseAnonKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    return;
  }
  if (!databaseUrl) {
    console.error('❌ SUPABASE_DATABASE_URL is not set');
    console.log('💡 You need SUPABASE_DATABASE_URL to check database structure');
    console.log('   Get it from: Supabase Dashboard → Settings → Database → Connection string');
  }

  console.log('✅ Environment variables found');
  console.log(`   Supabase URL: ${supabaseUrl}`);
  console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);
  console.log(`   Database URL: ${databaseUrl ? 'Set' : 'Not set'}\n`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // Check if we can connect
    console.log('📡 Testing Supabase connection...');
    const { data: healthData, error: healthError } = await supabase
      .from('properties')
      .select('id')
      .limit(1);

    if (healthError) {
      console.error('❌ Connection error:', healthError.message);
      console.error('   Code:', healthError.code);
      console.error('   Details:', healthError.details);
      console.error('   Hint:', healthError.hint);
      return;
    }

    console.log('✅ Successfully connected to Supabase\n');

    // Check table structure via RPC (if available) or direct query
    console.log('📋 Checking properties table...');
    
    // Try to get table info via a simple query
    const { data: tableData, error: tableError } = await supabase
      .from('properties')
      .select('*')
      .limit(0);

    if (tableError) {
      console.error('❌ Error accessing properties table:', tableError.message);
      if (tableError.code === 'PGRST116') {
        console.error('   This means the table does not exist!');
        console.error('   💡 Run migrations: npx drizzle-kit push');
      }
      return;
    }

    console.log('✅ Properties table exists\n');

    // If we have database URL, check structure directly
    if (databaseUrl) {
      console.log('🔍 Checking database structure (requires SUPABASE_DATABASE_URL)...');
      console.log('   Run: npx tsx scripts/diagnose-properties-insert.ts');
      console.log('   This will check:');
      console.log('   - ID column sequence');
      console.log('   - Timestamp defaults');
      console.log('   - Table structure\n');
    }

    // Check if we can insert (test with a transaction that rolls back)
    console.log('🧪 Testing INSERT capability...');
    console.log('   Note: This requires proper table structure with sequences');
    console.log('   If INSERT fails, check:');
    console.log('   1. ID column has sequence default');
    console.log('   2. Run migration: drizzle/0005_fix_properties_serial.sql\n');

    console.log('📝 Next Steps:');
    console.log('   1. If table structure issues: Run migration drizzle/0005_fix_properties_serial.sql');
    console.log('   2. Verify sequence exists: Check Supabase SQL Editor');
    console.log('   3. Test property creation in your app');
    console.log('   4. If errors persist, check the diagnostic script output\n');

  } catch (error: any) {
    console.error('❌ Unexpected error:', error.message);
    console.error('   Stack:', error.stack);
  }
}

checkSupabaseSetup();

