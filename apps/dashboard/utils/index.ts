// Replaces the password in a connection string with dots. This runs on the
// server and its output is what reaches the browser — the plaintext URL is a
// credential and never leaves the server. Called before returning any database
// row to a client component.
export function maskDatabaseUrl(urlString: string): string {
  try {
    const parsedUrl = new URL(urlString);
    if (parsedUrl.password) {
      parsedUrl.password = "••••••••";
    }
    return decodeURIComponent(parsedUrl.toString());
  } catch {
    return urlString.replace(/:([^:@/]+)@/, ":••••••••@");
  }
}

// The job tables store naive timestamps that are already UTC; appending "Z" is
// what stops the browser from re-reading them in local time.
export function parseJobTimestamp(
  value: string | Date | null | undefined,
): Date | null {
  if (!value) return null;
  const date =
    value instanceof Date
      ? value
      : new Date(/([zZ]|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
