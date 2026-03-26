import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

async function getUrlOrForbid(id: string, userId: string) {
  const url = await prisma.url.findUnique({ where: { id } });
  if (!url) return { error: "Not found", status: 404 };
  if (url.userId !== userId) return { error: "Forbidden", status: 403 };
  return { url };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getUrlOrForbid(id, session.user.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const clicks = await prisma.click.findMany({
    where: { urlId: id },
    orderBy: { clickedAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ ...result.url, clicks });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getUrlOrForbid(id, session.user.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  const body = await req.json();
  const updated = await prisma.url.update({
    where: { id },
    data: {
      isActive: body.isActive,
      title: body.title,
      expiresAt: body.expiresAt === undefined ? undefined : body.expiresAt === null ? null : new Date(body.expiresAt),
    },
  });

  try {
    if (updated.isActive) {
      // Repopulate cache immediately with the new values so the redirect
      // service sees the updated expiresAt without needing a DB round-trip.
      await redis.set(
        `url:${updated.shortCode}`,
        JSON.stringify({
          id: updated.id,
          original_url: updated.originalUrl,
          expires_at: updated.expiresAt?.toISOString() ?? null,
          is_active: true,
        }),
        "EX",
        86400,
      );
    } else {
      // Inactive → write the not-found sentinel so the redirect service
      // returns 410 immediately without hitting the DB.
      await redis.set(`url:${updated.shortCode}`, "__not_found__", "EX", 300);
    }
  } catch (err) {
    console.error(`redis update failed for ${updated.shortCode}:`, err);
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await getUrlOrForbid(id, session.user.id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  await prisma.url.delete({ where: { id } });
  await redis.del(`url:${result.url.shortCode}`);

  return new NextResponse(null, { status: 204 });
}
