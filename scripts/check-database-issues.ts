/**
 * Database Diagnostic Script
 * Checks for common issues with the properties table and other tables
 */

import postgres from 'postgres';

const connectionString = process.env.SUPABASE_DATABASE_URL;

if (!connectionString) {
  console.error('SUPABASE_DATABASE_URL environment variable is not set');
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface Issue {
  table: string;
  column?: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  fix?: string;
}

async function checkTable(tableName: string): Promise<Issue[]> {
  const issues: Issue[] = [];

  // Check if table exists
  const tableExists = await client`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    );
  `;

  if (!tableExists[0].exists) {
    issues.push({
      table: tableName,
      severity: 'error',
      message: `Table '${tableName}' does not exist`,
      fix: `Run the migration to create the ${tableName} table`,
    });
    return issues;
  }

  // Get column information
  const columns = await client<ColumnInfo[]>`
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = ${tableName}
    ORDER BY ordinal_position;
  `;

  if (tableName === 'properties') {
    // Check id column
    const idColumn = columns.find((c) => c.column_name === 'id');
    if (!idColumn) {
      issues.push({
        table: tableName,
        column: 'id',
        severity: 'error',
        message: "Column 'id' does not exist",
      });
    } else {
      if (idColumn.data_type !== 'integer') {
        issues.push({
          table: tableName,
          column: 'id',
          severity: 'error',
          message: `Column 'id' has wrong type: ${idColumn.data_type} (expected: integer)`,
        });
      }
      if (!idColumn.column_default || !idColumn.column_default.includes('nextval')) {
        issues.push({
          table: tableName,
          column: 'id',
          severity: 'error',
          message: "Column 'id' does not have a sequence default",
          fix: "Run: ALTER TABLE properties ALTER COLUMN id SET DEFAULT nextval('properties_id_seq');",
        });
      }
    }

    // Check user_id column
    const userIdColumn = columns.find((c) => c.column_name === 'user_id');
    if (!userIdColumn) {
      issues.push({
        table: tableName,
        column: 'user_id',
        severity: 'error',
        message: "Column 'user_id' does not exist",
      });
    } else if (userIdColumn.data_type !== 'text') {
      issues.push({
        table: tableName,
        column: 'user_id',
        severity: 'error',
        message: `Column 'user_id' has wrong type: ${userIdColumn.data_type} (expected: text for Clerk user IDs)`,
        fix: "ALTER TABLE properties ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;",
      });
    }

    // Check timestamps
    const createdAtColumn = columns.find((c) => c.column_name === 'created_at');
    if (createdAtColumn && createdAtColumn.data_type === 'text') {
      issues.push({
        table: tableName,
        column: 'created_at',
        severity: 'error',
        message: "Column 'created_at' is text instead of timestamp",
        fix: "ALTER TABLE properties ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE USING created_at::TIMESTAMP WITH TIME ZONE;",
      });
    }

    // Check JSONB columns
    const amenitiesColumn = columns.find((c) => c.column_name === 'amenities');
    if (amenitiesColumn && amenitiesColumn.data_type !== 'jsonb') {
      issues.push({
        table: tableName,
        column: 'amenities',
        severity: 'warning',
        message: `Column 'amenities' is ${amenitiesColumn.data_type} instead of jsonb`,
        fix: "ALTER TABLE properties ALTER COLUMN amenities TYPE JSONB USING amenities::JSONB;",
      });
    }

    const imagesColumn = columns.find((c) => c.column_name === 'images');
    if (imagesColumn && imagesColumn.data_type !== 'jsonb') {
      issues.push({
        table: tableName,
        column: 'images',
        severity: 'warning',
        message: `Column 'images' is ${imagesColumn.data_type} instead of jsonb`,
        fix: "ALTER TABLE properties ALTER COLUMN images TYPE JSONB USING images::JSONB;",
      });
    }
  }

  if (tableName === 'user_preferences') {
    const idColumn = columns.find((c) => c.column_name === 'id');
    if (!idColumn) {
      issues.push({
        table: tableName,
        column: 'id',
        severity: 'error',
        message: "Column 'id' does not exist",
      });
    }

    const userIdColumn = columns.find((c) => c.column_name === 'user_id');
    if (!userIdColumn) {
      issues.push({
        table: tableName,
        column: 'user_id',
        severity: 'error',
        message: "Column 'user_id' does not exist",
      });
    } else if (userIdColumn.data_type !== 'text') {
      issues.push({
        table: tableName,
        column: 'user_id',
        severity: 'error',
        message: `Column 'user_id' has wrong type: ${userIdColumn.data_type} (expected: text)`,
      });
    }
  }

  return issues;
}

async function main() {
  console.log('🔍 Checking database structure...\n');

  const tablesToCheck = ['properties', 'user_preferences', 'invoices', 'tenants', 'maintenance_requests'];
  const allIssues: Issue[] = [];

  for (const table of tablesToCheck) {
    const issues = await checkTable(table);
    allIssues.push(...issues);
  }

  // Check sequences
  console.log('📊 Checking sequences...');
  const sequences = await client`
    SELECT sequence_name
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
    ORDER BY sequence_name;
  `;
  console.log(`Found ${sequences.length} sequences:`, sequences.map((s) => s.sequence_name).join(', '));

  // Summary
  console.log('\n📋 Summary:');
  const errors = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');
  const infos = allIssues.filter((i) => i.severity === 'info');

  console.log(`\n❌ Errors: ${errors.length}`);
  errors.forEach((issue) => {
    console.log(`  - ${issue.table}${issue.column ? `.${issue.column}` : ''}: ${issue.message}`);
    if (issue.fix) {
      console.log(`    Fix: ${issue.fix}`);
    }
  });

  console.log(`\n⚠️  Warnings: ${warnings.length}`);
  warnings.forEach((issue) => {
    console.log(`  - ${issue.table}${issue.column ? `.${issue.column}` : ''}: ${issue.message}`);
    if (issue.fix) {
      console.log(`    Fix: ${issue.fix}`);
    }
  });

  if (infos.length > 0) {
    console.log(`\nℹ️  Info: ${infos.length}`);
    infos.forEach((issue) => {
      console.log(`  - ${issue.table}${issue.column ? `.${issue.column}` : ''}: ${issue.message}`);
    });
  }

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ No issues found! Database structure looks good.');
  } else {
    console.log('\n💡 Run the suggested fixes in your Supabase SQL Editor.');
  }

  await client.end();
  process.exit(errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});

