"use client";

import { useState, useEffect, useCallback } from "react";
import { ClickChart } from "./ClickChart";
import { EditUrlModal } from "./EditUrlModal";
import { Toast, type ToastData } from "@/components/ui/Toast";
import type { Url } from "@/types/url";

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

  async function copyToClipboard(shortCode: string) {
    const url = `${window.location.origin}/${shortCode}`;
    await navigator.clipboard.writeText(url);
    setToast({ type: "success", message: "Copied to clipboard!" });
  }

  if (loading && urls.length === 0) {
    return <p className="text-ink-ghost text-sm">Loading…</p>;
  }

  if (!loading && urls.length === 0) {
    return (
      <div className="border border-edge rounded-lg p-8 text-center">
        <p className="text-ink-ghost text-sm">No links yet.</p>
        <p className="text-ink-ghost text-xs mt-1">Shorten your first URL above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {urls.map((url) => (
        <div key={url.id} className="border border-edge rounded-lg overflow-hidden">
          <div className="p-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-ink truncate">
                {url.title ?? url.shortCode}
              </p>
              <div className="flex items-center gap-2.5 mt-1">
                <a
                  href={`/${url.shortCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gold text-sm hover:underline underline-offset-2"
                >
                  /{url.shortCode}
                </a>
                <button
                  onClick={() => copyToClipboard(url.shortCode)}
                  className="text-[11px] text-ink-ghost hover:text-ink-lo transition-colors uppercase tracking-wide"
                >
                  copy
                </button>
              </div>
              <p className="text-ink-ghost text-xs truncate mt-0.5">{url.originalUrl}</p>
              {url.expiresAt && (
                <p className={`text-xs mt-1 ${new Date(url.expiresAt) < new Date() ? "text-danger" : "text-ink-ghost"}`}>
                  Expires {formatExpiry(url.expiresAt)}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => toggleActive(url)}
                className={`text-xs px-2.5 py-1 rounded font-medium transition-colors ${
                  url.isActive
                    ? "bg-gold-dim text-gold"
                    : "bg-raised text-ink-ghost"
                }`}
              >
                {url.isActive ? "Active" : "Inactive"}
              </button>
              <span className="text-xs text-ink-ghost tabular-nums">
                {url._count.clicks} clicks
              </span>
            </div>
          </div>

          <div className="border-t border-edge px-4 py-2 flex items-center justify-end gap-1 bg-raised">
            <button
              onClick={() => viewStats(url.id)}
              className={`text-xs px-3 py-1.5 rounded transition-colors font-medium ${
                selectedId === url.id
                  ? "text-gold"
                  : "text-ink-lo hover:text-ink"
              }`}
            >
              {selectedId === url.id ? "Hide stats" : "Stats"}
            </button>
            <button
              onClick={() => setEditUrl(url)}
              className="text-xs px-3 py-1.5 rounded text-ink-lo hover:text-ink transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => deleteUrl(url.id)}
              className="text-xs px-3 py-1.5 rounded text-danger hover:bg-danger-dim transition-colors"
            >
              Delete
            </button>
          </div>

          {selectedId === url.id && stats && (
            <div className="px-4 pb-4 pt-3 border-t border-edge">
              <p className="text-xs text-ink-ghost mb-3">
                Last 30 days —{" "}
                <span className="font-medium text-ink-lo">{stats.total} total clicks</span>
              </p>
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
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="px-3 py-1.5 border border-edge rounded text-sm text-ink-lo disabled:opacity-30 hover:border-edge-hi hover:text-ink transition-colors"
          >
            Prev
          </button>
          <span className="text-sm py-1.5 text-ink-ghost">Page {page}</span>
          <button
            disabled={page * 20 >= total}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 border border-edge rounded text-sm text-ink-lo disabled:opacity-30 hover:border-edge-hi hover:text-ink transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
