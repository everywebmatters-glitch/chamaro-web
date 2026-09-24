import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { inventorySchema } from "@/lib/validation";

export async function GET() {
  const inventory = await prisma.inventory.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(inventory);
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const parsed = inventorySchema.parse(body);

    const record = await prisma.inventory.create({
      data: {
        quantity: parsed.quantity,
        lowStockThreshold: parsed.lowStockThreshold,
      },
    });

    return NextResponse.json(record);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid inventory payload" },
      { status: 400 }
    );
  }
}
