"use client";

import { useState, useEffect, useCallback } from "react";
import { ClickChart } from "./ClickChart";
import { EditUrlModal } from "./EditUrlModal";
import { Toast, type ToastData } from "@/components/ui/Toast";

interface Url {
  id: string;
  shortCode: string;
  originalUrl: string;
  title: string | null;
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  _count: { clicks: number };
}

function formatExpiry(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

interface Props {
  refreshKey: number;
}

export function UrlList({ refreshKey }: Props) {
  const [urls, setUrls] = useState<Url[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ data: { date: string; count: number }[]; total: number } | null>(null);
  const [editUrl, setEditUrl] = useState<Url | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);

  const fetchUrls = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/urls?page=${page}&limit=20`);
    const json = await res.json();
    setUrls(json.urls ?? []);
    setTotal(json.total ?? 0);
    setLoading(false);
  }, [page]);

  useEffect(() => { fetchUrls(); }, [fetchUrls, refreshKey]);

  async function toggleActive(url: Url) {
    await fetch(`/api/urls/${url.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !url.isActive }),
    });
    fetchUrls();
  }

  function deleteUrl(id: string) {
    setToast({
      type: "confirm",
      message: "Delete this link?",
      confirmLabel: "Delete",
      onCancel: () => setToast(null),
      onConfirm: async () => {
        setToast(null);
        const res = await fetch(`/api/urls/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchUrls();
          setToast({ type: "success", message: "Link deleted" });
        } else {
          setToast({ type: "error", message: "Failed to delete link" });
        }
      },
    });
  }

  async function viewStats(id: string) {
    if (selectedId === id) { setSelectedId(null); setStats(null); return; }
    setSelectedId(id);
    setStats(null);
    try {
      const res = await fetch(`/api/urls/${id}/stats`);
      if (!res.ok) throw new Error(`${res.status}`);
      const json = await res.json();
      setStats({ data: json.clicks, total: json.total });
    } catch {
      setSelectedId(null);
    }
  }

  const redirectBase = process.env.NEXT_PUBLIC_REDIRECT_URL ?? "";

  return (
    <div className="space-y-3">
      {loading && <p className="text-slate-400 text-sm">Loading…</p>}
      {urls.map((url) => (
        <div key={url.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Info section */}
          <div className="p-4 flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm text-gray-900 truncate">{url.title ?? url.shortCode}</p>
              <a href={`${redirectBase}/${url.shortCode}`} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">
                {redirectBase}/{url.shortCode}
              </a>
              <p className="text-gray-400 text-xs truncate mt-0.5">{url.originalUrl}</p>
              {url.expiresAt && (
                <p className={`text-xs mt-1 font-medium ${new Date(url.expiresAt) < new Date() ? "text-red-500" : "text-amber-500"}`}>
                  Expires: {formatExpiry(url.expiresAt)}
                </p>
              )}
            </div>
            {/* Active badge — top right */}
            <button
              onClick={() => toggleActive(url)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${url.isActive ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
            >
              {url.isActive ? "● Active" : "○ Inactive"}
            </button>
          </div>

          {/* Action bar */}
          <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between gap-2 bg-gray-50">
            <span className="text-xs text-gray-400 font-medium">{url._count.clicks} clicks</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => viewStats(url.id)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${selectedId === url.id ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
              >
                {selectedId === url.id ? "Hide stats" : "Stats"}
              </button>
              <button
                onClick={() => setEditUrl(url)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => deleteUrl(url.id)}
                className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>

          {/* Stats chart */}
          {selectedId === url.id && stats && (
            <div className="px-4 pb-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Last 30 days — <span className="font-semibold text-gray-700">{stats.total} total clicks</span></p>
              <ClickChart data={stats.data} />
            </div>
          )}
        </div>
      ))}
      {editUrl && (
        <EditUrlModal
          url={editUrl}
          onClose={() => setEditUrl(null)}
          onSaved={() => { fetchUrls(); setToast({ type: "success", message: "Link updated" }); }}
        />
      )}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      {total > 20 && (
        <div className="flex gap-2 justify-center pt-2">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 border border-slate-600 rounded-lg text-sm text-slate-200 disabled:opacity-40 hover:bg-slate-700 transition-colors">Prev</button>
          <span className="text-sm py-1.5 text-slate-300">Page {page}</span>
          <button disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 border border-slate-600 rounded-lg text-sm text-slate-200 disabled:opacity-40 hover:bg-slate-700 transition-colors">Next</button>
        </div>
      )}
    </div>
  );
}
