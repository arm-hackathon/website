import { Auth } from '@auth/core';
import type { APIRoute } from 'astro';
import { authConfig } from '../../../lib/auth';

export const prerender = false;

async function handleAuth({ request }: { request: Request }): Promise<Response> {
  return Auth(request, authConfig) as Promise<Response>;
}

export const GET: APIRoute = handleAuth;
export const POST: APIRoute = handleAuth;
