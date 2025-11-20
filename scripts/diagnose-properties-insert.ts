import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function diagnosePropertiesInsert() {
  const connectionString = process.env.SUPABASE_DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ SUPABASE_DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });

  try {
    console.log('🔍 Diagnosing properties table INSERT issue...\n');

    // 1. Check table structure
    console.log('📋 Step 1: Checking table structure...');
    const columns = await client`
      SELECT 
        column_name,
        data_type,
        column_default,
        is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'properties'
      ORDER BY ordinal_position;
    `;

    console.table(columns);

    // 2. Check ID column specifically
    const idColumn = columns.find((col: any) => col.column_name === 'id');
    if (idColumn) {
      console.log('\n🔑 ID Column Analysis:');
      console.log(`  - Data Type: ${idColumn.data_type}`);
      console.log(`  - Default: ${idColumn.column_default || 'NULL'}`);
      console.log(`  - Nullable: ${idColumn.is_nullable}`);
      
      if (!idColumn.column_default || !idColumn.column_default.includes('nextval')) {
        console.log('  ⚠️  WARNING: ID column does not have a sequence default!');
        console.log('  💡 Fix: Run migration drizzle/0005_fix_properties_serial.sql');
      } else {
        console.log('  ✅ ID column has proper sequence default');
      }
    }

    // 3. Check sequence
    console.log('\n🔢 Step 2: Checking sequence...');
    const sequences = await client`
      SELECT 
        sequence_name,
        last_value,
        is_called
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
        AND sequence_name = 'properties_id_seq';
    `;

    if (sequences.length === 0) {
      console.log('  ❌ Sequence properties_id_seq does NOT exist!');
      console.log('  💡 Fix: Run migration drizzle/0005_fix_properties_serial.sql');
    } else {
      console.table(sequences);
      console.log('  ✅ Sequence exists');
    }

    // 4. Check timestamps
    console.log('\n⏰ Step 3: Checking timestamp columns...');
    const createdAtCol = columns.find((col: any) => col.column_name === 'created_at');
    const updatedAtCol = columns.find((col: any) => col.column_name === 'updated_at');
    
    if (createdAtCol) {
      console.log(`  created_at: ${createdAtCol.data_type}, Default: ${createdAtCol.column_default || 'NULL'}`);
      if (!createdAtCol.column_default || !createdAtCol.column_default.includes('now()')) {
        console.log('  ⚠️  WARNING: created_at does not have a default timestamp!');
      }
    }
    
    if (updatedAtCol) {
      console.log(`  updated_at: ${updatedAtCol.data_type}, Default: ${updatedAtCol.column_default || 'NULL'}`);
      if (!updatedAtCol.column_default || !updatedAtCol.column_default.includes('now()')) {
        console.log('  ⚠️  WARNING: updated_at does not have a default timestamp!');
      }
    }

    // 5. Test direct SQL insert (without id, created_at, updated_at)
    console.log('\n🧪 Step 4: Testing direct SQL INSERT (excluding auto-generated fields)...');
    try {
      await client.begin(async (sql) => {
        const result = await sql`
          INSERT INTO properties (
            user_id, title, description, address, city, state, zip_code,
            property_type, status, price, currency
          ) VALUES (
            'test_diagnostic_user', 'Test Property Diagnostic', 'Test description',
            '123 Test St', 'Test City', 'Test State', '12345',
            'residential', 'available', 100000, 'USD'
          ) RETURNING id, created_at, updated_at;
        `;
        
        console.log('  ✅ Direct SQL INSERT successful!');
        console.log('  Inserted:', {
          id: result[0]?.id,
          created_at: result[0]?.created_at,
          updated_at: result[0]?.updated_at
        });
        
        // Force rollback
        throw new Error('ROLLBACK_TEST');
      });
    } catch (error: any) {
      if (error.message === 'ROLLBACK_TEST') {
        console.log('  ✅ Test completed (rolled back)');
      } else {
        console.error('  ❌ Direct SQL INSERT failed!');
        console.error('  Error:', error.message);
        console.error('  Code:', error.code);
        console.error('  Detail:', error.detail);
      }
    }

    // 6. Check what Drizzle would generate
    console.log('\n📝 Step 5: Recommendations...');
    console.log('  Based on the analysis above:');
    
    if (!idColumn?.column_default?.includes('nextval')) {
      console.log('  🔧 ACTION REQUIRED: Fix ID column default');
      console.log('     Run: drizzle/0005_fix_properties_serial.sql in Supabase SQL Editor');
    }
    
    if (sequences.length === 0) {
      console.log('  🔧 ACTION REQUIRED: Create sequence');
      console.log('     Run: drizzle/0005_fix_properties_serial.sql in Supabase SQL Editor');
    }

    console.log('\n  💡 Code Fix: Use raw SQL INSERT to exclude auto-generated fields');
    console.log('     This ensures id, created_at, updated_at are NOT in the INSERT statement');

  } catch (error: any) {
    console.error('\n❌ Error during diagnosis:', error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
  } finally {
    await client.end();
  }
}

diagnosePropertiesInsert();

