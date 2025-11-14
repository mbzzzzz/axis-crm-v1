import postgres from 'postgres';

async function fixPropertiesTable() {
  const connectionString = process.env.SUPABASE_DATABASE_URL;
  
  if (!connectionString) {
    console.error('SUPABASE_DATABASE_URL environment variable is not set');
    console.error('Please set it in your .env.local file');
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });

  try {
    console.log('🔍 Checking properties table structure...\n');

    // Check current structure
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

    console.log('📋 Current Table Structure:');
    console.table(columns);

    // Check if id is a serial
    const idColumn = columns.find((col: any) => col.column_name === 'id');
    const userIdColumn = columns.find((col: any) => col.column_name === 'user_id');
    const createdAtColumn = columns.find((col: any) => col.column_name === 'created_at');

    console.log('\n🔑 Key Column Analysis:');
    if (idColumn) {
      console.log(`  ID Column:`);
      console.log(`    - Type: ${idColumn.data_type}`);
      console.log(`    - Default: ${idColumn.column_default || 'NULL'}`);
      console.log(`    - Is Serial: ${idColumn.column_default?.includes('nextval') || false}`);
    }

    if (userIdColumn) {
      console.log(`  User ID Column:`);
      console.log(`    - Type: ${userIdColumn.data_type}`);
      console.log(`    - Should be: TEXT (for Clerk user IDs)`);
    }

    if (createdAtColumn) {
      console.log(`  Created At Column:`);
      console.log(`    - Type: ${createdAtColumn.data_type}`);
      console.log(`    - Default: ${createdAtColumn.column_default || 'NULL'}`);
      console.log(`    - Should be: TIMESTAMP WITH TIME ZONE`);
    }

    // Check for sequence
    const sequences = await client`
      SELECT 
        sequence_name,
        last_value,
        is_called
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
        AND sequence_name LIKE '%properties_id%';
    `;

    console.log('\n🔢 Sequences:');
    if (sequences.length > 0) {
      console.table(sequences);
    } else {
      console.log('  ❌ No sequence found for properties.id - this is the problem!');
      console.log('  The id column needs to be a SERIAL type.');
    }

    // Provide recommendations
    console.log('\n💡 Recommendations:');
    
    if (!idColumn?.column_default?.includes('nextval')) {
      console.log('  ❌ ID column is not a SERIAL - needs to be fixed');
      console.log('  Run: ALTER TABLE properties ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY;');
    }

    if (userIdColumn?.data_type !== 'text') {
      console.log('  ❌ user_id column is not TEXT - needs to be TEXT for Clerk user IDs');
      console.log('  This requires data migration - backup first!');
    }

    if (createdAtColumn?.data_type === 'text') {
      console.log('  ❌ created_at is TEXT instead of TIMESTAMP - needs migration');
    }

    if (sequences.length === 0) {
      console.log('\n🔧 Fix: Create sequence for id column');
      console.log('Run this SQL in Supabase SQL Editor:');
      console.log(`
-- Create sequence for properties.id
CREATE SEQUENCE IF NOT EXISTS properties_id_seq;
ALTER TABLE properties ALTER COLUMN id SET DEFAULT nextval('properties_id_seq');
ALTER SEQUENCE properties_id_seq OWNED BY properties.id;
      `);
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
  } finally {
    await client.end();
  }
}

fixPropertiesTable();

