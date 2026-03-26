import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const url = await prisma.url.findUnique({ where: { id } });
  if (!url) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (url.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Clicks per day for the last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rawClicks = await prisma.click.findMany({
    where: {
      urlId: id,
      clickedAt: { gte: thirtyDaysAgo },
    },
    select: { clickedAt: true },
    orderBy: { clickedAt: "asc" },
  });

  const clicksByDay = new Map<string, number>();
  for (const click of rawClicks) {
    const date = click.clickedAt.toISOString().slice(0, 10);
    clicksByDay.set(date, (clicksByDay.get(date) ?? 0) + 1);
  }
  const clicks = Array.from(clicksByDay, ([date, count]) => ({ date, count }));
  const total = await prisma.click.count({ where: { urlId: id } });

  return NextResponse.json({ clicks, total });
}
