import path from "node:path";

export function getPgbrDataPath() {
  return process.env.PGBR_DATA ?? "./data";
}

export function getBackupsPath() {
  return path.join(getPgbrDataPath(), "backups");
}
