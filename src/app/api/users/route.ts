import { NextRequest, NextResponse } from 'next/server';
// Note: Users are managed by Supabase Auth, not stored in database
// This route is kept for backward compatibility but returns not implemented

// Note: Helper functions removed as they're no longer needed

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'User management is handled by Supabase authentication. Use Supabase dashboard/APIs to manage users.',
      code: 'NOT_IMPLEMENTED' 
    },
    { status: 501 }
  );
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'User management is handled by Supabase authentication. Use Supabase dashboard/APIs to manage users.',
      code: 'NOT_IMPLEMENTED' 
    },
    { status: 501 }
  );
}

export async function PUT(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'User management is handled by Supabase authentication. Use Supabase dashboard/APIs to manage users.',
      code: 'NOT_IMPLEMENTED' 
    },
    { status: 501 }
  );
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json(
    { 
      error: 'User management is handled by Supabase authentication. Use Supabase dashboard/APIs to manage users.',
      code: 'NOT_IMPLEMENTED' 
    },
    { status: 501 }
  );
}