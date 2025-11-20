/**
 * Script to check what error the server is returning
 * This helps diagnose 500 errors
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

async function checkServerErrors() {
  const baseUrl = 'http://localhost:3000';
  const apiUrl = `${baseUrl}/api/properties`;

  console.log('🔍 Checking Server Errors\n');
  console.log(`📍 Endpoint: GET ${apiUrl}\n`);

  try {
    console.log('1️⃣ Making request to API...');
    const response = await fetch(apiUrl);
    
    // Check content type
    const contentType = response.headers.get('content-type') || '';
    let data: any;
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // It's HTML (error page)
      const html = await response.text();
      console.log('\n⚠️  Server returned HTML instead of JSON');
      console.log('   This usually means a Next.js error page');
      console.log('\n   HTML Response (first 500 chars):');
      console.log(html.substring(0, 500));
      
      // Try to extract error message from HTML
      const errorMatch = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i) || 
                         html.match(/Error: ([^<]+)/i) ||
                         html.match(/<title>([^<]+)<\/title>/i);
      
      if (errorMatch) {
        console.log('\n   Extracted Error:');
        console.log('   ' + errorMatch[1].trim());
      }
      
      return;
    }

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    console.log(`\n📄 Response Body:`);
    console.log(JSON.stringify(data, null, 2));

    if (response.status === 500) {
      console.log('\n❌ 500 Internal Server Error detected!');
      console.log('\n🔍 Error Analysis:');
      
      if (data.error) {
        console.log(`   Error Message: ${data.error}`);
      }

      if (data.details) {
        console.log('\n   Error Details:');
        console.log(JSON.stringify(data.details, null, 2));
        
        if (data.details.message) {
          console.log(`\n   💡 Most likely causes:`);
          
          if (data.details.message.includes('SUPABASE_DATABASE_URL')) {
            console.log('   - Missing SUPABASE_DATABASE_URL environment variable');
            console.log('   - Fix: Add SUPABASE_DATABASE_URL to .env.local');
          }
          
          if (data.details.message.includes('Clerk') || data.details.message.includes('currentUser')) {
            console.log('   - Clerk authentication error');
            console.log('   - Fix: Check CLERK_SECRET_KEY in .env.local');
          }
          
          if (data.details.message.includes('connection') || data.details.message.includes('ECONNREFUSED')) {
            console.log('   - Database connection error');
            console.log('   - Fix: Check SUPABASE_DATABASE_URL connection string');
          }
        }
      }

      console.log('\n📋 Environment Variables Check:');
      console.log(`   SUPABASE_DATABASE_URL: ${process.env.SUPABASE_DATABASE_URL ? '✅ Set' : '❌ Missing'}`);
      console.log(`   CLERK_SECRET_KEY: ${process.env.CLERK_SECRET_KEY ? '✅ Set' : '❌ Missing'}`);
      console.log(`   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: ${process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? '✅ Set' : '❌ Missing'}`);
    }

  } catch (error: any) {
    console.error('❌ Error making request:', error.message);
    console.error('   Stack:', error.stack);
  }
}

checkServerErrors();

