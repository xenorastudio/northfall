"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams } from "next/navigation";

interface PostData {
  title: string;
  body?: string;
  authorName: string;
  authorPhoto?: string;
  community: string;
  votes: number;
  commentCount?: number;
  imageUrl?: string;
  linkUrl?: string;
  createdAt: string;
}

const communityImages: Record<string, string> = {
  Unity: "/assets/images/unitylogo.png",
  Unreal: "/assets/images/unreallogo.svg",
  Godot: "/assets/images/godotlogo.png",
  Blender: "/assets/images/logoblender.png",
};

function getTimeAgo(timestamp: string) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 604800) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return `منذ ${Math.floor(diff / 604800)} أسبوع`;
}

function extractDomain(url: string) {
  try { return new URL(url).hostname.replace("www.", ""); }
  catch { return url; }
}

export default function EmbedPage() {
  const params = useParams();
  const postId = params.postId as string;
  const [post, setPost] = useState<PostData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!postId) { setError("لم يتم تحديد المنشور"); return; }
    async function fetchPost() {
      try {
        const snap = await getDoc(doc(db, "threads", postId));
        if (!snap.exists()) { setError("المنشور غير موجود"); return; }
        setPost(snap.data() as PostData);
      } catch {
        setError("خطأ في تحميل المنشور");
      }
    }
    fetchPost();
  }, [postId]);

  useEffect(() => {
    if (post) {
      setTimeout(() => {
        const height = document.body.scrollHeight;
        window.parent.postMessage({ type: "nf-embed-resize", height, postId }, "*");
      }, 500);
    }
  }, [post, postId]);

  if (error) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#999", fontSize: "14px" }}>
        {error}
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: "#666", fontSize: "13px" }}>
        جاري التحميل...
      </div>
    );
  }

  const siteUrl = typeof window !== "undefined" ? window.location.origin : "";
  const postUrl = `${siteUrl}?post=${postId}`;
  const commImg = communityImages[post.community] || "";

  return (
    <div style={{ background: "#181818", color: "#e0e0e0", fontFamily: "Cairo, sans-serif", direction: "rtl" }}>
      <style>{`
        .nf-embed-post { border: 1px solid #3a3a3a; border-radius: 8px; overflow: hidden; transition: background 0.15s, border-color 0.15s; }
        .nf-embed-post:hover { background: rgba(124,124,124,0.05); border-color: rgba(124,124,124,0.15); }
        .nf-embed-content { padding: 16px; }
        .nf-embed-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; }
        .nf-embed-avatar { width: 20px; height: 20px; border-radius: 50%; background: #2a2a2a; overflow: hidden; flex-shrink: 0; display: flex; align-items: center; justify-content: center; color: #999; font-size: 9px; font-weight: 700; }
        .nf-embed-avatar img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }
        .nf-embed-community { font-weight: 600; font-size: 13px; color: #7c7c7c; cursor: pointer; text-decoration: none; }
        .nf-embed-community:hover { text-decoration: underline; }
        .nf-embed-dot { color: #666; font-size: 13px; }
        .nf-embed-author { font-size: 13px; color: #999; text-decoration: none; }
        .nf-embed-author:hover { color: #fff; text-decoration: underline; }
        .nf-embed-time { font-size: 13px; color: #999; }
        .nf-embed-title { font-size: 18px; font-weight: 700; color: #fff; line-height: 1.4; margin-bottom: 4px; cursor: pointer; text-decoration: none; display: block; }
        .nf-embed-title:hover { color: #fff; }
        .nf-embed-body { font-size: 14px; color: #bbb; line-height: 1.7; margin-bottom: 8px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .nf-embed-image { margin: 8px -16px 0; overflow: hidden; }
        .nf-embed-image img { width: 100%; height: auto; display: block; max-height: 600px; object-fit: cover; }
        .nf-embed-link { margin: 8px 0 4px; border: 1px solid #333; border-radius: 6px; overflow: hidden; background: #181818; text-decoration: none; display: block; }
        .nf-embed-link-info { padding: 10px 14px; }
        .nf-embed-link-url { font-size: 11px; color: #666; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .nf-embed-link-title { font-size: 13px; font-weight: 600; color: #e0e0e0; line-height: 1.4; margin-bottom: 2px; }
        .nf-embed-link-desc { font-size: 12px; color: #666; line-height: 1.5; }
        .nf-embed-footer { display: flex; align-items: center; gap: 2px; padding: 6px 16px 10px; flex-wrap: wrap; }
        .nf-embed-votes { display: flex; align-items: center; background: #2a2a2a; border-radius: 6px; margin-left: 8px; }
        .nf-embed-vote-btn { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: none; background: transparent; border-radius: 6px; cursor: pointer; color: #999; transition: color 0.15s; }
        .nf-embed-vote-btn:hover { color: #fff; }
        .nf-embed-vote-count { font-size: 13px; font-weight: 700; color: #e0e0e0; padding: 0 2px; min-width: 24px; text-align: center; }
        .nf-embed-action { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 6px; border: none; background: transparent; color: #999; font-family: Cairo, sans-serif; font-size: 12px; font-weight: 600; cursor: pointer; transition: background 0.15s, color 0.15s; }
        .nf-embed-action:hover { background: #2a2a2a; color: #fff; }
        .nf-embed-brand { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 14px; border-top: 1px solid #333; font-size: 11px; color: #666; text-decoration: none; }
        .nf-embed-brand:hover { color: #999; }
      `}</style>

      <div className="nf-embed-post">
        <div className="nf-embed-content">
          <div className="nf-embed-header">
            <div className="nf-embed-avatar">
              {commImg ? <img src={commImg} alt="" /> : "n/"}
            </div>
            <a className="nf-embed-community" href={postUrl} target="_blank" rel="noopener noreferrer">n/{post.community}</a>
            <span className="nf-embed-dot">·</span>
            <a className="nf-embed-author" href={postUrl} target="_blank" rel="noopener noreferrer">u/{post.authorName}</a>
            <span className="nf-embed-dot">·</span>
            <span className="nf-embed-time">{getTimeAgo(post.createdAt)}</span>
          </div>
          <a className="nf-embed-title" href={postUrl} target="_blank" rel="noopener noreferrer">{post.title}</a>
          {post.body && <p className="nf-embed-body">{post.body}</p>}
          {post.imageUrl && <div className="nf-embed-image"><img src={post.imageUrl} alt="" /></div>}
          {post.linkUrl && (
            <a href={post.linkUrl} target="_blank" rel="noopener noreferrer" className="nf-embed-link">
              <div className="nf-embed-link-info">
                <div className="nf-embed-link-url">{post.linkUrl}</div>
                <div className="nf-embed-link-title">{extractDomain(post.linkUrl)}</div>
                <div className="nf-embed-link-desc">اضغط لفتح الرابط</div>
              </div>
            </a>
          )}
        </div>
        <div className="nf-embed-footer">
          <div className="nf-embed-votes">
            <a className="nf-embed-vote-btn" href={postUrl} target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 5-7 7h4v7h6v-7h4z"/></svg>
            </a>
            <span className="nf-embed-vote-count">{post.votes || 0}</span>
            <a className="nf-embed-vote-btn" href={postUrl} target="_blank" rel="noopener noreferrer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 19 7-7h-4V5H9v7H5z"/></svg>
            </a>
          </div>
          <a className="nf-embed-action" href={postUrl} target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>{post.commentCount || 0} تعليق</span>
          </a>
          <a className="nf-embed-action" href={postUrl} target="_blank" rel="noopener noreferrer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            <span>مشاركة</span>
          </a>
        </div>
      </div>
      <a className="nf-embed-brand" href={siteUrl || "/"} target="_blank" rel="noopener noreferrer">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
        NorthFall
      </a>
    </div>
  );
}
