import postgres from 'postgres';

async function checkPropertiesTable() {
  const connectionString = process.env.SUPABASE_DATABASE_URL;
  
  if (!connectionString) {
    console.error('SUPABASE_DATABASE_URL environment variable is not set');
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });

  try {
    console.log('🔍 Checking properties table structure...\n');

    // Check table columns
    const columns = await client`
      SELECT 
        column_name,
        data_type,
        column_default,
        is_nullable,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_schema = 'public' 
        AND table_name = 'properties'
      ORDER BY ordinal_position;
    `;

    console.log('📋 Table Columns:');
    console.table(columns);

    // Check if id is a serial
    const idColumn = columns.find((col: any) => col.column_name === 'id');
    if (idColumn) {
      console.log('\n🔑 ID Column Details:');
      console.log(`  - Data Type: ${idColumn.data_type}`);
      console.log(`  - Default: ${idColumn.column_default}`);
      console.log(`  - Nullable: ${idColumn.is_nullable}`);
    }

    // Check sequence
    const sequences = await client`
      SELECT 
        sequence_name,
        last_value,
        is_called
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
        AND sequence_name LIKE '%properties%';
    `;

    console.log('\n🔢 Sequences:');
    console.table(sequences);

    // Check constraints
    const constraints = await client`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'public.properties'::regclass;
    `;

    console.log('\n🔒 Constraints:');
    console.table(constraints);

    // Try a test insert to see what happens
    console.log('\n🧪 Testing insert (will rollback)...');
    await client.begin(async (sql) => {
      try {
        const result = await sql`
          INSERT INTO properties (
            user_id, title, address, city, state, zip_code, 
            property_type, status, price, currency
          ) VALUES (
            'test_user_check', 'Test Property', '123 Test St', 
            'Test City', 'Test State', '12345', 
            'residential', 'available', 100000, 'USD'
          ) RETURNING id;
        `;
        console.log('✅ Test insert successful!');
        console.log('Inserted ID:', result[0]?.id);
        throw new Error('Rollback'); // Force rollback
      } catch (error: any) {
        if (error.message === 'Rollback') {
          throw error; // Re-throw to trigger rollback
        }
        console.error('❌ Test insert failed:');
        console.error('Error:', error.message);
        console.error('Code:', error.code);
        console.error('Detail:', error.detail);
        throw error;
      }
    });

  } catch (error: any) {
    if (error.message !== 'Rollback') {
      console.error('\n❌ Error:', error.message);
      console.error('Code:', error.code);
      console.error('Detail:', error.detail);
    }
  } finally {
    await client.end();
  }
}

checkPropertiesTable();

