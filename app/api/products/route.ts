import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productSchema } from "@/lib/validation";

export async function GET() {
  const products = await prisma.product.findMany({
    include: {
      categories: { include: { category: true } },
      images: true,
      variants: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = productSchema.parse(body);

    const product = await prisma.product.create({
      data: {
        name: parsed.name,
        slug: parsed.slug,
        description: parsed.description,
        shortDescription: parsed.shortDescription,
        sku: parsed.sku,
        basePrice: parsed.basePrice,
        compareAtPrice: parsed.compareAtPrice,
        status: parsed.status,
        featured: parsed.featured ?? false,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid product payload" },
      { status: 400 }
    );
  }
}
