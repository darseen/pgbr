// Every argv of every process is world-readable inside the container (/proc,
// `ps`), so a connection string passed as an argument publishes its password to
// anything that can list processes. libpq reads the password from PGPASSWORD,
// which is per-process and not exposed that way — so the password travels in
// the environment and the argv keeps only the harmless host/user/dbname parts.
export interface PgConnection {
  /** Connection URI with the password removed — safe to pass as an argument. */
  url: string;
  /** Extra environment for the child process (PGPASSWORD when there is one). */
  env: NodeJS.ProcessEnv;
}

export function pgConnection(rawUrl: string): PgConnection {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    // Not a URI (libpq also accepts "host=... password=..." keyword strings).
    // Pass it through untouched rather than risk mangling a working string.
    return { url: rawUrl, env: {} };
  }

  if (!parsed.password) return { url: rawUrl, env: {} };

  const password = decodeURIComponent(parsed.password);
  parsed.password = "";

  return { url: parsed.toString(), env: { PGPASSWORD: password } };
}
