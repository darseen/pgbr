import authorizeRequest from "@/lib/authorize-request";
import { buildCustomUploadKey, getStore } from "@repo/storage";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { Readable } from "node:stream";
import type { ReadableStream as NodeWebReadableStream } from "node:stream/web";

// Receives a user-supplied custom restore source as a raw streamed body and
// stores it under custom-uploads/. The worker later pulls it into scratch and
// restores from there, then deletes it. Streaming (not FormData) keeps large
// files from buffering in memory.
export async function POST(request: NextRequest) {
  const { error: authError } = await authorizeRequest();
  if (authError) {
    return NextResponse.json(
      { data: null, error: { message: authError.message } },
      { status: 401 },
    );
  }

  if (!request.body) {
    return NextResponse.json(
      { data: null, error: { message: "Empty request body" } },
      { status: 400 },
    );
  }

  const filename = request.headers.get("x-filename") ?? "upload";
  const ext = path.extname(filename).replace(".", "") || "bin";
  const key = buildCustomUploadKey(randomUUID(), ext);

  try {
    const store = await getStore();
    const nodeStream = Readable.fromWeb(
      request.body as unknown as NodeWebReadableStream<Uint8Array>,
    );
    await store.uploadStream(nodeStream, key);

    return NextResponse.json({ data: { key }, error: null });
  } catch (error) {
    console.error("Custom source upload failed:", error);
    return NextResponse.json(
      { data: null, error: { message: "Upload failed" } },
      { status: 500 },
    );
  }
}
