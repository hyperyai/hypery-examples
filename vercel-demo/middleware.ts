import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple pass-through middleware for demo app
// No authentication required - this is just a frontend demo
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};


