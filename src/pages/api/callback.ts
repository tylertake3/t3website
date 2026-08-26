/* Step two: GitHub sends the person back here with a code. Swap it for a
   token and hand that to the editor window that opened this one.

   The token belongs to whoever signed in, so GitHub decides what they may
   change: someone without write access to the repository cannot save. */
import type { APIRoute } from 'astro';

export const prerender = false;

const page = (payload: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Signing in</title></head>
<body>
<p>Signing in. This window will close itself.</p>
<script>
  (function () {
    var message = ${JSON.stringify(payload)};
    function reply(event) {
      if (!window.opener) return;
      window.opener.postMessage(message, event.origin);
      window.removeEventListener('message', reply, false);
      window.setTimeout(function () { window.close(); }, 400);
    }
    window.addEventListener('message', reply, false);
    if (window.opener) window.opener.postMessage('authorizing:github', '*');
    else document.body.textContent = 'Open the editor first, then sign in from there.';
  })();
</script>
</body></html>`;

const html = (payload: string) =>
  new Response(page(payload), { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });

const fail = (reason: string) =>
  html(`authorization:github:error:${JSON.stringify({ message: reason })}`);

export const GET: APIRoute = async ({ request }) => {
  const clientId = import.meta.env.GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_CLIENT_SECRET;

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!clientId || !clientSecret) return fail('Sign-in is not configured on this site yet.');
  if (!code) return fail('GitHub did not send an authorisation code.');

  /* the value we set on the way out must come back untouched */
  const cookies = Object.fromEntries(
    (request.headers.get('cookie') ?? '')
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([key]) => key)
  );
  if (!state || state !== cookies.t3_oauth_state) {
    return fail('That sign-in attempt could not be verified. Please try again.');
  }

  try {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
    });
    const data = (await response.json()) as { access_token?: string; error_description?: string };

    if (!data.access_token) return fail(data.error_description || 'GitHub refused to issue a token.');

    const success = html(
      `authorization:github:success:${JSON.stringify({ token: data.access_token, provider: 'github' })}`
    );
    success.headers.append('Set-Cookie', 't3_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    return success;
  } catch {
    return fail('Could not reach GitHub to complete sign-in.');
  }
};
