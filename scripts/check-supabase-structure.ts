import postgres from 'postgres';

async function checkDatabaseStructure() {
  const connectionString = process.env.SUPABASE_DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ SUPABASE_DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  // Create a direct postgres connection for raw SQL queries
  const client = postgres(connectionString, { max: 1 });

  try {
    console.log('🔍 Checking Supabase Database Structure...\n');

    // Check if properties table exists and get its structure
    console.log('📊 Checking properties table structure...');
    const tableInfo = await client`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'properties'
      ORDER BY ordinal_position;
    `;

    console.log('\n✅ Properties Table Columns:');
    console.table(tableInfo);

    // Check table constraints
    console.log('\n🔒 Checking constraints...');
    const constraints = await client`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'public.properties'::regclass;
    `;

    if (constraints.length > 0) {
      console.log('\nConstraints:');
      console.table(constraints);
    } else {
      console.log('No constraints found');
    }

    // Check indexes
    console.log('\n📇 Checking indexes...');
    const indexes = await client`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'properties'
        AND schemaname = 'public';
    `;

    if (indexes.length > 0) {
      console.log('\nIndexes:');
      console.table(indexes);
    } else {
      console.log('No indexes found');
    }

    // Check sequence for id column
    console.log('\n🔢 Checking ID sequence...');
    const sequenceInfo = await client`
      SELECT 
        sequence_name,
        last_value,
        is_called
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
        AND sequence_name LIKE '%properties%';
    `;

    if (sequenceInfo.length > 0) {
      console.log('\nSequences:');
      console.table(sequenceInfo);
    } else {
      console.log('No sequences found for properties table');
    }

    // Try a test insert to see the actual error
    console.log('\n🧪 Testing insert structure...');
    try {
      const testResult = await client`
        INSERT INTO properties (
          user_id, title, address, city, state, zip_code, 
          property_type, status, price, currency
        ) VALUES (
          'test_user_id', 'Test Property', '123 Test St', 
          'Test City', 'Test State', '12345', 
          'residential', 'available', 100000, 'USD'
        ) RETURNING id;
      `;
      console.log('✅ Test insert successful!');
      console.log('Inserted ID:', testResult[0]);
      
      // Clean up test data
      await client`
        DELETE FROM properties WHERE user_id = 'test_user_id';
      `;
      console.log('🧹 Test data cleaned up');
    } catch (insertError: any) {
      console.error('❌ Test insert failed:');
      console.error('Error Code:', insertError.code);
      console.error('Error Message:', insertError.message);
      console.error('Error Detail:', insertError.detail);
      console.error('Error Hint:', insertError.hint);
      console.error('Full Error:', insertError);
    }

    // Check all tables
    console.log('\n📋 All tables in database:');
    const allTables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    console.table(allTables);

  } catch (error: any) {
    console.error('❌ Error checking database structure:');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Detail:', error.detail);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the check
checkDatabaseStructure()
  .then(() => {
    console.log('\n✅ Database structure check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Database check failed:', error);
    process.exit(1);
  });

