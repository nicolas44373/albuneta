import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/album'

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`)

    // Collect all cookies Supabase wants to set so we can apply them to any response
    const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = []

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            pendingCookies.push(...cookiesToSet)
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      console.log('[auth/callback] session OK, user:', data.user?.id)

      // ?debug=1 → redirect to debug endpoint to confirm session cookies are carried over
      if (searchParams.get('debug') === '1') {
        const debugResponse = NextResponse.redirect(`${origin}/api/debug-auth`)
        pendingCookies.forEach(({ name, value, options }) =>
          debugResponse.cookies.set(name, value, options as Parameters<typeof debugResponse.cookies.set>[2])
        )
        return debugResponse
      }

      return response
    }

    console.error('[auth/callback] exchangeCodeForSession error:', error.message, error.status)
    return NextResponse.redirect(
      `${origin}/auth/login?error=${encodeURIComponent(error.message)}`
    )
  }

  return NextResponse.redirect(`${origin}/auth/login?error=No+se+recibio+el+codigo+de+autenticacion`)
}
