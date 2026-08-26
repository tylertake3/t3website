/* Step two: GitHub sends the person back here with a code. Swap it for a
   token and hand that to the editor window that opened this one.

   The token belongs to whoever signed in, so GitHub decides what they may
   change: someone without write access to the repository cannot save. */

const page = (payload) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Signing in</title></head>
<body>
<p>Signing in, this window will close itself.</p>
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

export default async function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  const { code, state } = req.query ?? {};

  const fail = (reason) => {
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(page(`authorization:github:error:${JSON.stringify({ message: reason })}`));
  };

  if (!clientId || !clientSecret) return fail('Sign-in is not configured on this site yet.');
  if (!code) return fail('GitHub did not send an authorisation code.');

  /* the value we set on the way out must come back untouched */
  const cookies = Object.fromEntries(
    (req.headers.cookie ?? '')
      .split(';')
      .map((part) => part.trim().split('='))
      .filter(([k]) => k)
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
    const data = await response.json();

    if (!data.access_token) {
      return fail(data.error_description || 'GitHub refused to issue a token.');
    }

    res.setHeader('Set-Cookie', 't3_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(
      page(`authorization:github:success:${JSON.stringify({ token: data.access_token, provider: 'github' })}`)
    );
  } catch (error) {
    fail('Could not reach GitHub to complete sign-in.');
  }
}
