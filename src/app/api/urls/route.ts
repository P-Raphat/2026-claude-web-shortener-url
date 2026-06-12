import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";
import { createUrlSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
  const skip = (page - 1) * limit;

  const [urls, total] = await Promise.all([
    prisma.url.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: { _count: { select: { clicks: true } } },
    }),
    prisma.url.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({ urls, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createUrlSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { originalUrl, title, expiresAt } = parsed.data;
  let shortCode = parsed.data.shortCode;

  if (shortCode) {
    const existing = await prisma.url.findUnique({ where: { shortCode } });
    if (existing) {
      return NextResponse.json({ error: "Short code already taken" }, { status: 409 });
    }
  } else {
    let found = false;
    for (let i = 0; i < 5; i++) {
      shortCode = nanoid(7);
      const existing = await prisma.url.findUnique({ where: { shortCode } });
      if (!existing) { found = true; break; }
    }
    if (!found) {
      return NextResponse.json({ error: "Failed to generate unique code, please try again" }, { status: 503 });
    }
  }

  const url = await prisma.url.create({
    data: {
      shortCode: shortCode as string,
      originalUrl,
      title,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      userId: session.user.id,
    },
  });

  // Warm the cache for the redirect service
  await redis.set(
    `url:${shortCode}`,
    JSON.stringify({
      id: url.id,
      original_url: url.originalUrl,
      expires_at: url.expiresAt?.toISOString() ?? null,
      is_active: url.isActive,
    }),
    "EX",
    86400
  );

  return NextResponse.json(url, { status: 201 });
}
