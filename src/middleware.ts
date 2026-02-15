import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Get app domain from env or use default
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'centroo.com.br'

  // Detect if it's a main domain or tenant subdomain
  const isMainDomain =
    hostname === appDomain ||
    hostname === `www.${appDomain}` ||
    hostname === 'localhost' ||
    hostname.endsWith('.vercel.app')

  // Extract subdomain if it's a tenant domain
  let tenantSubdomain: string | null = null

  if (!isMainDomain && !hostname.endsWith('.vercel.app')) {
    // Remove the app domain to get the subdomain
    if (hostname.endsWith(`.${appDomain}`)) {
      tenantSubdomain = hostname.replace(`.${appDomain}`, '')
    }
  }

  // If it's a tenant subdomain, add it to headers
  if (tenantSubdomain) {
    response.headers.set('x-tenant-subdomain', tenantSubdomain)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
