import { t as __exportAll } from "./rolldown-runtime_D7D4PA-g.mjs";
import { randomBytes } from "node:crypto";
//#region src/pages/api/auth.ts
var auth_exports = /* @__PURE__ */ __exportAll({
	GET: () => GET,
	prerender: () => false
});
var GET = ({ request }) => {
	const clientId = process.env.GITHUB_CLIENT_ID;
	if (!clientId) return new Response("Sign-in is not configured yet.\n\nAdd GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET to this project in Vercel,\nfrom a GitHub OAuth app whose callback URL is this site + /api/callback.", {
		status: 500,
		headers: { "Content-Type": "text/plain; charset=utf-8" }
	});
	const state = randomBytes(16).toString("hex");
	const site = new URL(request.url);
	const authorize = new URL("https://github.com/login/oauth/authorize");
	authorize.searchParams.set("client_id", clientId);
	authorize.searchParams.set("redirect_uri", `${site.origin}/api/callback`);
	authorize.searchParams.set("scope", "repo,user");
	authorize.searchParams.set("state", state);
	return new Response(null, {
		status: 302,
		headers: {
			Location: authorize.toString(),
			"Set-Cookie": `t3_oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`
		}
	});
};
//#endregion
//#region \0virtual:astro:page:src/pages/api/auth@_@ts
var page = () => auth_exports;
//#endregion
export { page };
