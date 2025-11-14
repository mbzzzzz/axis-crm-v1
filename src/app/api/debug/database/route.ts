import { NextRequest, NextResponse } from 'next/server';
import postgres from 'postgres';

export async function GET(request: NextRequest) {
  const connectionString = process.env.SUPABASE_DATABASE_URL;
  
  if (!connectionString) {
    return NextResponse.json(
      { error: 'SUPABASE_DATABASE_URL environment variable is not set' },
      { status: 500 }
    );
  }

  const client = postgres(connectionString, { max: 1 });

  try {
    const results: any = {};

    // Check properties table structure
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
    results.tableColumns = tableInfo;

    // Check constraints
    const constraints = await client`
      SELECT 
        conname as constraint_name,
        contype as constraint_type,
        pg_get_constraintdef(oid) as constraint_definition
      FROM pg_constraint
      WHERE conrelid = 'public.properties'::regclass;
    `;
    results.constraints = constraints;

    // Check indexes
    const indexes = await client`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes
      WHERE tablename = 'properties'
        AND schemaname = 'public';
    `;
    results.indexes = indexes;

    // Check sequence for id column
    const sequenceInfo = await client`
      SELECT 
        sequence_name,
        last_value,
        is_called
      FROM information_schema.sequences
      WHERE sequence_schema = 'public'
        AND sequence_name LIKE '%properties%';
    `;
    results.sequences = sequenceInfo;

    // Check all tables
    const allTables = await client`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    results.allTables = allTables;

    // Try a test insert to see the actual error
    let testInsert: any = { success: false };
    try {
      const testResult = await client`
        INSERT INTO properties (
          user_id, title, address, city, state, zip_code, 
          property_type, status, price, currency
        ) VALUES (
          'test_user_id_debug', 'Test Property', '123 Test St', 
          'Test City', 'Test State', '12345', 
          'residential', 'available', 100000, 'USD'
        ) RETURNING id;
      `;
      testInsert = { 
        success: true, 
        insertedId: testResult[0]?.id 
      };
      
      // Clean up test data
      await client`
        DELETE FROM properties WHERE user_id = 'test_user_id_debug';
      `;
    } catch (insertError: any) {
      testInsert = {
        success: false,
        error: {
          code: insertError.code,
          message: insertError.message,
          detail: insertError.detail,
          hint: insertError.hint,
          position: insertError.position,
        }
      };
    }

    results.testInsert = testInsert;

    await client.end();

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    await client.end();
    return NextResponse.json(
      {
        error: 'Database check failed',
        message: error.message,
        code: error.code,
        detail: error.detail,
      },
      { status: 500 }
    );
  }
}

