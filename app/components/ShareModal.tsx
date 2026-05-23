"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, Link2 } from "lucide-react";
import { useState } from "react";
import { useI18n } from "./I18nProvider";

function IconWhatsApp() { return <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.952 11.952 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.327 0-4.542-.681-6.435-1.966l-.246-.166-3.044 1.02 1.02-3.044-.166-.246A9.956 9.956 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>; }
function IconTelegram() { return <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>; }
function IconX() { return <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>; }
function IconFacebook() { return <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>; }
function IconReddit() { return <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.823.07 3.48.632 4.674 1.488.308-.309.73-.491 1.183-.491.927 0 1.68.753 1.68 1.68 0 .858-.647 1.566-1.479 1.669.025.176.039.357.039.539 0 2.795-3.266 5.065-7.294 5.065-4.028 0-7.294-2.27-7.294-5.065 0-.19.014-.377.04-.56-.832-.103-1.479-.812-1.479-1.67 0-.927.753-1.68 1.68-1.68.456 0 .882.185 1.19.5 1.193-.914 2.849-1.477 4.674-1.549l.885-4.15a.5.5 0 0 1 .6-.412l2.905.607a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094A.332.332 0 0 0 9 16.31a3.32 3.32 0 0 0 3.06 1.942 3.32 3.32 0 0 0 3.06-1.942.332.332 0 0 0-.053-.226.327.327 0 0 0-.231-.094c-.082 0-.164.034-.226.094a2.66 2.66 0 0 1-2.55 1.61 2.66 2.66 0 0 1-2.55-1.61.327.327 0 0 0-.226-.094z"/></svg>; }
function IconLinkedIn() { return <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>; }

const sharePlatforms = [
  {
    id: "whatsapp",
    name: "WhatsApp",
    iconComp: IconWhatsApp,
    color: "#25D366",
    getUrl: (title: string, url: string) => `https://wa.me/?text=${encodeURIComponent(title + '\n' + url)}`,
  },
  {
    id: "telegram",
    name: "Telegram",
    iconComp: IconTelegram,
    color: "#0088cc",
    getUrl: (title: string, url: string) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    iconComp: IconX,
    color: "#000",
    getUrl: (title: string, url: string) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
  },
  {
    id: "facebook",
    name: "Facebook",
    iconComp: IconFacebook,
    color: "#1877f2",
    getUrl: (_title: string, url: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    id: "reddit",
    name: "Reddit",
    iconComp: IconReddit,
    color: "#ff4500",
    getUrl: (title: string, url: string) => `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    iconComp: IconLinkedIn,
    color: "#0a66c2",
    getUrl: (_title: string, url: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    id: "copy",
    nameKey: "share.copyLink",
    iconComp: () => <Link2 size={16} />,
    color: "#5865f2",
    getUrl: () => "",
  },
];

export default function ShareModal({
  open,
  onClose,
  postId,
  postTitle,
}: {
  open: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
}) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const postUrl = typeof window !== "undefined" ? `${window.location.origin}${window.location.pathname}?view=thread&threadId=${postId}` : "";

  const handleShare = (platformId: string) => {
    if (platformId === "copy") {
      navigator.clipboard.writeText(postUrl).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
      return;
    }
    const platform = sharePlatforms.find(p => p.id === platformId);
    if (platform) {
      window.open(platform.getUrl(postTitle, postUrl), "_blank", "width=600,height=400");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-nf-primary border border-nf-border rounded-xl w-full max-w-[360px] mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-nf-border-2">
              <button onClick={onClose} className="text-nf-muted hover:text-nf-text p-1"><X size={16} /></button>
              <div className="text-sm font-bold text-nf-text">{t("share.title")}</div>
              <div className="w-6" />
            </div>
            <div className="p-4">
              <p className="text-xs text-nf-muted mb-3 line-clamp-2">{postTitle}</p>
              <div className="flex flex-col gap-2">
                {sharePlatforms.map((p) => {
                  const IconComp = p.iconComp;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleShare(p.id)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-nf-hover transition-colors w-full"
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: p.color + "20", color: p.color }}>
                        <IconComp />
                      </div>
                      <span className="text-sm text-nf-text font-medium flex-1 text-right">
                        {p.id === "copy" ? (copied ? t("share.copied") : t("share.copyLink")) : p.name}
                      </span>
                      {p.id === "copy" && (
                        copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-nf-dim" />
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-nf-border-2">
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={postUrl}
                    className="flex-1 bg-nf-secondary border border-nf-border-2 rounded-lg px-3 py-2 text-xs text-nf-muted outline-none"
                  />
                  <button
                    onClick={() => handleShare("copy")}
                    className="px-3 py-2 rounded-lg bg-nf-accent text-white text-xs font-bold hover:bg-nf-accent/80 transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
