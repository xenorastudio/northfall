"use client";

import { Key, Check, AlertCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { plainAr } from "@/lib/arabic-text";
import ComposeSelect from "./ComposeSelect";
import TranslateLangPicker from "./TranslateLangPicker";

export type AiModelOption = {
  name: string;
  provider: string;
  model: string;
  free?: boolean;
  desc: string;
};

type Props = {
  aiModel: number;
  setAiModel: (n: number) => void;
  setAiProvider: (p: string) => void;
  aiModels: AiModelOption[];
  aiApiKey: string;
  setAiApiKey: (k: string) => void;
  aiConnected: "unknown" | "testing" | "ok" | "fail";
  onTest: () => void;
  onDeleteKey?: () => void;
};

function SettingRow({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] text-nf-muted font-medium">{plainAr(label)}</p>
        {sub && <p className="text-[10px] text-nf-dim/80 mt-0.5">{plainAr(sub)}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export default function AiSettingsPanel({
  aiModel,
  setAiModel,
  setAiProvider,
  aiModels,
  aiApiKey,
  setAiApiKey,
  aiConnected,
  onTest,
  onDeleteKey,
}: Props) {
  const current = aiModels[aiModel];

  return (
    <div className="px-4 py-4">
      <p className="text-[13px] font-semibold text-nf-text mb-3">الذكاء الاصطناعي</p>

      <SettingRow label="النموذج" sub={current?.desc || "اختر النموذج للتلخيص والترجمة وأدوات المنشور"}>
        <ComposeSelect
          value={String(aiModel)}
          onChange={(v) => {
            const idx = parseInt(v, 10);
            setAiModel(idx);
            if (aiModels[idx]) setAiProvider(aiModels[idx].provider);
          }}
          options={aiModels.map((m, i) => ({
            value: String(i),
            label: `${m.name}${m.free ? " · مجاني" : ""}`,
          }))}
          className="min-w-[140px]"
          size="sm"
        />
      </SettingRow>

      <SettingRow label="مفتاح API" sub="يحفظ في متصفحك فقط. من موقع المزود">
        <div className="relative w-[160px]">
          <input
            type="password"
            value={aiApiKey}
            onChange={(e) => setAiApiKey(e.target.value)}
            placeholder="sk-..."
            className="w-full bg-transparent border border-nf-border-2 rounded-lg px-3 py-1.5 ps-7 text-[10px] text-nf-text placeholder:text-nf-dim/40 outline-none focus:border-nf-accent/40 font-mono"
            dir="ltr"
          />
          <Key size={10} className="absolute start-2 top-1/2 -translate-y-1/2 text-nf-dim/40 pointer-events-none" />
        </div>
      </SettingRow>

      {aiApiKey && (
        <div className="flex items-center justify-between py-2 gap-3">
          <p className="text-[10px] text-nf-dim/80">تحقق من اتصال المفتاح</p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onTest}
              disabled={aiConnected === "testing"}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                aiConnected === "ok"
                  ? "text-emerald-400"
                  : aiConnected === "fail"
                    ? "text-red-400"
                    : "text-nf-muted hover:text-nf-text"
              )}
            >
              {aiConnected === "testing" ? (
                "..."
              ) : aiConnected === "ok" ? (
                <>
                  <Check size={10} /> متصل
                </>
              ) : aiConnected === "fail" ? (
                <>
                  <AlertCircle size={10} /> فشل
                </>
              ) : (
                <>
                  <Zap size={10} /> اختبار
                </>
              )}
            </button>
            {onDeleteKey && (
              <button type="button" onClick={onDeleteKey} className="text-[10px] text-red-400/70 hover:text-red-400">
                حذف
              </button>
            )}
          </div>
        </div>
      )}

      <SettingRow label="لغة ترجمة AI" sub="اللغة الافتراضية لترجمة المحتوى">
        <div className="w-[148px]">
          <TranslateLangPicker fullWidth variant="settings" storageKey="nf-ai-translate-lang" />
        </div>
      </SettingRow>

      <SettingRow label="ترجمة التعليقات" sub="لغة عرض التعليقات المترجمة">
        <div className="w-[148px]">
          <TranslateLangPicker fullWidth variant="settings" storageKey="nf-translate-lang" />
        </div>
      </SettingRow>

      <p className="text-[10px] text-nf-dim/70 mt-2 leading-relaxed">
        اضغط «حفظ التغييرات» أعلى الصفحة لحفظ مفتاح API والنموذج.
      </p>
    </div>
  );
}
