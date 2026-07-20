import { usernameClient } from "better-auth/client/plugins";
import { nextCookies } from "better-auth/next-js";
import { createAuthClient } from "better-auth/react";

// No baseURL: the dashboard serves its own auth routes, so the client's default
// (the current origin) is always right. Passing process.env.BASE_URL here did
// nothing — it isn't NEXT_PUBLIC_, so it inlines as undefined in the browser —
// and hardcoding an origin would break every deployment not served from it.
export const authClient = createAuthClient({
  plugins: [usernameClient(), nextCookies()],
});
