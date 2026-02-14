import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // For now, just pass through all requests
  // Auth protection will be handled in page components
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
