import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { cmsPageSchema } from "@/lib/validation";

export async function GET() {
  const pages = await prisma.cmsPage.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(pages);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = cmsPageSchema.parse(body);

    const page = await prisma.cmsPage.create({
      data: {
        title: parsed.title,
        slug: parsed.slug,
        content: parsed.content,
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        status: parsed.status,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid CMS page payload" },
      { status: 400 }
    );
  }
}
