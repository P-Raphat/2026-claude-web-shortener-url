import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800 px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-slate-600 mb-4">404</p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-slate-400 mb-8">The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold">
          Go to dashboard
        </Link>
      </div>
    </div>
  );
}
