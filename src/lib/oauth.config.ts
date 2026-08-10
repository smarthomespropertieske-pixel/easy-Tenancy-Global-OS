export type OAuthProvider = 'google' | 'github'

export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    provider: OAuthProvider;
  };
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  createdAt: number;
}

export function googleOAuthConfig(env: Record<string, string>) {
  return {
    clientId: env.GOOGLE_CLIENT_ID || '',
    clientSecret: env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: '',
    authorizationEndpoint: '',
    tokenEndpoint: '',
    userInfoEndpoint: ''
  }
}

export function githubOAuthConfig(env: Record<string, string>) {
  return {
    clientId: env.GITHUB_CLIENT_ID || '',
    clientSecret: env.GITHUB_CLIENT_SECRET || '',
    redirectUri: '',
    authorizationEndpoint: '',
    tokenEndpoint: '',
    userInfoEndpoint: ''
  }
}

export function generateState(): string {
  return crypto.randomUUID()
}

export async function generatePKCE(): Promise<{ codeChallenge: string, codeVerifier: string }> {
  return { codeChallenge: 'challenge', codeVerifier: 'verifier' }
}

export function generateAuthorizationUrl(config: any, state: string, codeChallenge?: string): string {
  return '/'
}

export async function exchangeCodeForToken(config: any, code: string, codeVerifier?: string): Promise<any> {
  return { accessToken: 'token', refreshToken: 'token', expiresIn: 3600 }
}

export async function fetchOAuthUserInfo(config: any, token: string): Promise<any> {
  return {}
}

export function parseOAuthUser(provider: OAuthProvider, data: any): any {
  return { id: '1', email: 'user@example.com', name: 'User', provider }
}
