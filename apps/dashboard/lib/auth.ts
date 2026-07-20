import { db } from "@repo/db";
import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationsTable,
} from "@repo/db/schema";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import { username } from "better-auth/plugins";
import { hostname } from "node:os";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
      verification: verificationsTable,
    },
  }),
  advanced: {
    database: { generateId: "uuid" },
  },
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.BASE_URL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [username()],
  hooks: {
    // pgbr is single-admin: the first account claims the instance and sign-up
    // closes behind it. The sign-up page's check is advisory — it can't stop a
    // direct POST to this endpoint — so the close is enforced here, the only
    // place every sign-up must pass through. Not `emailAndPassword.disableSignUp`,
    // which is fixed at startup and can't open for the first user and then shut.
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") return;

      const [existingUser] = await db
        .select({ id: usersTable.id })
        .from(usersTable)
        .limit(1);

      if (existingUser) {
        throw new APIError("FORBIDDEN", {
          message: "An admin account already exists",
        });
      }
    }),
  },
  trustedOrigins: ["http://localhost:3000", `http://${hostname()}:3000`],
  logger: {
    level: "error",
    disabled: false,
    disableColors: false,
  },
});
