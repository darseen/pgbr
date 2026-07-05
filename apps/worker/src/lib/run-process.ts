import { spawn } from "node:child_process";

export interface ProcessResult {
  code: number | null;
  stderr: string;
}

// Runs a child process to completion, capturing stderr. Rejects only when the
// process can't be spawned at all (e.g. the binary is missing); a non-zero exit
// resolves with the code so callers can record the tool's own error output.
export function runProcess(
  command: string,
  args: string[],
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "ignore", "pipe"] });

    let stderr = "";
    child.stderr.on("data", (data) => (stderr += data.toString()));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, stderr }));
  });
}
