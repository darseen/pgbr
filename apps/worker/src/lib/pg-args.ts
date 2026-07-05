import type { BackupFlags, RestoreFlags } from "@repo/types";

export function buildPgDumpArgs(
  outputPath: string | null,
  flags: BackupFlags,
  dbUrl: string,
) {
  const args: string[] = [];

  const formatMap = { custom: "c", plain: "p", directory: "d", tar: "t" };
  if (flags.format) args.push(`-F${formatMap[flags.format]}`);

  if (flags.compress && flags.format !== "tar") args.push("-Z", "9");

  if (flags.dataOnly) args.push("--data-only");
  if (flags.schemaOnly) args.push("--schema-only");
  if (flags.clean) args.push("--clean");
  if (flags.create) args.push("--create");
  if (flags.ifExists) args.push("--if-exists");
  if (flags.noOwner) args.push("--no-owner");
  if (flags.noPrivileges) args.push("--no-acl");
  if (flags.verbose) args.push("--verbose");
  if (flags.inserts) args.push("--inserts");

  if (flags.format === "directory" && flags.jobs && flags.jobs > 1) {
    args.push("-j", flags.jobs.toString());
  }

  if (flags.excludeSchemas?.length) {
    flags.excludeSchemas.forEach((s) => args.push("-N", s));
  }
  if (flags.includeSchemas?.length) {
    flags.includeSchemas.forEach((s) => args.push("-n", s));
  }
  if (flags.excludeTables?.length) {
    flags.excludeTables.forEach((t) => args.push("-T", t));
  }
  if (flags.includeTables?.length) {
    flags.includeTables.forEach((t) => args.push("-t", t));
  }
  if (flags.excludeTableData?.length) {
    flags.excludeTableData.forEach((t) => args.push("--exclude-table-data", t));
  }

  if (outputPath) args.push("-f", outputPath);
  args.push(dbUrl);

  return args;
}

export function buildPgRestoreArgs(
  targetPath: string,
  flags: RestoreFlags,
  dbUrl: string,
): string[] {
  const args = ["-d", dbUrl];

  if (flags.clean) args.push("--clean");
  if (flags.create) args.push("--create");
  if (flags.verbose) args.push("--verbose");
  if (flags.dataOnly) args.push("--data-only");
  if (flags.schemaOnly) args.push("--schema-only");
  if (flags.noOwner) args.push("--no-owner");
  if (flags.noPrivileges) args.push("--no-privileges");
  if (flags.disableTriggers) args.push("--disable-triggers");

  if (flags.singleTransaction) args.push("--single-transaction");
  if (flags.exitOnError) args.push("--exit-on-error");
  if (flags.ifExists) args.push("--if-exists");

  if (flags.jobs && flags.jobs > 1) {
    args.push("-j", flags.jobs.toString());
  }

  if (flags.excludeSchemas?.length) {
    flags.excludeSchemas.forEach((s) => args.push("-N", s));
  }
  if (flags.includeSchemas?.length) {
    flags.includeSchemas.forEach((s) => args.push("-n", s));
  }
  if (flags.includeTables?.length) {
    flags.includeTables.forEach((t) => args.push("-t", t));
  }

  args.push(targetPath);
  return args;
}
