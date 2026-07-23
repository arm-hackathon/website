import { del, get, list, put } from '@vercel/blob';
import type { APIRoute } from 'astro';
import { graphDocumentSchema } from '../../lib/graph';

export const prerender = false;

const topologyPrefix = 'icarus/drafts/';

function encodeName(name: string): string {
  return Buffer.from(name, 'utf8').toString('base64url');
}

function decodeName(encoded: string): string {
  return Buffer.from(encoded, 'base64url').toString('utf8');
}

function draftPath(name: string): string {
  return `${topologyPrefix}${encodeName(name)}.json`;
}

function validDraftName(name: string): boolean {
  const value = name.trim();
  return value.length >= 3 && !/^(draft|draft name|new draft|untitled)\s*\d*$/i.test(value);
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function hasStorageCredentials(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN
      || (process.env.BLOB_STORE_ID && process.env.VERCEL_OIDC_TOKEN),
  );
}

export const GET: APIRoute = async ({ url }) => {
  if (!hasStorageCredentials()) {
    return json({ configured: false, message: 'Vercel Blob is not configured.' }, 503);
  }

  try {
    const name = url.searchParams.get('name');
    if (!name) {
      const result = await list({ prefix: topologyPrefix, limit: 100 });
      const drafts = result.blobs
        .map((blob) => decodeName(blob.pathname.slice(topologyPrefix.length).replace(/\.json$/, '')))
        .filter(Boolean)
        .sort((left, right) => left.localeCompare(right));
      return json({ configured: true, drafts });
    }

    if (!validDraftName(name)) return json({ message: 'Draft names must be at least 3 characters and cannot contain slashes.' }, 400);
    const blob = await get(draftPath(name), { access: 'private', useCache: false });
    if (!blob) return json({ configured: true, found: false }, 404);

    const document = graphDocumentSchema.parse(JSON.parse(await new Response(blob.stream).text()));
    return json({ configured: true, found: true, document });
  } catch {
    return json({ configured: true, message: 'The shared topology could not be read.' }, 502);
  }
};

export const POST: APIRoute = async ({ request }) => {
  if (!hasStorageCredentials()) {
    return json({ configured: false, message: 'Add a Vercel Blob store before synchronising.' }, 503);
  }

  try {
    const payload = await request.json();
    const result = graphDocumentSchema.safeParse(payload);
    if (!result.success) return json({ message: 'Invalid topology document.' }, 400);
    if (!validDraftName(result.data.name)) return json({ message: 'Draft names must be at least 3 characters and cannot contain slashes.' }, 400);

    const drafts = await list({ prefix: topologyPrefix, limit: 100 });
    const duplicate = drafts.blobs.some((blob) => {
      const existingName = decodeName(blob.pathname.slice(topologyPrefix.length).replace(/\.json$/, ''));
      return existingName.toLocaleLowerCase() === result.data.name.toLocaleLowerCase() && existingName !== result.data.name;
    });
    if (duplicate) return json({ message: 'A draft with that name already exists.' }, 409);

    await put(draftPath(result.data.name), JSON.stringify(result.data), {
      access: 'private',
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 60,
    });

    return json({ configured: true, synced: true });
  } catch {
    return json({ configured: true, message: 'The shared topology could not be synchronised.' }, 502);
  }
};

export const DELETE: APIRoute = async ({ url }) => {
  if (!hasStorageCredentials()) {
    return json({ configured: false, message: 'Vercel Blob is not configured.' }, 503);
  }

  const name = url.searchParams.get('name');
  if (!name || !validDraftName(name)) return json({ message: 'A valid draft name is required.' }, 400);

  try {
    await del(draftPath(name));
    return json({ configured: true, deleted: true });
  } catch {
    return json({ configured: true, message: 'The draft could not be deleted.' }, 502);
  }
};
