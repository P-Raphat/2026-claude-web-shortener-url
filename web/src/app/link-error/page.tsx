import Link from "next/link";

const reasons: Record<string, { code: string; title: string; description: string }> = {
  not_found: {
    code: "404",
    title: "Link not found",
    description: "This short link doesn't exist or may have been deleted.",
  },
  inactive: {
    code: "410",
    title: "Link deactivated",
    description: "This short link has been deactivated by its owner.",
  },
  expired: {
    code: "410",
    title: "Link expired",
    description: "This short link has passed its expiry date and is no longer active.",
  },
  error: {
    code: "500",
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again later.",
  },
};

const fallback = reasons.not_found;

export default async function LinkErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;
  const { code, title, description } = reasons[reason ?? ""] ?? fallback;

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-8">
      <div className="max-w-[400px] w-full">
        <p className="font-display text-8xl font-semibold text-edge-hi mb-6 tabular-nums leading-none">
          {code}
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink mb-2">{title}</h1>
        <p className="text-ink-lo text-sm leading-relaxed mb-8 max-w-[40ch]">{description}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-ink-lo hover:text-ink transition-colors underline underline-offset-4"
        >
          ← Go home
        </Link>
      </div>
    </div>
  );
}
