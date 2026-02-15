import { NextResponse, type NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

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

  // If it's a tenant subdomain
  if (tenantSubdomain) {
    // Clone the URL and add tenant info
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-tenant-subdomain', tenantSubdomain)

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
