import { db } from "@/db";
import { backupJobsTable } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import JSZip from "jszip";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { open, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
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

    let fileStats;
    try {
      fileStats = await stat(backupPath);
    } catch (err: unknown) {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        return NextResponse.json(
          { error: "File or directory not found on disk" },
          { status: 404 },
        );
      }
      throw err;
    }

    if (fileStats.isDirectory()) {
      const zip = new JSZip();

      await addDirectoryToZip(zip, backupPath);

      const nodeStream = zip.generateNodeStream({
        type: "nodebuffer",
        streamFiles: true,
        compression: "DEFLATE",
        compressionOptions: { level: 5 },
      });

      const webStream = Readable.toWeb(
        nodeStream as Readable,
      ) as unknown as ReadableStream;

      return new NextResponse(webStream, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${filename}.zip"`,
        },
      });
    }

    const fileHandle = await open(backupPath, "r");
    const stream = fileHandle.readableWebStream();

    return new NextResponse(stream as unknown as ReadableStream, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": fileStats.size.toString(),
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Download streaming error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

async function addDirectoryToZip(
  zip: JSZip,
  dirPath: string,
  basePath: string = "",
) {
  const files = await readdir(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const fileStat = await stat(fullPath);
    const zipPath = path.join(basePath, file).replace(/\\/g, "/");

    if (fileStat.isDirectory()) {
      zip.folder(zipPath);
      await addDirectoryToZip(zip, fullPath, zipPath);
    } else {
      zip.file(zipPath, createReadStream(fullPath));
    }
  }
}
