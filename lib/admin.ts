import { NextResponse } from "next/server";

export function requireAdminAccess(request: Request) {
  const adminKey = process.env.ADMIN_API_KEY ?? "";
  const headerKey = request.headers.get("x-admin-key");

  if (!adminKey || !headerKey || headerKey !== adminKey) {
    throw new NextResponse("Unauthorized", { status: 401 });
  }
}
