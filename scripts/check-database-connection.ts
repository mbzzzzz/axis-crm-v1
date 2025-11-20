/**
 * Script to test database connection and help diagnose password issues
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function checkDatabaseConnection() {
  const connectionString = process.env.SUPABASE_DATABASE_URL;

  console.log('🔍 Checking Database Connection\n');

  if (!connectionString) {
    console.error('❌ SUPABASE_DATABASE_URL is not set in .env.local');
    console.log('\n💡 Add it to .env.local:');
    console.log('   SUPABASE_DATABASE_URL=postgresql://postgres.mzmcibaxgelkndbvopwa:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres');
    return;
  }

  console.log('✅ SUPABASE_DATABASE_URL is set');
  
  // Check if password is placeholder
  if (connectionString.includes('[PASSWORD]') || connectionString.includes('YOUR-PASSWORD')) {
    console.error('\n❌ Connection string contains placeholder password!');
    console.log('   Replace [PASSWORD] or YOUR-PASSWORD with your actual database password');
    return;
  }

  // Extract connection details (without logging the full password)
  const urlMatch = connectionString.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  if (urlMatch) {
    const [, user, password, host, port, database] = urlMatch;
    console.log(`\n📋 Connection Details:`);
    console.log(`   User: ${user}`);
    console.log(`   Password: ${password.length > 0 ? '***' + password.slice(-2) : 'MISSING'}`);
    console.log(`   Host: ${host}`);
    console.log(`   Port: ${port}`);
    console.log(`   Database: ${database}`);
    
    if (!password || password.length < 3) {
      console.error('\n❌ Password appears to be missing or too short!');
      console.log('   Make sure you replaced [PASSWORD] with your actual password');
      return;
    }
  }

  console.log('\n🧪 Testing connection...');
  
  try {
    const client = postgres(connectionString, { 
      max: 1,
      connect_timeout: 5 
    });

    // Try a simple query
    const result = await client`SELECT version() as version`;
    console.log('✅ Connection successful!');
    console.log(`   PostgreSQL version: ${result[0].version.split(' ')[0]} ${result[0].version.split(' ')[1]}`);
    
    // Test properties table access
    const tableCheck = await client`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'properties'
    `;
    
    if (tableCheck[0].count > 0) {
      console.log('✅ Properties table exists');
    } else {
      console.log('⚠️  Properties table not found');
    }

    await client.end();
    
  } catch (error: any) {
    console.error('\n❌ Connection failed!');
    console.error(`   Error: ${error.message}`);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n🔑 Password Authentication Failed');
      console.log('\n💡 How to fix:');
      console.log('   1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/mzmcibaxgelkndbvopwa');
      console.log('   2. Navigate to Settings → Database');
      console.log('   3. Find your database password (or reset it)');
      console.log('   4. Update .env.local with the correct password:');
      console.log('      SUPABASE_DATABASE_URL=postgresql://postgres.mzmcibaxgelkndbvopwa:[ACTUAL-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres');
      console.log('   5. Replace [ACTUAL-PASSWORD] with your real password');
      console.log('   6. Restart your dev server');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🌐 Connection Refused');
      console.log('   Check if the host and port are correct');
    } else if (error.message.includes('does not exist')) {
      console.error('\n📊 Database/User does not exist');
      console.log('   Verify the connection string format');
    } else {
      console.error('\n   Full error:', error);
    }
  }
}

checkDatabaseConnection();

