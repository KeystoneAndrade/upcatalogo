import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({
            request: { headers: request.headers },
          })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  await supabase.auth.getSession()

  // Multi-tenancy
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'upcatalogo.com.br'
  const isMainDomain =
    hostname === appDomain ||
    hostname === `www.${appDomain}` ||
    hostname === 'localhost' ||
    hostname.endsWith('.vercel.app') // Suporte para domínios Vercel

  let tenantSubdomain: string | null = null
  let tenantCustomDomain: string | null = null

  if (!isMainDomain) {
    if (hostname.endsWith(`.${appDomain}`)) {
      tenantSubdomain = hostname.replace(`.${appDomain}`, '')
    } else if (hostname !== 'localhost' && !hostname.endsWith('.vercel.app')) {
      tenantCustomDomain = hostname
    }
  }

  const isStorefrontRoute =
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/auth') &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/static')

  if (isStorefrontRoute && (tenantSubdomain || tenantCustomDomain)) {
    let tenant = null

    if (tenantSubdomain) {
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('subdomain', tenantSubdomain)
        .eq('status', 'active')
        .single()
      tenant = data
    } else if (tenantCustomDomain) {
      const { data } = await supabase
        .from('tenants')
        .select('*')
        .eq('custom_domain', tenantCustomDomain)
        .eq('status', 'active')
        .single()
      tenant = data
    }

    if (!tenant) {
      return NextResponse.rewrite(new URL('/404', request.url))
    }

    response.headers.set('x-tenant-id', tenant.id)
    response.headers.set('x-tenant-subdomain', tenant.subdomain)
  }

  // Auth protection
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (pathname.startsWith('/dashboard')) {
    if (!session) {
      const redirectUrl = request.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }

  if (pathname.startsWith('/auth/') && session) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
