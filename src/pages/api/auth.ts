/* Step one of signing in to the editor: send the person to GitHub to approve.
   Needs GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET set on the host. */
import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';

export const prerender = false;

export const GET: APIRoute = ({ request }) => {
  const clientId = import.meta.env.GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    return new Response(
      'Sign-in is not configured yet.\n\n' +
        'Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to this project in Vercel,\n' +
        'from a GitHub OAuth app whose callback URL is this site + /api/callback.',
      { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
    );
  }

  /* A one-time value carried through the round trip, so a reply can only be
     accepted if it answers a request this site actually made. */
  const state = randomBytes(16).toString('hex');
  const site = new URL(request.url);

  const authorize = new URL('https://github.com/login/oauth/authorize');
  authorize.searchParams.set('client_id', clientId);
  authorize.searchParams.set('redirect_uri', `${site.origin}/api/callback`);
  authorize.searchParams.set('scope', 'repo,user');
  authorize.searchParams.set('state', state);

  return new Response(null, {
    status: 302,
    headers: {
      Location: authorize.toString(),
      'Set-Cookie': `t3_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
    },
  });
};
