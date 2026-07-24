import { Auth, type AuthConfig } from '@auth/core';
import GitHub from '@auth/core/providers/github';
import Google from '@auth/core/providers/google';

export type EditorSession = {
  email: string;
};

export type EditorAccess = {
  configured: boolean;
  authenticated: boolean;
  canEdit: boolean;
  email?: string;
  signInUrl?: string;
};

function allowedEmails(): Set<string> {
  return new Set(
    (process.env.AUTH_ALLOWED_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

function profileEmail(profile: unknown): string | null {
  if (!profile || typeof profile !== 'object') return null;
  const email = (profile as { email?: unknown }).email;
  return typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
}

export function isAllowedEmail(email: string): boolean {
  return allowedEmails().has(email.trim().toLowerCase());
}

export function isEditorAuthConfigured(): boolean {
  return Boolean(
    process.env.AUTH_SECRET
      && process.env.AUTH_GITHUB_ID
      && process.env.AUTH_GITHUB_SECRET
      && process.env.AUTH_GOOGLE_ID
      && process.env.AUTH_GOOGLE_SECRET
      && allowedEmails().size,
  );
}

export const authConfig: AuthConfig = {
  basePath: '/api/auth',
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  ],
  pages: {
    error: '/connections',
  },
  callbacks: {
    async signIn({ profile }) {
      const email = profileEmail(profile);
      return Boolean(email && isAllowedEmail(email));
    },
    async jwt({ token, profile }) {
      const email = profileEmail(profile);
      if (email) (token as Record<string, unknown>).editorEmail = email;
      return token;
    },
    async session({ session, token }) {
      const email = (token as Record<string, unknown>).editorEmail;
      if (session.user && typeof email === 'string') session.user.email = email;
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

    const payload = await response.json() as { user?: { email?: unknown } };
    const email = typeof payload.user?.email === 'string' ? payload.user.email : '';
    return isAllowedEmail(email) ? { email } : null;
  } catch {
    return null;
  }
}

export function editorSignInUrl(request: Request): string {
  const url = new URL('/api/auth/signin', request.url);
  url.searchParams.set('callbackUrl', '/connections');
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
    ...(session ? { email: session.email } : {}),
    signInUrl: editorSignInUrl(request),
  };
}
