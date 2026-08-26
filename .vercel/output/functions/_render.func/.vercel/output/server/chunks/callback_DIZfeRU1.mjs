import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
//#region src/pages/api/callback.ts
var callback_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var page$1 = (payload) => `<!doctype html>
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
<\/script>
</body></html>`;
var html = (payload) => new Response(page$1(payload), {
	status: 200,
	headers: { "Content-Type": "text/html; charset=utf-8" }
});
var fail = (reason) => html(`authorization:github:error:${JSON.stringify({ message: reason })}`);
var GET = async ({ request }) => {
	const clientId = process.env.GITHUB_CLIENT_ID;
	const clientSecret = process.env.GITHUB_CLIENT_SECRET;
	const url = new URL(request.url);
	const code = url.searchParams.get("code");
	const state = url.searchParams.get("state");
	if (!clientId || !clientSecret) return fail("Sign-in is not configured on this site yet.");
	if (!code) return fail("GitHub did not send an authorisation code.");
	const cookies = Object.fromEntries((request.headers.get("cookie") ?? "").split(";").map((part) => part.trim().split("=")).filter(([key]) => key));
	if (!state || state !== cookies.t3_oauth_state) return fail("That sign-in attempt could not be verified. Please try again.");
	try {
		const data = await (await fetch("https://github.com/login/oauth/access_token", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			body: JSON.stringify({
				client_id: clientId,
				client_secret: clientSecret,
				code
			})
		})).json();
		if (!data.access_token) return fail(data.error_description || "GitHub refused to issue a token.");
		const success = html(`authorization:github:success:${JSON.stringify({
			token: data.access_token,
			provider: "github"
		})}`);
		success.headers.append("Set-Cookie", "t3_oauth_state=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0");
		return success;
	} catch {
		return fail("Could not reach GitHub to complete sign-in.");
	}
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/callback@_@ts
var page = () => callback_exports;
//#endregion
export { page };
