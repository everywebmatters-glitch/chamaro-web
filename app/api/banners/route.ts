import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const banners = await prisma.banner.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(banners);
}
