"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import MediaPositionModal from "./MediaPositionModal";
import MediaCoverImage from "./MediaCoverImage";
import type { MediaPosition } from "@/lib/media-object-position";

type CommunityMediaFieldsProps = {
  logoUrl: string;
  bannerUrl: string;
  logoPosition: MediaPosition;
  bannerPosition: MediaPosition;
  onLogoUrlChange: (v: string) => void;
  onBannerUrlChange: (v: string) => void;
  onLogoPositionChange: (v: MediaPosition) => void;
  onBannerPositionChange: (v: MediaPosition) => void;
  readOnly?: boolean;
  /** classic = صفحة التعديل القديمة (خلفية بيضاء) */
  variant?: "app" | "classic";
};

const APP_INPUT =
  "w-full border border-nf-border-2 rounded-xl px-3 py-2.5 text-[12px] text-nf-text font-mono outline-none focus:border-nf-accent transition-colors !bg-transparent";

const CLASSIC_INPUT: React.CSSProperties = {
  width: "100%",
  border: "1px solid #aaa",
  borderRadius: 3,
  padding: "6px 10px",
  fontSize: 11,
  color: "#222",
  background: "#fff",
  outline: "none",
  fontFamily: "monospace",
  boxShadow: "inset 0 1px 3px rgba(0,0,0,.08)",
};

function FieldLabel({
  title,
  hint,
  classic,
}: {
  title: string;
  hint: string;
  classic?: boolean;
}) {
  if (classic) {
    return (
      <div style={{ marginBottom: 6 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#222", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5 }}>{hint}</div>
      </div>
    );
  }
  return (
    <div className="mb-2">
      <p className="text-[12px] font-bold text-nf-text">{title}</p>
      <p className="text-[11px] text-nf-dim mt-0.5">{hint}</p>
    </div>
  );
}

function CustomizeLink({ onClick, label, classic }: { onClick: () => void; label: string; classic?: boolean }) {
  if (classic) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          marginTop: 6,
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 11,
          fontWeight: 600,
          color: "#336699",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "inherit",
          padding: 0,
        }}
      >
        <Pencil size={11} /> {label}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-nf-accent hover:underline"
    >
      <Pencil size={11} /> {label}
    </button>
  );
}

