// Object-store key conventions. Prefixes are chosen so the "wipe everything"
// flow can bulk-delete by prefix.
export const BACKUPS_PREFIX = "backups/";
export const CUSTOM_UPLOADS_PREFIX = "custom-uploads/";

// Maps a dump format to the single-object artifact extension. Directory-format
// dumps are collapsed into a tarball before upload, so every backup is one
// object regardless of format.
export const artifactExtensionMap: Record<string, string> = {
  custom: "backup",
  plain: "sql",
  directory: "tar",
  tar: "tar",
};

export function buildBackupKey(rowId: string, format: string): string {
  const ext = artifactExtensionMap[format] ?? "backup";
  // rowId may be a BullMQ scheduler job id ("repeat:<id>:<ts>"); sanitize so
  // the object key stays clean and portable.
  const safeId = rowId.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${BACKUPS_PREFIX}${safeId}.${ext}`;
}

export function buildCustomUploadKey(id: string, ext: string): string {
  const safeExt = ext.replace(/[^a-zA-Z0-9]/g, "") || "bin";
  return `${CUSTOM_UPLOADS_PREFIX}${id}.${safeExt}`;
}

// Only directory-format dumps are collapsed into a tarball on upload and must
// be expanded back into a directory before restore. Native "tar" format is
// already a single file that pg_restore reads directly, so it is NOT collapsed.
export function needsDirectoryCollapse(format: string | undefined): boolean {
  return format === "directory";
}
