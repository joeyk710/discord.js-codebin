import { NextRequest, NextResponse } from 'next/server'

// Proxy middleware for Cloudflare protection, DDoS mitigation, and security headers
// This replaces the old middleware pattern with edge-compatible proxy behavior

// Rate limiting store (in-memory, resets on deployment)
// For production, use Redis via Upstash or similar
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function getRateLimitKey(request: NextRequest, type: 'global' | 'api' | 'ip'): string {
  if (type === 'global') return 'global'
  if (type === 'ip') {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('cf-connecting-ip') || 
               'unknown'
    return `ip:${ip}`
  }
  const ip = request.headers.get('cf-connecting-ip') || 'unknown'
  return `api:${ip}`
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  entry.count++
  if (entry.count > limit) {
    return false
  }

  return true
}

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const method = request.method

  // Get Cloudflare threat information
  const cfThreatScore = request.headers.get('cf-threat-score')
  const cfBotScore = request.headers.get('cf-bot-management-score')
  const cfCountry = request.headers.get('cf-ipcountry')
  const cfJa3 = request.headers.get('cf-ja3')

  // Block immediately if threat score is critical (Cloudflare detected threat)
  if (cfThreatScore) {
    const threatScore = parseInt(cfThreatScore)
    if (threatScore > 80) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Block suspicious bots (low bot management score = likely malicious)
  if (cfBotScore) {
    const botScore = parseInt(cfBotScore)
    if (botScore < 30) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Ignore Next.js internals and static assets
  const isAsset = pathname.startsWith('/_next') || 
                  pathname.startsWith('/static') || 
                  pathname.startsWith('/favicon.ico') ||
                  /\.[a-zA-Z0-9]+$/.test(pathname)

  if (isAsset) {
    return NextResponse.next()
  }

  // Global rate limiting (all requests)
  const globalKey = getRateLimitKey(request, 'global')
  if (!checkRateLimit(globalKey, 10000, 60000)) {
    return new NextResponse('Too Many Requests - Global limit exceeded', { status: 429 })
  }

  // API-specific rate limiting (stricter)
  if (pathname.startsWith('/api')) {
    const apiKey = getRateLimitKey(request, 'api')
    
    // Different limits based on endpoint
    let limit = 100 // default per minute
    
    if (pathname.startsWith('/api/paste')) {
      if (method === 'POST') {
        limit = 10 // Create paste: 10 per minute per IP
      } else if (method === 'DELETE') {
        limit = 5 // Delete paste: 5 per minute per IP
      } else {
        limit = 50 // Get paste: 50 per minute per IP
      }
    } else if (pathname.startsWith('/api/docs')) {
      limit = 20 // Docs endpoint: 20 per minute per IP
    }

    if (!checkRateLimit(apiKey, limit, 60000)) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: 60 }),
        { 
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
          }
        }
      )
    }

    const response = NextResponse.next()
    
    // API-specific security headers
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-XSS-Protection', '1; mode=block')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set('X-RateLimit-Limit', limit.toString())
    response.headers.set('X-RateLimit-Window', '60')
    
    // Strict CSP for API
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none';"
    )
    
    return response
  }

  // Web routes rate limiting (less strict)
  const ipKey = getRateLimitKey(request, 'ip')
  if (!checkRateLimit(ipKey, 300, 60000)) {
    return new NextResponse('Too Many Requests - Please try again in a minute', { status: 429 })
  }

  // Standard response with security headers for all other routes
  const response = NextResponse.next()

  // Security Headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  // HSTS - enforce HTTPS in production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    )
  }

  // Content Security Policy for web content
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://cdn.jsdelivr.net",
    "worker-src 'self' blob:",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data: https://fonts.googleapis.com https://fonts.gstatic.com",
    "connect-src 'self' data: https://challenges.cloudflare.com https://cdn.jsdelivr.net",
    "frame-src 'self' https://challenges.cloudflare.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ]

  // Upgrade insecure requests in production
  if (process.env.NODE_ENV === 'production') {
    csp.push('upgrade-insecure-requests')
  }

  response.headers.set('Content-Security-Policy', csp.join('; '))

  // Cloudflare specific headers
  if (cfCountry) {
    response.headers.set('X-CF-Country', cfCountry)
  }

  if (cfBotScore) {
    response.headers.set('X-CF-Bot-Score', cfBotScore)
  }

  if (cfThreatScore) {
    response.headers.set('X-CF-Threat-Score', cfThreatScore)
  }

  if (cfJa3) {
    response.headers.set('X-CF-JA3', cfJa3)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
