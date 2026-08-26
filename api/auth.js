/* Step one of signing in to the editor: send the person to GitHub to approve.
   Runs on Vercel; needs GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET set there. */
import { randomBytes } from 'node:crypto';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    res.status(500).setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.end(
      'Sign-in is not configured yet.\n\n' +
        'Add GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to this project in Vercel,\n' +
        'from a GitHub OAuth app whose callback URL is this site + /api/callback.'
    );
  }

  /* A one-time value carried through the round trip, so a reply can only be
     accepted if it answers a request this site actually made. */
  const state = randomBytes(16).toString('hex');
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';

  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', `${proto}://${host}/api/callback`);
  url.searchParams.set('scope', 'repo,user');
  url.searchParams.set('state', state);

  res.setHeader('Set-Cookie', `t3_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`);
  res.writeHead(302, { Location: url.toString() });
  res.end();
}
