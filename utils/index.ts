export function getPgbrDataPath() {
  return process.env.PGBR_DATA ?? "./data";
}
