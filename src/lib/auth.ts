import { Auth, type AuthConfig } from '@auth/core';
import GitHub from '@auth/core/providers/github';

export type EditorSession = {
  username: string;
};

export type EditorAccess = {
  configured: boolean;
  authenticated: boolean;
  canEdit: boolean;
  username?: string;
  signInUrl?: string;
};

function allowedUsernames(): Set<string> {
  return new Set(
    (process.env.AUTH_ALLOWED_USERNAMES ?? '')
      .split(',')
      .map((username) => username.trim().toLowerCase())
      .filter(Boolean),
  );
}

function profileUsername(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null;
  const login = (profile as { login?: unknown }).login;
  return typeof login === 'string' && login.trim() ? login.trim() : null;
}

export function isAllowedUsername(username: string): boolean {
  return allowedUsernames().has(username.trim().toLowerCase());
}

export function isEditorAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET
      && process.env.AUTH_GITHUB_ID
      && process.env.AUTH_GITHUB_SECRET
      && allowedUsernames().size,
  );
}

export const authConfig: AuthConfig = {
  basePath: '/api/auth',
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [GitHub],
  pages: {
    error: '/connections?auth=denied',
  },
  callbacks: {
    async signIn({ profile }) {
      const username = profileUsername(profile);
      return Boolean(username && isAllowedUsername(username));
    },
    async jwt({ token, profile }) {
      const username = profileUsername(profile);
      if (username) (token as Record<string, unknown>).githubUsername = username;
      return token;
    },
    async session({ session, token }) {
      const username = (token as Record<string, unknown>).githubUsername;
      if (session.user && typeof username === 'string') session.user.name = username;
      return session;
    },
  },
};

export async function getEditorSession(request: Request): Promise<EditorSession | null> {
  if (!isEditorAuthConfigured()) return null;

  try {
    const sessionUrl = new URL('/api/auth/session', request.url);
    const response = await Auth(new Request(sessionUrl, {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
    }), authConfig);
    if (!response.ok) return null;

    const payload = await response.json() as { user?: { name?: unknown } };
    const username = typeof payload.user?.name === 'string' ? payload.user.name : '';
    return isAllowedUsername(username) ? { username } : null;
  } catch {
    return null;
  }
}

export function editorSignInUrl(request: Request): string {
  const url = new URL('/api/auth/signin/github', request.url);
  url.searchParams.set('callbackUrl', new URL('/connections', request.url).toString());
  return url.toString();
}

export async function getEditorAccess(request: Request): Promise<EditorAccess> {
  const configured = isEditorAuthConfigured();
  if (!configured) return { configured: false, authenticated: false, canEdit: false };

  const session = await getEditorSession(request);
  return {
    configured: true,
    authenticated: Boolean(session),
    canEdit: Boolean(session),
    ...(session ? { username: session.username } : {}),
    signInUrl: editorSignInUrl(request),
  };
}
