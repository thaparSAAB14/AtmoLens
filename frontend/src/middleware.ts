import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add direct Vercel Edge Config or redirect logic if needed.
  // Currently, we ensure the root points to the app correctly.
  return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/:path*',
}
