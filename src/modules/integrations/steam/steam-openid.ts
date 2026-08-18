const STEAM_OPENID_LOGIN = "https://steamcommunity.com/openid/login";
const OPENID_NS = "http://specs.openid.net/auth/2.0";
const IDENTIFIER_SELECT = `${OPENID_NS}/identifier_select`;

export function buildSteamOpenIdLoginUrl(input: { realm: string; returnTo: string }): string {
  const url = new URL(STEAM_OPENID_LOGIN);
  url.searchParams.set("openid.ns", OPENID_NS);
  url.searchParams.set("openid.mode", "checkid_setup");
  url.searchParams.set("openid.return_to", input.returnTo);
  url.searchParams.set("openid.realm", input.realm);
  url.searchParams.set("openid.identity", IDENTIFIER_SELECT);
  url.searchParams.set("openid.claimed_id", IDENTIFIER_SELECT);
  return url.toString();
}

export async function verifySteamOpenIdCallback(
  callbackUrl: URL,
  expectedReturnTo: string,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const mode = callbackUrl.searchParams.get("openid.mode");
  if (mode !== "id_res") throw new Error("Steam sign-in was not completed");
  if (callbackUrl.searchParams.get("openid.return_to") !== expectedReturnTo) {
    throw new Error("Steam OpenID return URL did not match");
  }

  const verification = new URLSearchParams();
  for (const [key, value] of callbackUrl.searchParams.entries()) {
    if (key.startsWith("openid.")) verification.set(key, value);
  }
  verification.set("openid.mode", "check_authentication");

  const response = await fetchImpl(STEAM_OPENID_LOGIN, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: verification.toString(),
  });
  if (!response.ok) throw new Error(`Steam OpenID verification failed (${response.status})`);
  const body = await response.text();
  if (!/(^|\n)is_valid\s*:\s*true(\n|$)/.test(body)) throw new Error("Steam OpenID response was not valid");

  const claimedId = callbackUrl.searchParams.get("openid.claimed_id") ?? "";
  const match = claimedId.match(/^https?:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/);
  if (!match?.[1]) throw new Error("Steam OpenID response did not contain a SteamID");
  return match[1];
}

export function publicOrigin(requestUrl: string, configuredOrigin?: string): string {
  const raw = configuredOrigin?.trim() || new URL(requestUrl).origin;
  return raw.replace(/\/$/, "");
}
