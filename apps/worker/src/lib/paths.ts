import { getPgbrDataPath } from "@repo/shared";
import path from "node:path";

export { getPgbrDataPath, getBackupsPath } from "@repo/shared";

// Stored or client-supplied paths must stay inside the pgbr data directory so
// jobs can't be pointed at arbitrary files on the worker.
export function assertInsideDataDir(candidate: string) {
  const dataDir = path.resolve(getPgbrDataPath());
  const resolved = path.resolve(candidate);

  if (resolved !== dataDir && !resolved.startsWith(dataDir + path.sep)) {
    throw new Error(
      `Custom backup path must be inside the pgbr data directory (${dataDir})`,
    );
  }
}
