import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, open, readdir } from "node:fs/promises";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
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

// Sniffs the gzip magic number rather than trusting the name. Two artifacts
// need this: a compressed plain dump (".sql.gz"), and — because early versions
// stored those under a bare ".sql" key — any pre-existing artifact whose
// content is gzip but whose name doesn't say so. No other format collides:
// custom dumps start with "PGDMP" and tarballs with a tar header.
export async function isGzip(filePath: string): Promise<boolean> {
  const handle = await open(filePath, "r");
  try {
    const { bytesRead, buffer } = await handle.read(Buffer.alloc(2), 0, 2, 0);
    return bytesRead === 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
  } finally {
    await handle.close();
  }
}

// Expands a gzip artifact and returns the decompressed path. The result keeps
// the underlying extension (".sql.gz" -> ".sql", a misnamed ".sql" -> a sibling
// still ending ".sql") because the restore path dispatches psql vs. pg_restore
// on that extension.
export async function gunzipFile(gzPath: string): Promise<string> {
  const outPath = gzPath.endsWith(".gz")
    ? gzPath.slice(0, -".gz".length)
    : path.join(path.dirname(gzPath), `decompressed-${path.basename(gzPath)}`);

  await pipeline(
    createReadStream(gzPath),
    createGunzip(),
    createWriteStream(outPath),
  );
  return outPath;
}
