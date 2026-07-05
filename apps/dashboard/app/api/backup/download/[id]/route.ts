import { db } from "@repo/db";
import { backupJobsTable } from "@repo/db/schema";
import { auth } from "@/lib/auth";
import { getStore } from "@repo/storage";
import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { Readable } from "node:stream";

// Brokered download: the dashboard reads the artifact from the object store and
// proxies the bytes to the browser. Every backup is a single object (directory
// dumps are collapsed into a tarball at upload time), so there's no on-the-fly
// zipping anymore.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const [backupJob] = await db
      .select()
      .from(backupJobsTable)
      .where(
        and(
          eq(backupJobsTable.id, id),
          eq(backupJobsTable.userId, session.user.id),
        ),
      );

    if (!backupJob) {
      return NextResponse.json(
        { error: "Backup job not found" },
        { status: 404 },
      );
    }

    const filename = path.basename(backupJob.storageKey);

    let object;
    try {
      object = await getStore().then((store) =>
        store.getObjectStream(backupJob.storageKey),
      );
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode;
      if (status === 404) {
        return NextResponse.json(
          { error: "Artifact not found in storage" },
          { status: 404 },
        );
      }
      throw err;
    }

    const webStream = Readable.toWeb(
      object.stream,
    ) as unknown as ReadableStream;

    const responseHeaders: Record<string, string> = {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
    };
    if (object.size) {
      responseHeaders["Content-Length"] = object.size.toString();
    }

    return new NextResponse(webStream, { status: 200, headers: responseHeaders });
  } catch (error) {
    console.error("Download streaming error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