export default function CommunityMediaFields({
  logoUrl,
  bannerUrl,
  logoPosition,
  bannerPosition,
  onLogoUrlChange,
  onBannerUrlChange,
  onLogoPositionChange,
  onBannerPositionChange,
  readOnly = false,
  variant = "app",
}: CommunityMediaFieldsProps) {
  const [modal, setModal] = useState<"logo" | "banner" | null>(null);
  const classic = variant === "classic";

  const openLogo = () => {
    if (!readOnly && logoUrl.trim()) setModal("logo");
  };
  const openBanner = () => {
    if (!readOnly && bannerUrl.trim()) setModal("banner");
  };

  return (
    <div className={classic ? undefined : "space-y-4"} style={classic ? { display: "flex", flexDirection: "column", gap: 14 } : undefined}>
      <div>
        <FieldLabel
          classic={classic}
          title="رابط الشعار"
          hint="صورة دائرية تظهر بجانب اسم المجتمع"
        />
        <div style={classic ? { display: "flex", gap: 6, alignItems: "center" } : undefined} className={!classic ? "flex items-center gap-3" : undefined}>
          <button
            type="button"
            disabled={readOnly || !logoUrl.trim()}
            onClick={openLogo}
            style={
              classic
                ? {
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    overflow: "hidden",
                    border: "1px solid #c8c8c8",
                    padding: 0,
                    flexShrink: 0,
                    cursor: logoUrl.trim() && !readOnly ? "pointer" : "default",
                    background: "#fff",
                  }
                : undefined
            }
            className={
              !classic
                ? cn(
                    "shrink-0 w-10 h-10 rounded-full overflow-hidden border border-nf-border-2",
                    !readOnly && logoUrl.trim() && "hover:border-nf-accent cursor-pointer transition-colors"
                  )
                : undefined
            }
          >
            {logoUrl.trim() ? (
              <MediaCoverImage src={logoUrl} position={logoPosition} className="w-full h-full rounded-full" />
            ) : classic ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", fontSize: 9, color: "#888" }}>n/</span>
            ) : (
              <span className="w-full h-full flex items-center justify-center text-[9px] text-nf-dim font-bold">n/</span>
            )}
          </button>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => onLogoUrlChange(e.target.value)}
            placeholder="https://example.com/logo.png"
            readOnly={readOnly}
            style={classic ? { ...CLASSIC_INPUT, flex: 1, minWidth: 0 } : undefined}
            className={!classic ? cn(APP_INPUT, "flex-1 min-w-0") : undefined}
          />
        </div>
        {!readOnly && logoUrl.trim() && (
          <CustomizeLink classic={classic} onClick={openLogo} label="تخصيص الشعار" />
        )}
      </div>

      <div>
        <FieldLabel
          classic={classic}
          title="رابط البانر"
          hint="صورة عريضة في اعلى صفحة المجتمع"
        />
        <input
          type="url"
          value={bannerUrl}
          onChange={(e) => onBannerUrlChange(e.target.value)}
          placeholder="https://example.com/banner.jpg"
          readOnly={readOnly}
          style={classic ? CLASSIC_INPUT : undefined}
          className={!classic ? APP_INPUT : undefined}
        />
        {bannerUrl.trim() && (
          <>
            <button
              type="button"
              disabled={readOnly}
              onClick={openBanner}
              style={
                classic
                  ? {
                      marginTop: 6,
                      width: "100%",
                      height: 48,
                      borderRadius: 3,
                      overflow: "hidden",
                      border: "1px solid #c8c8c8",
                      padding: 0,
                      cursor: readOnly ? "default" : "pointer",
                      display: "block",
                      background: "#fff",
                    }
                  : undefined
              }
              className={
                !classic
                  ? cn(
                      "mt-2 w-full rounded-xl overflow-hidden border border-nf-border-2 block",
                      !readOnly && "cursor-pointer hover:border-nf-accent transition-colors"
                    )
                  : undefined
              }
            >
              <MediaCoverImage
                src={bannerUrl}
                position={bannerPosition}
                className={classic ? "w-full h-full" : "w-full h-[80px] sm:h-[88px]"}
              />
            </button>
            {!readOnly && (
              <CustomizeLink classic={classic} onClick={openBanner} label="تخصيص البانر" />
            )}
          </>
        )}
      </div>

      {!readOnly && modal === "logo" && logoUrl.trim() && (
        <MediaPositionModal
          open
          variant="avatar"
          imageUrl={logoUrl}
          position={logoPosition}
          theme={classic ? "classic" : "app"}
          onClose={() => setModal(null)}
          onSave={onLogoPositionChange}
        />
      )}

      {!readOnly && modal === "banner" && bannerUrl.trim() && (
        <MediaPositionModal
          open
          variant="banner"
          imageUrl={bannerUrl}
          position={bannerPosition}
          theme={classic ? "classic" : "app"}
          onClose={() => setModal(null)}
          onSave={onBannerPositionChange}
        />
      )}
    </div>
  );
}

export function BannerAppearanceField({
  bannerUrl,
  bannerPosition,
  onBannerUrlChange,
  onBannerPositionChange,
  label = "رابط البانر",
  hint = "صورة عريضة في أعلى الصفحة",
}: {
  bannerUrl: string;
  bannerPosition: MediaPosition;
  onBannerUrlChange: (v: string) => void;
  onBannerPositionChange: (v: MediaPosition) => void;
  label?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <FieldLabel title={label} hint={hint} />
      <input
        type="url"
        value={bannerUrl}
        onChange={(e) => onBannerUrlChange(e.target.value)}
        placeholder="https://example.com/banner.jpg"
        className={APP_INPUT}
      />
      {bannerUrl.trim() && (
        <>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="mt-2 w-full rounded-xl overflow-hidden border border-nf-border-2 cursor-pointer hover:border-nf-accent transition-colors"
          >
            <MediaCoverImage src={bannerUrl} position={bannerPosition} className="w-full h-[80px]" />
          </button>
          <CustomizeLink onClick={() => setOpen(true)} label="تخصيص البانر" />
        </>
      )}
      {open && bannerUrl.trim() && (
        <MediaPositionModal
          open
          variant="banner"
          imageUrl={bannerUrl}
          position={bannerPosition}
          onClose={() => setOpen(false)}
          onSave={onBannerPositionChange}
        />
      )}
    </div>
  );
}
