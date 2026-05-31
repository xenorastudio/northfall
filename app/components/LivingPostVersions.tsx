"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { History, ChevronDown, X, Clock, AtSign, Check, ArrowLeftRight, GitCommitHorizontal, Upload, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ConfirmModal from "./ConfirmModal";
import BeforeAfterSlider from "./BeforeAfterSlider";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostVersion {
  version: number;
  imageUrl: string;
  imageUrls?: string[];
  title?: string;
  body?: string;
  flair?: string;
  poll?: { options: string[]; votes: number[]; duration: string } | null;
  changelog: string;
  mentions: string[];
  publishedAt: string;
  authorName?: string;
  authorPhoto?: string;
}

interface LivingPostVersionsProps {
  versions: PostVersion[];
  currentVersion: number;
  onVersionChange?: (idx: number) => void;
  onVersionsUpdated?: (versions: PostVersion[]) => void;
  postId?: string;
  canManageVersions?: boolean;
  onUpgradeClick?: () => void;
  compact?: boolean;
  authorName?: string;
  authorPhoto?: string;
  postTitle?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(ts: string) {
  try {
    const s = (Date.now() - new Date(ts).getTime()) / 1000;
    if (s < 60) return "الآن";
    if (s < 3600) return `${Math.floor(s / 60)} دقيقة`;
    if (s < 86400) return `${Math.floor(s / 3600)} ساعة`;
    if (s < 2592000) return `${Math.floor(s / 86400)} يوم`;
    return `${Math.floor(s / 2592000)} شهر`;
  } catch { return ""; }
}

function formatDate(ts: string) {
  try {
    return new Date(ts).toLocaleDateString("ar-SA", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
}

/** Map version number (e.g. 3) to array index; never returns out-of-range index. */
function resolveVersionIndex(versions: PostVersion[], currentVersion: number): number {
  if (!versions.length) return 0;
  const byNumber = versions.findIndex((v) => v.version === currentVersion);
  if (byNumber >= 0) return byNumber;
  // Back-compat: treat as 0-based index only when it points at a real entry
  if (currentVersion >= 0 && currentVersion < versions.length) return currentVersion;
  return versions.length - 1;
}

// ─── Text Diff Viewer ─────────────────────────────────────────────────────────

function TextDiffViewer({
  oldText, newText, oldLabel, newLabel, onClose,
}: {
  oldText: string; newText: string;
  oldLabel: string; newLabel: string;
  onClose: () => void;
}) {
  type DiffLine = { type: "same" | "removed" | "added"; text: string };
  const oldLines = (oldText || "").split("\n");
  const newLines = (newText || "").split("\n");
  const diff: DiffLine[] = [];
  const maxLen = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = oldLines[i]; const n = newLines[i];
    if (o === n) { if (o !== undefined) diff.push({ type: "same", text: o }); }
    else {
      if (o !== undefined) diff.push({ type: "removed", text: o });
      if (n !== undefined) diff.push({ type: "added", text: n });
    }
  }
  const added = diff.filter(d => d.type === "added").length;
  const removed = diff.filter(d => d.type === "removed").length;

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const panel = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[9999] flex flex-col bg-black"
    >
      <div className="flex items-center justify-between px-5 h-12 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-3 text-[11px]">
          <span className="text-white/40">{oldLabel}</span>
          <span className="text-white/20">→</span>
          <span className="text-white/70 font-semibold">{newLabel}</span>
          <span className="text-green-400/60 text-[10px]">+{added}</span>
          <span className="text-red-400/60 text-[10px]">−{removed}</span>
        </div>
        <button onClick={onClose} className="text-[11px] text-white/40 hover:text-white/80 transition-colors px-2 py-1 rounded border border-white/10 hover:border-white/20">إغلاق</button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 font-mono text-[12px] leading-relaxed" dir="ltr">
        {diff.map((line, i) => (
          <div key={i} className={cn("px-3 py-0.5 rounded-sm",
            line.type === "added" && "bg-green-500/10 text-green-400",
            line.type === "removed" && "bg-red-500/10 text-red-400 line-through opacity-60",
            line.type === "same" && "text-white/25",
          )}>
            <span className="select-none mr-3 text-white/20 text-[10px]">
              {line.type === "added" ? "+" : line.type === "removed" ? "−" : " "}
            </span>
            {line.text || " "}
          </div>
        ))}
        {diff.length === 0 && <p className="text-white/30 text-center py-8">لا يوجد فرق في النص</p>}
      </div>
      <p className="text-center text-[10px] text-white/15 py-2 border-t border-white/5">Esc للإغلاق</p>
    </motion.div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(panel, document.body);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LivingPostVersions({
  versions,
  currentVersion,
  onVersionChange,
  onVersionsUpdated,
  postId,
  canManageVersions = false,
  onUpgradeClick,
  compact = false,
  authorName,
  authorPhoto,
  postTitle,
}: LivingPostVersionsProps) {
  const [activeIdx, setActiveIdx] = useState(() => resolveVersionIndex(versions, currentVersion));
  const [showChangelog, setShowChangelog] = useState(false);
  const [showSlider, setShowSlider] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [deletingVersion, setDeletingVersion] = useState<number | null>(null);
  const [deleteConfirmVersion, setDeleteConfirmVersion] = useState<number | null>(null);

  useEffect(() => {
    setActiveIdx(resolveVersionIndex(versions, currentVersion));
  }, [currentVersion, versions]);

  const safeIdx =
    versions.length === 0
      ? 0
      : Math.min(Math.max(0, activeIdx), versions.length - 1);
  const activeVersion = versions[safeIdx] ?? versions[versions.length - 1];
  const prevVersion = safeIdx > 0 ? versions[safeIdx - 1] : null;
  const isLatest = safeIdx === versions.length - 1;
  const hasMultiple = versions.length > 1;
  const canGoBack = safeIdx > 0;
  const canGoForward = safeIdx < versions.length - 1;

  const handleChange = (idx: number) => {
    const next = Math.min(Math.max(0, idx), versions.length - 1);
    setActiveIdx(next);
    onVersionChange?.(next);
  };
  const handlePrev = () => { if (canGoBack) handleChange(safeIdx - 1); };
  const handleNext = () => { if (canGoForward) handleChange(safeIdx + 1); };

  const handleCopyVersionLink = () => {
    const url = `${window.location.href.split("?")[0]}?v=${activeVersion?.version ?? 1}`;
    navigator.clipboard?.writeText(url).catch(() => {});
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleDeleteVersion = async (versionNum: number) => {
    if (!postId || !canManageVersions || versions.length <= 1) return;
    setDeletingVersion(versionNum);
    try {
      const nextVersions = versions.filter((v) => v.version !== versionNum);
      const latest = nextVersions[nextVersions.length - 1];
      await updateDoc(doc(db, "posts", postId), {
        versions: nextVersions,
        currentVersion: latest?.version ?? 1,
        ...(latest?.title ? { title: latest.title } : {}),
        ...(latest?.body !== undefined ? { body: latest.body } : {}),
        ...(latest?.imageUrl ? { imageUrl: latest.imageUrl } : {}),
        ...(latest?.imageUrls ? { imageUrls: latest.imageUrls } : {}),
      });
      onVersionsUpdated?.(nextVersions);
      const newIdx = Math.min(safeIdx, nextVersions.length - 1);
      handleChange(newIdx);
    } catch (e) {
      console.error("[LivingPostVersions] delete version:", e);
    } finally {
      setDeletingVersion(null);
    }
  };

  if (!versions || versions.length === 0) return null;

  // ── Compact badge (PostCard) ─────────────────────────────────────────────
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-nf-accent">
        <GitCommitHorizontal size={9} />
        حي · v{versions[versions.length - 1].version}
        {versions.length > 1 && <span className="text-nf-dim font-normal">({versions.length})</span>}
      </span>
    );
  }

  // ── Full mode (PostDetail) ───────────────────────────────────────────────
  return (
    <>
      <div className="mt-3">
        <div className="rounded-lg border border-nf-border-2/40 px-2.5 py-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 min-w-0 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              <button
                type="button"
                onClick={handlePrev}
                disabled={!canGoBack}
                className={cn(
                  "w-6 h-6 rounded-md text-[12px] font-bold shrink-0",
                  canGoBack ? "text-nf-muted hover:bg-nf-hover hover:text-nf-text" : "text-nf-border-2/30 cursor-not-allowed"
                )}
              >
                ‹
              </button>
              {versions.map((v, idx) => {
                const isActive = idx === safeIdx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChange(idx)}
                    className={cn(
                      "px-2 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors",
                      isActive ? "bg-nf-accent/15 text-nf-accent" : "text-nf-dim hover:bg-nf-hover hover:text-nf-muted"
                    )}
                  >
                    v{v.version}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={handleNext}
                disabled={!canGoForward}
                className={cn(
                  "w-6 h-6 rounded-md text-[12px] font-bold shrink-0",
                  canGoForward ? "text-nf-muted hover:bg-nf-hover hover:text-nf-text" : "text-nf-border-2/30 cursor-not-allowed"
                )}
              >
                ›
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1 mr-auto text-[11px]">
              {hasMultiple && prevVersion?.imageUrl && activeVersion?.imageUrl && (
                <button
                  type="button"
                  onClick={() => setShowSlider(true)}
                  className="px-2 py-1 rounded-md text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors"
                >
                  قبل/بعد
                </button>
              )}
              {hasMultiple && prevVersion?.body && activeVersion?.body && (
                <button
                  type="button"
                  onClick={() => setShowDiff(true)}
                  className="px-2 py-1 rounded-md text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors"
                >
                  فرق النص
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyVersionLink}
                className="px-2 py-1 rounded-md text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors"
              >
                {copiedLink ? "تم النسخ" : "رابط"}
              </button>
              <button
                type="button"
                onClick={() => setShowChangelog(!showChangelog)}
                className={cn(
                  "px-2 py-1 rounded-md transition-colors",
                  showChangelog ? "text-nf-accent bg-nf-accent/10" : "text-nf-dim hover:text-nf-text hover:bg-nf-hover"
                )}
              >
                السجل
              </button>
              {canManageVersions && onUpgradeClick && (
                <button
                  type="button"
                  onClick={onUpgradeClick}
                  className="px-2 py-1 rounded-md text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                >
                  إصدار جديد
                </button>
              )}
            </div>
          </div>

          {activeVersion?.changelog && activeVersion.changelog !== `تحديث v${activeVersion.version}` && (
            <p className="text-[11px] text-nf-dim leading-relaxed line-clamp-2 pt-1">
              {activeVersion.changelog}
              <span className="text-nf-border-2 mx-1.5">·</span>
              <span className="text-nf-dim/80">{timeAgo(activeVersion.publishedAt)}</span>
            </p>
          )}
        </div>
      </div>

      {/* Old version notice */}
      <AnimatePresence>
        {!isLatest && activeVersion && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.12 }}
            className="overflow-hidden mt-1.5"
          >
            <div className="flex items-center justify-between px-3 py-2 rounded border border-nf-border-2/40 bg-nf-secondary/20 text-[11px]">
              <span className="text-nf-dim">إصدار قديم v{activeVersion.version}</span>
              <button onClick={() => handleChange(versions.length - 1)} className="text-nf-accent hover:underline">
                الأحدث ←
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Changelog dropdown ── */}
      <AnimatePresence>
        {showChangelog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden mt-1.5"
          >
            <div className="border border-nf-border-2/40 rounded-lg overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-nf-border-2/30 bg-nf-secondary/20">
                <div className="flex items-center gap-2">
                  <History size={12} className="text-nf-accent/60" />
                  <span className="text-[11px] font-semibold text-nf-muted">سجل الإصدارات</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-nf-border-2/30 text-nf-dim">{versions.length} إصدار</span>
                </div>
                <button onClick={() => setShowChangelog(false)} className="w-6 h-6 flex items-center justify-center rounded text-nf-dim hover:text-nf-text hover:bg-nf-hover transition-colors">
                  <X size={12} />
                </button>
              </div>

              {/* Version list */}
              {[...versions].reverse().map((v, i, arr) => {
                const originalIdx = versions.findIndex(x => x.version === v.version);
                const isActiveV = originalIdx === safeIdx;
                const isLatestV = i === 0;
                const hasLog = v.changelog && v.changelog !== `تحديث v${v.version}`;
                return (
                  <div
                    key={v.version}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3.5 text-right transition-colors",
                      i < arr.length - 1 && "border-b border-nf-border-2/20",
                      isActiveV ? "bg-nf-hover/40" : "hover:bg-nf-hover/20"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => { handleChange(originalIdx); setShowChangelog(false); }}
                      className="flex items-start gap-3 flex-1 min-w-0 text-right"
                    >
                    {/* Version badge */}
                    <div className={cn(
                      "w-7 h-7 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 border",
                      isLatestV ? "border-nf-accent/40 text-nf-accent bg-nf-accent/8" : "border-nf-border-2/40 text-nf-dim"
                    )}>
                      {v.version}
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn("text-[12px] font-semibold", isLatestV ? "text-nf-accent" : isActiveV ? "text-nf-text" : "text-nf-muted")}>
                          v{v.version}
                        </span>
                        {isLatestV && <span className="text-[9px] px-1.5 py-0.5 rounded bg-nf-accent/10 text-nf-accent border border-nf-accent/20">أحدث</span>}
                        {isActiveV && <span className="text-[9px] text-nf-dim">· محدد</span>}
                        <span className="text-[10px] text-nf-dim mr-auto flex items-center gap-1">
                          <Clock size={9} />{timeAgo(v.publishedAt)}
                        </span>
                      </div>
                      {hasLog && <p className="text-[11px] text-nf-muted leading-relaxed line-clamp-2 whitespace-pre-wrap mb-1">{v.changelog}</p>}
                      {v.mentions && v.mentions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1">
                          {v.mentions.map((m, mi) => (
                            <span key={mi} className="text-[10px] text-nf-accent flex items-center gap-0.5">
                              <AtSign size={8} />{m.replace(/^@/, "")}
                            </span>
                          ))}
                        </div>
                      )}
                      <span className="text-[9px] text-nf-dim/50">{formatDate(v.publishedAt)}</span>
                    </div>
                    {isActiveV && <Check size={12} className="text-nf-accent shrink-0 mt-1" />}
                    </button>
                    {canManageVersions && versions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirmVersion(v.version); }}
                        disabled={deletingVersion === v.version}
                        className="shrink-0 mt-1 p-1.5 rounded-md text-nf-dim hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        title={`حذف v${v.version}`}
                      >
                        {deletingVersion === v.version ? (
                          <span className="w-3 h-3 border border-nf-dim border-t-transparent rounded-full animate-spin block" />
                        ) : (
                          <Trash2 size={12} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-nf-border-2/20 bg-nf-secondary/10 flex items-center gap-4 text-[10px] text-nf-dim">
                <span className="flex items-center gap-1"><GitCommitHorizontal size={9} />{versions.length} إصدار</span>
                <span className="flex items-center gap-1"><Clock size={9} />أول نشر: {timeAgo(versions[0]?.publishedAt)}</span>
                {versions[versions.length - 1]?.authorName && (
                  <span>بقلم: {versions[versions.length - 1].authorName}</span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Before/After Image Slider */}
      <AnimatePresence>
        {showSlider && prevVersion && activeVersion && (
          <BeforeAfterSlider
            before={prevVersion.imageUrl}
            after={activeVersion.imageUrl}
            beforeLabel={`v${prevVersion.version}`}
            afterLabel={`v${activeVersion.version}`}
            onClose={() => setShowSlider(false)}
            authorName={authorName}
            authorPhoto={authorPhoto}
            title={postTitle}
          />
        )}
      </AnimatePresence>

      {/* Text Diff Viewer */}
      <AnimatePresence>
        {showDiff && prevVersion && activeVersion && (
          <TextDiffViewer
            oldText={prevVersion.body || ""}
            newText={activeVersion.body || ""}
            oldLabel={`v${prevVersion.version}`}
            newLabel={`v${activeVersion.version}`}
            onClose={() => setShowDiff(false)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        open={deleteConfirmVersion !== null}
        title="حذف الإصدار؟"
        message={
          deleteConfirmVersion !== null
            ? `سيتم حذف الإصدار v${deleteConfirmVersion} نهائياً.`
            : ""
        }
        confirmLabel="حذف"
        cancelLabel="إلغاء"
        danger
        loading={deletingVersion !== null}
        onCancel={() => {
          if (deletingVersion === null) setDeleteConfirmVersion(null);
        }}
        onConfirm={() => {
          if (deleteConfirmVersion !== null) {
            void handleDeleteVersion(deleteConfirmVersion).finally(() => setDeleteConfirmVersion(null));
          }
        }}
      />
    </>
  );
}
