"use client";

import React from "react";

/**
 * Renders markdown-formatted comment text with:
 * - **bold**
 * - *italic*
 * - [links](url) in blue
 * - `code` inline
 * - - bullet lists
 */
export function renderCommentText(text: string): React.ReactNode {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if it's a bullet point (support both "-" and "*")
    if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
      const content = line.trim().slice(2);
      elements.push(
        <div key={key++} className="flex gap-2.5 my-1.5 items-start">
          <span className="text-nf-accent font-black select-none mt-1 text-[13px]">•</span>
          <span className="flex-1">{parseInlineFormatting(content, key)}</span>
        </div>
      );
    }
    // Check if it's a numbered list
    else if (line.trim().match(/^\d+\.\s/)) {
      const match = line.trim().match(/^(\d+)\.\s(.+)$/);
      if (match) {
        const number = match[1];
        const content = match[2];
        elements.push(
          <div key={key++} className="flex gap-2.5 my-1.5 items-start">
            <span className="text-nf-accent font-black select-none text-right font-sans" style={{ minWidth: 18 }}>{number}.</span>
            <span className="flex-1">{parseInlineFormatting(content, key)}</span>
          </div>
        );
      }
    }
    else if (line.trim()) {
      elements.push(
        <div key={key++} className="my-1">
          {parseInlineFormatting(line, key)}
        </div>
      );
    } else {
      elements.push(<br key={key++} />);
    }
  }

  return <>{elements}</>;
}

function parseInlineFormatting(text: string, baseKey: number): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = baseKey * 1000;

  // Regex patterns
  const patterns = [
    { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: "link" },      // [text](url)
    { regex: /\*\*([^*]+)\*\*/g, type: "bold" },              // **bold**
    { regex: /\*([^*]+)\*/g, type: "italic" },                // *italic*
    { regex: /`([^`]+)`/g, type: "code" },                    // `code`
  ];

  // Find all matches
  const matches: Array<{ index: number; length: number; type: string; content: string; url?: string }> = [];

  patterns.forEach(({ regex, type }) => {
    let match;
    const r = new RegExp(regex.source, regex.flags);
    while ((match = r.exec(text)) !== null) {
      if (type === "link") {
        matches.push({
          index: match.index,
          length: match[0].length,
          type,
          content: match[1],
          url: match[2],
        });
      } else {
        matches.push({
          index: match.index,
          length: match[0].length,
          type,
          content: match[1],
        });
      }
    }
  });

  // Sort by index
  matches.sort((a, b) => a.index - b.index);

  // Build output
  let lastIndex = 0;
  matches.forEach((match) => {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(<span key={key++}>{text.slice(lastIndex, match.index)}</span>);
    }

    // Add formatted match
    switch (match.type) {
      case "link":
        parts.push(
          <a
            key={key++}
            href={match.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            {match.content}
          </a>
        );
        break;
      case "bold":
        parts.push(<strong key={key++}>{match.content}</strong>);
        break;
      case "italic":
        parts.push(<em key={key++}>{match.content}</em>);
        break;
      case "code":
        parts.push(
          <code
            key={key++}
            className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-nf-secondary border border-nf-border-2"
          >
            {match.content}
          </code>
        );
        break;
    }

    lastIndex = match.index + match.length;
  });

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(<span key={key++}>{text.slice(lastIndex)}</span>);
  }

  return <>{parts}</>;
}

export default function CommentFormatter({ text }: { text: string }) {
  return <div className="text-[13px] text-nf-text leading-relaxed">{renderCommentText(text)}</div>;
}
