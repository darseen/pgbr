import { verifyToken } from "@/utils/jwt";
import { NextRequest } from "next/server";

export default async function authorizeRequest(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return { error: { message: "Unauthorized" }, data: null };
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return { error: { message: "Unauthorized" }, data: null };
  }

  return { error: null, data: { user: payload.user } };
}
