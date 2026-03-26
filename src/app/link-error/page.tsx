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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-600 mb-4">{code}</p>
        <h1 className="text-2xl font-bold text-white mb-2">{title}</h1>
        <p className="text-slate-400 mb-8">{description}</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
          Go home
        </Link>
      </div>
    </div>
  );
}
