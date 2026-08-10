/**
 * OAuth API Routes (Hono)
 * Handles OAuth callback, token exchange, and session management
 */

import { Hono } from 'hono'
import { setCookie, getCookie } from 'hono/cookie'
import {
  googleOAuthConfig,
  githubOAuthConfig,
  generateState,
  generatePKCE,
  generateAuthorizationUrl,
  exchangeCodeForToken,
  fetchOAuthUserInfo,
  parseOAuthUser,
  type OAuthProvider,
  type Session,
} from '../lib/oauth.config'

const oauth = new Hono()

/**
 * Start OAuth flow
 * GET /api/oauth/authorize?provider=google|github
 */
oauth.get('/authorize', async (c) => {
  const provider = (c.req.query('provider') || 'google') as OAuthProvider
  const env = c.env as Record<string, string>

  if (!['google', 'github'].includes(provider)) {
    return c.json({ error: 'Invalid provider' }, 400)
  }

  const config = provider === 'google'
    ? googleOAuthConfig(env)
    : githubOAuthConfig(env)

  if (!config.clientId || !config.redirectUri) {
    return c.json(
      { error: 'OAuth not configured. Add GOOGLE_CLIENT_ID/GITHUB_CLIENT_ID to secrets.' },
      500,
    )
  }

  // Generate state for CSRF protection
  const state = generateState()
  setCookie(c, `oauth_state_${provider}`, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 600, // 10 minutes
  })

  // Generate PKCE for GitHub
  let codeChallenge: string | undefined
  let codeVerifier: string | undefined
  if (provider === 'github') {
    const pkce = await generatePKCE()
    codeChallenge = pkce.codeChallenge
    codeVerifier = pkce.codeVerifier

    setCookie(c, `oauth_pkce_${provider}`, codeVerifier || '', {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 600,
    })
  }

  const authUrl = generateAuthorizationUrl(config, state, codeChallenge)
  return c.redirect(authUrl)
})

/**
 * OAuth callback handler
 * GET /api/oauth/callback?provider=google|github&code=...&state=...
 */
oauth.get('/callback', async (c) => {
  const provider = (c.req.query('provider') || 'google') as OAuthProvider
  const code = c.req.query('code')
  const state = c.req.query('state')
  const error = c.req.query('error')

  // Check for OAuth errors
  if (error) {
    const errorDescription = c.req.query('error_description') || error
    console.error(`OAuth error: ${errorDescription}`)
    return c.redirect(`/?oauth_error=${encodeURIComponent(errorDescription)}`)
  }

  if (!code || !state) {
    return c.json({ error: 'Missing code or state' }, 400)
  }

  // Verify state (CSRF protection)
  const storedState = getCookie(c, `oauth_state_${provider}`)
  if (!storedState || storedState !== state) {
    return c.json({ error: 'State mismatch' }, 403)
  }

  const env = c.env as Record<string, string>
  const config = provider === 'google'
    ? googleOAuthConfig(env)
    : githubOAuthConfig(env)

  try {
    // Get PKCE verifier if using GitHub
    let codeVerifier: string | undefined
    if (provider === 'github') {
      codeVerifier = getCookie(c, `oauth_pkce_${provider}`)
    }

    // Exchange code for token
    const tokenData = await exchangeCodeForToken(config, code, codeVerifier)

    // Fetch user info
    const userInfo = await fetchOAuthUserInfo(config, tokenData.accessToken)
    const user = parseOAuthUser(provider, userInfo)

    // Create session
    const session: Session = {
      user,
      accessToken: tokenData.accessToken,
      refreshToken: tokenData.refreshToken,
      expiresAt: tokenData.expiresIn
        ? Date.now() + tokenData.expiresIn * 1000
        : undefined,
      createdAt: Date.now(),
    }

    // Store session in secure cookie
    setCookie(c, 'et_session', JSON.stringify(session), {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    // Log analytics
    console.log(`OAuth login: ${user.email} (${provider})`)

    // Redirect to app
    return c.redirect('/app/demo')
  } catch (err) {
    console.error('OAuth callback error:', err)
    return c.redirect('/?oauth_error=Authentication_failed')
  }
})

/**
 * Get current session
 * GET /api/oauth/session
 */
oauth.get('/session', (c) => {
  const sessionCookie = getCookie(c, 'et_session')

  if (!sessionCookie) {
    return c.json({ user: null })
  }

  try {
    const session = JSON.parse(sessionCookie)
    return c.json({ user: session.user })
  } catch {
    return c.json({ user: null })
  }
})

/**
 * Logout
 * POST /api/oauth/logout
 */
oauth.post('/logout', (c) => {
  setCookie(c, 'et_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 0,
    path: '/',
  })

  return c.json({ ok: true })
})

export default oauth
