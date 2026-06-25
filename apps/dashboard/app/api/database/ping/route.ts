import { db } from "@/db";
import { databasesTable } from "@/db/schema";
import { decrypt } from "@/utils/encryption";
import { spawn } from "child_process";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import authorizeRequest from "../../_utils/authorize-request";

export async function POST(request: Request) {
  const { data, error: authError } = await authorizeRequest();

  if (authError) {
    return NextResponse.json(
      { error: { message: authError.message }, data: null },
      { status: 401 },
    );
  }
  const userId = data.user.id;

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: { message: "Database ID is required" } },
        { status: 400 },
      );
    }

    const [database] = await db
      .select()
      .from(databasesTable)
      .where(and(eq(databasesTable.id, id), eq(databasesTable.userId, userId)));

    if (!database) {
      return NextResponse.json(
        { error: { message: "Database not found" }, data: null },
        { status: 404 },
      );
    }
    const isReady = await new Promise((resolve) => {
      const process = spawn("pg_isready", [
        "-d",
        decrypt(database.url),
        "-t",
        "5",
      ]);

      // Capture standard output
      process.stdout.on("data", (data) => {
        console.log(`pg_isready stdout: ${data.toString().trim()}`);
      });

      process.stderr.on("data", (data) => {
        console.error(`pg_isready stderr: ${data.toString().trim()}`);
      });

      process.on("close", (code) => {
        console.log(`pg_isready exited with code: ${code}`);
        resolve(code === 0);
      });

      process.on("error", (err) => {
        console.error("Failed to start pg_isready process:", err);
        resolve(false);
      });
    });

    if (isReady) {
      return NextResponse.json({ data: null, error: null }, { status: 200 });
    } else {
      return NextResponse.json(
        { data: null, error: { message: "Failed to connect to the database" } },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Database ping failed:", error);
    return NextResponse.json(
      { data: null, error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}
