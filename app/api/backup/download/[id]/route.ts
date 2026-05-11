import { db } from "@/db";
import { backupJobsTable } from "@/db/schema";
import auth from "@/utils/auth";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { open, stat } from "node:fs/promises";
import path from "node:path";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await auth();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [backupJob] = await db
      .select()
      .from(backupJobsTable)
      .where(eq(backupJobsTable.id, id));

    if (!backupJob) {
      return NextResponse.json(
        { error: "Backup job not found" },
        { status: 404 },
      );
    }

    const backupPath = backupJob.backupPath;

    const filename = path.basename(backupPath);
    const stats = await stat(backupPath);

    const fileHandle = await open(backupPath, "r");
    const stream = fileHandle.readableWebStream();

    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": stats.size.toString(),
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error(error);

    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json(
        { error: "File not found on disk" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
