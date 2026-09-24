import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { categorySchema } from "@/lib/validation";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = categorySchema.parse(body);

    const category = await prisma.category.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
        image: parsed.image,
        status: parsed.status,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid category payload" },
      { status: 400 }
    );
  }
}
