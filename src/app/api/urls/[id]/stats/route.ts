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
  const rows = await prisma.$queryRaw<{ date: string; count: bigint }[]>`
    SELECT
      DATE_FORMAT(clicked_at, '%Y-%m-%d') AS date,
      COUNT(*) AS count
    FROM \`shorturl-click\`
    WHERE url_id = ${id}
      AND clicked_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE_FORMAT(clicked_at, '%Y-%m-%d')
    ORDER BY date ASC
  `;

  const clicks = rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  const total = await prisma.click.count({ where: { urlId: id } });

  return NextResponse.json({ clicks, total });
}
