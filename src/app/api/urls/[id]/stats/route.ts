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
  // Table name from Click model @@map("shorturl-click") in prisma/schema.prisma
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const rows = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT DATE(clicked_at) AS date, COUNT(*) AS count
    FROM \`shorturl-click\`
    WHERE url_id = ${id} AND clicked_at >= ${thirtyDaysAgo}
    GROUP BY DATE(clicked_at)
    ORDER BY date ASC
  `;
  const clicks = rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  const total = await prisma.click.count({ where: { urlId: id } });

  return NextResponse.json({ clicks, total });
}
