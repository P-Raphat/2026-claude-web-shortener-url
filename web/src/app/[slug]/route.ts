import { NextRequest, NextResponse } from "next/server";

const REDIRECT_SERVICE_URL = process.env.REDIRECT_SERVICE_URL ?? "http://localhost:8080";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let res: Response;
  try {
    res = await fetch(`${REDIRECT_SERVICE_URL}/${slug}`, { redirect: "manual" });
  } catch {
    return NextResponse.redirect(new URL("/link-error?reason=error", request.url));
  }

  const location = res.headers.get("location");
  if ((res.status === 301 || res.status === 302) && location) {
    return NextResponse.redirect(location, { status: res.status });
  }

  return NextResponse.redirect(new URL("/link-error?reason=not_found", request.url));
}
