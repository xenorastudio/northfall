"use client";

import { User, Image, Link } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { useI18n } from "./I18nProvider";

export default function PostComposer({ onFocus }: { onFocus?: () => void; onPost?: () => void }) {
  const { user } = useAuth();
  const { t } = useI18n();

  return (
    <div className="mb-2 rounded-lg border border-nf-border-2/55 px-3 py-3">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-nf-secondary flex items-center justify-center shrink-0">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={14} className="text-nf-muted" />
          )}
        </div>
        <input
          type="text"
          placeholder={t("pc.createPlaceholder")}
          onFocus={(e) => { e.target.blur(); onFocus?.(); }}
          className="flex-1 !bg-transparent border-none outline-none text-sm text-nf-text placeholder:text-nf-dim cursor-pointer"
          readOnly
        />
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => onFocus?.()} className="p-2 rounded-lg text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"><Image size={18} /></button>
          <button type="button" onClick={() => onFocus?.()} className="p-2 rounded-lg text-nf-muted hover:bg-nf-hover hover:text-nf-text transition-colors"><Link size={18} /></button>
        </div>
      </div>
    </div>
  );
}
