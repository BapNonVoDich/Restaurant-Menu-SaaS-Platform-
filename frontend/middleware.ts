import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8080/api'

function normalizeHost(host: string | null): string | null {
  if (!host) return null
  const h = host.split(':')[0]?.trim().toLowerCase()
  return h || null
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/setup') ||
    pathname.startsWith('/payment')
  ) {
    return NextResponse.next()
  }

  const host = normalizeHost(request.headers.get('host'))
  if (!host) {
    return NextResponse.next()
  }

  const platformHosts = (process.env.NEXT_PUBLIC_PLATFORM_HOSTS || 'localhost,127.0.0.1')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN?.trim().toLowerCase()
  if (platformHosts.includes(host) || (appDomain && host === appDomain)) {
    return NextResponse.next()
  }

  try {
    const url = `${API_BASE.replace(/\/$/, '')}/catalog/stores/resolve-host?host=${encodeURIComponent(host)}`
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    })
    if (!res.ok) {
      return NextResponse.next()
    }
    const data = (await res.json()) as { slug?: string }
    const slug = data?.slug?.trim()
    if (!slug) {
      return NextResponse.next()
    }
    const nextUrl = request.nextUrl.clone()
    nextUrl.pathname = `/menu/${slug}`
    return NextResponse.rewrite(nextUrl)
  } catch {
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
