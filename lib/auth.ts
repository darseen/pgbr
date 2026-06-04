import { db } from "@/db";
import {
  accountsTable,
  sessionsTable,
  usersTable,
  verificationsTable,
} from "@/db/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { hostname } from "node:os";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: usersTable,
      session: sessionsTable,
      account: accountsTable,
      verification: verificationsTable,
    },
  }),
  advanced: {
    database: { generateId: "uuid" },
    disableOriginCheck: !process.env.BASE_URL,
  },
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.BASE_URL,
  emailAndPassword: {
    enabled: true,
  },
  plugins: [username()],
  trustedOrigins: ["http://localhost:3000", `http://${hostname()}:3000`],
  logger: {
    level: "error",
    disabled: false,
    disableColors: false,
  },
});
