import { db } from "@/db";
import { databasesTable } from "@/db/schema";
import { databaseSchema } from "@/lib/zod/database";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import authorizeRequest from "../_utils/authorize-request";

export async function GET(request: NextRequest) {
  const { data, error: authError } = await authorizeRequest(request);

  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }
  const userId = data.user.id;

  try {
    const databases = await db
      .select()
      .from(databasesTable)
      .where(eq(databasesTable.userId, userId));

    return NextResponse.json({ data: { databases }, error: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { message: "Internal server error" }, data: null },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const { data, error: authError } = await authorizeRequest(request);

  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }
  const userId = data.user.id;

  const body = await request.json();
  const name = body.name;
  const url = body.url;

  const result = databaseSchema.safeParse({ name, url });

  if (!result.success) {
    return NextResponse.json(
      { error: { message: result.error.issues[0].message }, data: null },
      { status: 400 },
    );
  }

  try {
    // check if name already exists
    const [existingDatabase] = await db
      .select()
      .from(databasesTable)
      .where(
        and(eq(databasesTable.userId, userId), eq(databasesTable.name, name)),
      );

    if (existingDatabase) {
      return NextResponse.json(
        { error: { message: "Database name already exists" }, data: null },
        { status: 400 },
      );
    }

    const [database] = await db
      .insert(databasesTable)
      .values({
        id: randomUUID(),
        name: result.data.name,
        url: result.data.url,
        userId,
      })
      .returning();

    revalidatePath("/dashboard");
    return NextResponse.json({ data: { database }, error: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { message: "Internal server error" }, data: null },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const { data, error: authError } = await authorizeRequest(request);

  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }
  const userId = data.user.id;

  const body = await request.json();
  const id = body.id;
  const name = body.name;
  const url = body.url;

  if (!id) {
    return NextResponse.json(
      { error: { message: "ID is required" }, data: null },
      { status: 400 },
    );
  }

  const result = databaseSchema.safeParse({ name, url });

  if (!result.success) {
    return NextResponse.json(
      { error: { message: result.error.issues[0].message }, data: null },
      { status: 400 },
    );
  }

  try {
    const [database] = await db
      .update(databasesTable)
      .set({ name: result.data.name, url: result.data.url })
      .where(and(eq(databasesTable.id, id), eq(databasesTable.userId, userId)))
      .returning();

    revalidatePath("/dashboard");
    return NextResponse.json({ data: { database }, error: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { message: "Internal server error" }, data: null },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { data, error: authError } = await authorizeRequest(request);

  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }
  const userId = data.user.id;

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id") as string;

  if (!id) {
    return NextResponse.json(
      { error: { message: "ID is required" }, data: null },
      { status: 400 },
    );
  }

  try {
    await db
      .delete(databasesTable)
      .where(and(eq(databasesTable.id, id), eq(databasesTable.userId, userId)));

    revalidatePath("/dashboard");
    return NextResponse.json({ data: null, error: null });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: { message: "Internal server error" }, data: null },
      { status: 500 },
    );
  }
}
