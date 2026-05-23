"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, limit, getDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Flame, TrendingUp, Bookmark, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { useI18n } from "./I18nProvider";
import { useData } from "./DataProvider";



export default function SidebarRight({ onCommunityClick, onPostClick, communityName }: { onCommunityClick: (name: string) => void; onPostClick: (id: string) => void; communityName?: string }) {
  const { t, lang } = useI18n();
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [creatorPhoto, setCreatorPhoto] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [dbMeta, setDbMeta] = useState<any>(null);
  const { communities: allComms } = useData();
  const [expandedRuleIndex, setExpandedRuleIndex] = useState<number | null>(null);
  const displayComms = allComms.map(c => ({ name: c.label, img: c.img, desc: "" }));

  useEffect(() => {
    setExpandedRuleIndex(null);
    if (!communityName) {
      setDbMeta(null);
      return;
    }
    const cName = communityName;
    async function fetchMeta() {
      try {
        const docRef = doc(db, "communities", cName);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setDbMeta(snap.data());
        } else {
          setDbMeta(null);
        }
      } catch (e) {
        console.error("Error fetching community sidebar meta:", e);
        setDbMeta(null);
      }
    }
    fetchMeta();
  }, [communityName]);

  const meta = dbMeta;

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(5));
    const unsub = onSnapshot(q, (snap) => {
      setRecentPosts(snap.docs.map((d: any) => ({ id: d.id, ...d.data() })));
    }, () => {});
    return () => unsub();
  }, []);

  useEffect(() => {
    const creatorId = meta?.creatorUid || meta?.creator;
    if (!creatorId) { setCreatorPhoto(""); setCreatorName(""); return; }
    async function fetchCreator() {
      try {
        const s = await getDoc(doc(db, "users", creatorId));
        if (s.exists()) { 
          setCreatorPhoto(s.data().photoURL || ""); 
          setCreatorName(s.data().displayName || t("sr.communityCreator")); 
        } else {
          setCreatorPhoto("");
          setCreatorName(meta.creatorName || t("sr.communityCreator"));
        }
      } catch {
        setCreatorPhoto("");
        setCreatorName(meta.creatorName || t("sr.communityCreator"));
      }
    }
    fetchCreator();
  }, [meta?.creator, meta?.creatorUid, t]);

  return (
    <aside className="w-[280px] shrink-0 sticky overflow-y-auto" style={{ top: "calc(var(--nav-total-height) + 16px)", maxHeight: "calc(100vh - var(--nav-total-height) - 32px)" }}>
      {/* Recent Posts */}
      <div className="bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden mb-3">
        <div className="flex items-center gap-1.5 px-3.5 py-3 pb-2 border-b border-nf-border-2">
          <Flame size={12} className="text-nf-accent" />
          <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.newPosts")}</span>
        </div>
        {recentPosts.length === 0 ? (
          <div className="p-3 text-center text-xs text-nf-dim">{t("sr.noPosts")}</div>
        ) : (
          <div className="py-1">
            {recentPosts.map((post: any, i: number) => (
              <motion.a
                key={post.id}
                href="#"
                onClick={(e) => { e.preventDefault(); onPostClick(post.id); }}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-2.5 px-3.5 py-2 hover:bg-nf-hover transition-colors duration-150 cursor-pointer"
              >
                {post.imageUrl ? (
                  <img src={post.imageUrl} alt="" className="w-10 h-10 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-nf-secondary flex items-center justify-center shrink-0">
                    <Flame size={14} className="text-nf-dim" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-nf-text truncate leading-snug">{post.title}</p>
                  <span className="text-[10px] text-nf-dim">n/{post.community || t("gen.general")} · {post.authorName || t("gen.user")}</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-nf-dim">{post.votes || 0} {t("sr.upvote")}</span>
                    <span className="text-[10px] text-nf-dim">{post.commentCount || 0} {t("sr.comment")}</span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </div>

      {/* Community info cards - only when viewing a community */}
      {meta ? (
        <>
          {/* About */}
          <div className="bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden mb-3">
            <div className="px-3.5 py-2.5 border-b border-nf-border-2 flex items-center gap-2">
              <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.aboutCommunity")}</span>
              <span className="text-xs font-bold text-nf-accent">{t("sr.communityLabel")} n/{communityName}</span>
            </div>
            <div className="px-3.5 py-2.5">
              <p className="text-xs text-nf-muted leading-relaxed whitespace-pre-line">{meta.desc}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px] text-nf-dim">
                <span>{t("sr.foundedIn")}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          {meta.stats?.length > 0 && (
            <div className="bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden mb-3">
              <div className="px-3.5 py-2.5 border-b border-nf-border-2">
                <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.stats")}</span>
              </div>
              <div className="px-3.5 py-2 space-y-1.5">
                {meta.stats.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between text-[11px]">
                    <span className="text-nf-dim">{s.label}</span>
                    <span className="text-nf-text font-bold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rules */}
          {meta.rules.length > 0 && (
            <div className="bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden mb-3">
              <div className="px-3.5 py-2.5 border-b border-nf-border-2 flex items-center justify-between">
                <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.rules")}</span>
                <span className="text-[9px] text-nf-dim bg-nf-secondary/40 px-1.5 py-0.5 rounded">قواعد تفصيلية</span>
              </div>
              <div className="px-3.5 py-2">
                <div className="flex flex-col gap-1">
                  {meta.rules.map((rule: string, i: number) => {
                    const [title, detail] = rule.includes(" || ") ? rule.split(" || ") : [rule, ""];
                    const isExpanded = expandedRuleIndex === i;
                    return (
                      <div key={i} className="border-b border-white/5 last:border-b-0 py-2">
                        <button 
                          onClick={() => detail && setExpandedRuleIndex(isExpanded ? null : i)}
                          className={`w-full flex items-start gap-2 text-right transition-all outline-none ${
                            detail ? "cursor-pointer text-nf-text hover:text-nf-accent" : "cursor-default text-nf-muted"
                          }`}
                        >
                          <span className="text-nf-dim font-bold shrink-0 text-xs">{i + 1}.</span>
                          <span className="flex-1 font-bold text-xs leading-relaxed">{title}</span>
                          {detail && (
                            <span className="text-nf-dim text-[10px] self-center shrink-0">
                              {isExpanded ? "▲" : "▼"}
                            </span>
                          )}
                        </button>
                        {detail && isExpanded && (
                          <div className="text-[11px] text-nf-dim mt-1.5 mr-4 leading-relaxed whitespace-pre-wrap animate-in fade-in slide-in-from-top-1 duration-200">
                            {detail}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Moderators */}
          <div className="bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden mb-3">
            <div className="px-3.5 py-2.5 border-b border-nf-border-2">
              <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.mods")}</span>
            </div>
            <div className="px-3.5 py-2.5 flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {creatorPhoto ? (
                  <img src={creatorPhoto} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-nf-secondary flex items-center justify-center text-[9px] text-nf-accent font-bold">C</div>
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-nf-text truncate">u/{creatorName || t("sr.creator")}</div>
                  <span className="text-[9px] text-nf-accent bg-nf-accent/10 px-2 py-0.5 rounded font-bold">{t("sr.creator")}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags */}
          {meta.tags.length > 0 && (
            <div className="bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden mb-3">
              <div className="px-3.5 py-2.5 border-b border-nf-border-2">
                <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.tags")}</span>
              </div>
              <div className="px-3 py-2 flex flex-wrap gap-1">
                {meta.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-nf-accent/10 text-[10px] font-medium text-nf-accent hover:bg-nf-accent/20 transition-colors cursor-pointer">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Community Bookmarks - after tags */}
          {meta.bookmarks && meta.bookmarks.length > 0 && (
            <div className="bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden mb-3">
              <div className="px-3.5 py-2.5 border-b border-nf-border-2 flex items-center gap-1.5">
                <Bookmark size={11} className="text-nf-accent" />
                <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">Community Bookmarks</span>
              </div>
              <div className="py-0.5">
                {meta.bookmarks.map((bm: any, i: number) => (
                  <a key={i} href={bm.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-1.5 hover:bg-nf-hover transition-colors group">
                    <ExternalLink size={11} className="shrink-0 text-nf-dim group-hover:text-nf-accent transition-colors" />
                    <span className="text-[11px] text-nf-muted group-hover:text-nf-text truncate flex-1">{bm.label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Trending Communities */}
          <div className="bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden mb-3">
            <div className="flex items-center gap-1.5 px-3.5 py-3 pb-2 border-b border-nf-border-2">
              <TrendingUp size={12} className="text-nf-accent" />
              <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.displayComms")}</span>
            </div>
            <div className="py-1">
              {displayComms.map((c, i) => (
                <motion.button
                  key={c.name}
                  onClick={() => onCommunityClick(c.name.replace("n/", ""))}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 w-full px-3.5 py-2 hover:bg-nf-hover transition-colors text-right"
                >
                  <img src={c.img} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-nf-border-2" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-nf-text truncate">{c.name}</p>
                    <p className="text-[9px] text-nf-dim truncate">{c.desc}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Site Rules */}
          <div className="bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden mb-3">
            <div className="px-3.5 py-2.5 border-b border-nf-border-2">
              <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.siteRules")}</span>
            </div>
            <div className="px-3.5 py-2.5 space-y-1.5">
              {[
                t("sr.rule1"),
                t("sr.rule2"),
                t("sr.rule3"),
                t("sr.rule4"),
              ].map((rule: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-nf-muted">
                  <span className="w-4 h-4 rounded-full bg-nf-secondary flex items-center justify-center text-[9px] font-bold text-nf-dim shrink-0 mt-0.5">{i + 1}</span>
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Communities */}
      <div className="bg-nf-primary border border-nf-border-2 rounded-lg overflow-hidden mb-3">
        <div className="flex items-center gap-1.5 px-3.5 py-3 pb-2 border-b border-nf-border-2">
          <TrendingUp size={12} className="text-nf-accent" />
          <span className="text-[11px] font-bold text-nf-muted uppercase tracking-wide">{t("sr.trending")}</span>
        </div>
        <div className="py-1">
          {displayComms.map((c) => (
            <a
              key={c.name}
              href="#"
              onClick={(e) => { e.preventDefault(); onCommunityClick(c.name.replace("n/", "")); }}
              className="flex items-center gap-2.5 px-4 py-[7px] rounded-lg hover:bg-nf-hover transition-colors duration-150"
            >
              <img src={c.img} alt="" className="w-7 h-7 rounded-full" />
              <div className="flex flex-col flex-1 min-w-0">
                <span className="text-sm font-bold text-nf-text truncate">{c.name}</span>
                <span className="text-[11px] text-nf-dim truncate">{c.desc}</span>
              </div>
              <button className="px-3.5 py-1 border border-nf-border rounded-full text-[11px] font-bold text-nf-muted hover:bg-nf-hover transition-colors duration-150">
                {t("sr.join")}
              </button>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center px-4 py-2">
        <div className="flex items-center justify-center gap-1 text-[11px] text-nf-muted flex-wrap">
          <a href="#" className="hover:text-nf-text">{t("sr.privacy")}</a>
          <span className="text-nf-dim">·</span>
          <a href="#" className="hover:text-nf-text">{t("sr.terms")}</a>
          <span className="text-nf-dim">·</span>
          <a href="#" className="hover:text-nf-text">{t("sr.help")}</a>
        </div>
        <p className="text-[11px] text-nf-dim mt-1">© 2026 NorthFall. {t("gen.allRightsReserved")}</p>
      </div>
    </aside>
  );
}
