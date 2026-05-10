import { BackupFlags } from "@/types";

export function buildPgDumpArgs(
  outputPath: string,
  flags: BackupFlags,
  dbUrl: string,
) {
  const args: string[] = [];

  const formatMap = { custom: "c", plain: "p", directory: "d", tar: "t" };
  if (flags.format) args.push(`-F${formatMap[flags.format]}`);

  if (flags.compress && flags.format === "custom") args.push("-Z", "9");
  if (flags.dataOnly) args.push("--data-only");
  if (flags.schemaOnly) args.push("--schema-only");
  if (flags.clean) args.push("--clean");
  if (flags.noOwner) args.push("--no-owner");
  if (flags.noPrivileges) args.push("--no-acl");
  if (flags.verbose) args.push("--verbose");

  if (flags.format === "directory" && flags.jobs && flags.jobs > 1) {
    args.push("-j", flags.jobs.toString());
  }

  if (flags.excludeTables?.length) {
    flags.excludeTables.forEach((t) => args.push("-T", t));
  }
  if (flags.includeTables?.length) {
    flags.includeTables.forEach((t) => args.push("-t", t));
  }

  args.push("-f", outputPath);
  args.push(dbUrl);

  return args;
}
