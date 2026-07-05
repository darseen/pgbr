import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import { create, extract } from "tar";

// Directory-format dumps produce a directory of files. Collapse it into a
// single tar artifact on upload so every backup is one object regardless of
// format, and expand it back into scratch before restore.

export async function tarDirectory(
  sourceDir: string,
  outFile: string,
): Promise<void> {
  await create(
    { file: outFile, cwd: path.dirname(sourceDir) },
    [path.basename(sourceDir)],
  );
}

// Extracts into destDir and returns the directory pg_restore -Fd should target.
// Our own directory backups tar a single top-level folder; fall back to destDir
// for anything else (e.g. an arbitrary user-uploaded tarball).
export async function untarToDir(
  tarFile: string,
  destDir: string,
): Promise<string> {
  await mkdir(destDir, { recursive: true });
  await extract({ file: tarFile, cwd: destDir });

  const entries = await readdir(destDir, { withFileTypes: true });
  if (entries.length === 1 && entries[0]!.isDirectory()) {
    return path.join(destDir, entries[0]!.name);
  }
  return destDir;
}
