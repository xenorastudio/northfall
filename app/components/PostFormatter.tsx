"use client";

import React from "react";

// VS Code Dark+ theme colors
const C = {
  kw: "#c586c0",
  kw2: "#569cd6",
  fn: "#dcdcaa",
  num: "#b5cea8",
  str: "#ce9178",
  cm: "#6a9955",
  prop: "#9cdcfe",
  val: "#ce9178",
  tag: "#569cd6",
  attr: "#9cdcfe",
  sel: "#d7ba7d",
  hex: "#d7ba7d",
  type: "#4ec9b0",
  op: "#d4d4d4",
  var_: "#9cdcfe",
  bool: "#569cd6",
  key: "#569cd6",
};

function highlightCode(code: string, lang: string): string {
  const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  type Seg = { t: string; v: string };
  const segs: Seg[] = [];
  const re = /\/\*[\s\S]*?\*\/|\/\/.*$|(["'`])(?:(?!\1)[^\\]|\\.)*\1/gm;
  let li = 0, m: RegExpExecArray | null;
  while ((m = re.exec(esc)) !== null) {
    if (m.index > li) segs.push({ t: "c", v: esc.slice(li, m.index) });
    segs.push({ t: m[0].startsWith("/*") || m[0].startsWith("//") ? "cm" : "s", v: m[0] });
    li = m.index + m[0].length;
  }
  if (li < esc.length) segs.push({ t: "c", v: esc.slice(li) });
  return segs.map(s => s.t === "cm" ? `<span style="color:${C.cm};font-style:italic">${s.v}</span>` : s.t === "s" ? `<span style="color:${C.str}">${s.v}</span>` : cz(s.v, lang)).join("");
}

function cz(s: string, lang: string): string {
  const l = lang.toLowerCase();
  const kw = (w: string, c = C.kw) => { s = s.replace(new RegExp(`\\b(${w})\\b`, "g"), `<span style="color:${c}">$1</span>`); };
  const nm = () => { s = s.replace(/\b(\d+\.?\d*)\b/g, `<span style="color:${C.num}">$1</span>`); };
  const fn = () => { s = s.replace(/(\w+)\s*\(/g, `<span style="color:${C.fn}">$1</span>(`); };
  const hx = () => { s = s.replace(/(#[0-9a-fA-F]{3,8})/g, `<span style="color:${C.hex}">$1</span>`); };
  const un = () => { s = s.replace(/(\d+)(px|em|rem|%|vh|vw|s|ms|deg|fr)/g, `<span style="color:${C.num}">$1$2</span>`); };
  const vr = () => { s = s.replace(/(\$[\w]+)/g, `<span style="color:${C.var_}">$1</span>`); };

  if (l === "css" || l === "scss" || l === "less" || l === "sass") {
    s = s.replace(/([\w\-]+)\s*:/g, `<span style="color:${C.prop}">$1</span>:`);
    s = s.replace(/:\s*([^;{}]+);/g, `: <span style="color:${C.val}">$1</span>;`);
    hx(); un(); nm();
  } else if (["js","ts","javascript","typescript","jsx","tsx"].includes(l)) {
    kw("const|let|var|function|return|if|else|for|while|do|switch|case|break|default|try|catch|throw|finally|yield|of|in|void|delete|super|static|new|typeof|instanceof", C.kw);
    kw("class|import|export|from|as|extends|implements|interface|type|enum|declare|readonly|abstract|async|await|require", C.kw2);
    kw("true|false|null|undefined|NaN|Infinity|this", C.bool); nm(); fn();
  } else if (["python","py"].includes(l)) {
    kw("def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|in|is|global|nonlocal|async|await|del|assert", C.kw);
    kw("True|False|None|self|print", C.kw2); nm(); fn();
  } else if (["html","xml","svg","vue"].includes(l)) {
    s = s.replace(/(&lt;\/?[\w]+)/g, `<span style="color:${C.tag}">$1</span>`);
    s = s.replace(/(\/?&gt;)/g, `<span style="color:${C.tag}">$1</span>`);
    s = s.replace(/([\w\-]+)=/g, `<span style="color:${C.attr}">$1</span>=`);
  } else if (["cpp","c","h"].includes(l)) {
    kw("return|if|else|for|while|do|switch|case|break|default|try|catch|throw|new|delete|this|typedef|template|typename|sizeof|constexpr|noexcept|override|virtual", C.kw);
    kw("int|float|double|char|bool|void|long|short|unsigned|signed|const|static|class|struct|enum|namespace|using|public|private|protected|auto|nullptr|true|false", C.kw2); nm(); fn();
  } else if (["java","kotlin","kt"].includes(l)) {
    kw("return|if|else|for|while|do|switch|case|break|default|try|catch|throw|throws|finally|new|instanceof", C.kw);
    kw("public|private|protected|static|final|abstract|class|interface|extends|implements|import|package|this|super|synchronized|val|var|fun|when|object|companion|data|suspend", C.kw2);
    kw("void|int|long|float|double|boolean|char|null|true|false", C.type); nm(); fn();
  } else if (["csharp","cs"].includes(l)) {
    kw("return|if|else|for|while|do|switch|case|break|default|try|catch|throw|finally|new|yield|async|await", C.kw);
    kw("using|namespace|class|struct|interface|enum|public|private|protected|internal|static|readonly|const|virtual|override|abstract|sealed|this|base|ref|out|in", C.kw2);
    kw("void|int|long|float|double|bool|string|var|null|true|false", C.type); nm(); fn();
  } else if (["rust","rs"].includes(l)) {
    kw("return|if|else|for|while|loop|match|break|continue|as|in|ref|move|async|await|unsafe|where|type|dyn", C.kw);
    kw("fn|let|mut|const|static|struct|enum|impl|trait|pub|use|mod|crate|self|super|true|false|Some|None|Ok|Err|Self", C.kw2); nm(); fn();
  } else if (["go","golang"].includes(l)) {
    kw("return|if|else|for|range|switch|case|default|break|continue|go|select|defer|panic|recover", C.kw);
    kw("func|var|const|type|struct|interface|map|chan|package|import|true|false|nil|make|len|append|new", C.kw2); nm(); fn();
  } else if (["ruby","rb"].includes(l)) {
    kw("def|end|class|module|return|if|elsif|else|unless|for|while|until|do|begin|rescue|ensure|raise|require|include|self|super|yield|and|or|not|then|when|case|break|next", C.kw);
    kw("nil|true|false", C.bool); nm(); fn();
  } else if (["php"].includes(l)) {
    kw("return|if|else|elseif|for|while|do|switch|case|break|default|try|catch|throw|finally|new|use|yield|async|await", C.kw);
    kw("function|class|interface|trait|extends|implements|public|private|protected|static|abstract|final|namespace|require|include|echo|print|const|var|array", C.kw2);
    kw("null|true|false", C.bool); nm(); fn(); vr();
  } else if (["swift"].includes(l)) {
    kw("return|if|else|for|while|switch|case|break|default|guard|try|catch|throw|import|async|await|where|in", C.kw);
    kw("func|class|struct|enum|protocol|extension|var|let|static|override|public|private|internal|self|super|nil|true|false|as|is|some|any|typealias", C.kw2); nm(); fn();
  } else if (["sql","mysql","postgres","sqlite"].includes(l)) {
    kw("SELECT|FROM|WHERE|INSERT|INTO|UPDATE|SET|DELETE|CREATE|TABLE|ALTER|DROP|INDEX|JOIN|LEFT|RIGHT|INNER|OUTER|ON|AND|OR|NOT|IN|LIKE|BETWEEN|IS|NULL|AS|ORDER|BY|GROUP|HAVING|LIMIT|UNION|DISTINCT|COUNT|SUM|AVG|MIN|MAX|EXISTS|CASE|WHEN|THEN|ELSE|END|VALUES|PRIMARY|KEY|FOREIGN|IF|BEGIN|COMMIT|ROLLBACK", C.kw2);
    kw("INT|VARCHAR|TEXT|BOOLEAN|FLOAT|DOUBLE|DATE|TIMESTAMP|INTEGER|BIGINT|SERIAL", C.type); nm();
  } else if (["bash","sh","shell","zsh","fish"].includes(l)) {
    kw("if|then|else|elif|fi|for|while|until|do|done|case|esac|function|return|exit|in", C.kw);
    kw("echo|export|source|alias|cd|ls|rm|cp|mv|mkdir|chmod|grep|sed|awk|find|cat|sort|read|printf|local|declare|true|false", C.kw2); nm(); vr();
  } else if (["json","yaml","yml","toml"].includes(l)) {
    s = s.replace(/([\w\-]+)\s*:/g, `<span style="color:${C.prop}">$1</span>:`);
    kw("true|false|null|True|False|None", C.bool); nm();
  } else if (["gdscript","gd"].includes(l)) {
    kw("return|if|elif|else|for|while|break|continue|pass|match|yield|await", C.kw);
    kw("func|class|extends|var|const|onready|export|signal|enum|static|self|super|true|false|null|preload|load", C.kw2);
    kw("void|int|float|bool|String|Vector2|Vector3|Color|Array|Dictionary", C.type); nm(); fn();
  } else if (["lua"].includes(l)) {
    kw("return|if|then|else|elseif|end|for|while|do|repeat|until|break|in|not|and|or", C.kw);
    kw("function|local|self|require|print|pairs|ipairs|tostring|tonumber|type|nil|true|false", C.kw2); nm(); fn();
  } else if (["dart"].includes(l)) {
    kw("return|if|else|for|while|do|switch|case|break|default|try|catch|throw|finally|new|yield|async|await|is|in", C.kw);
    kw("class|abstract|interface|mixin|extends|implements|with|static|const|final|var|late|factory|this|super|import|export|override", C.kw2);
    kw("void|int|double|bool|String|List|Map|Set|dynamic|null|true|false", C.type); nm(); fn();
  } else {
    kw("return|if|else|for|while|do|switch|case|break|default|try|catch|throw|new|delete|typeof|instanceof|yield|async|await", C.kw);
    kw("const|let|var|function|class|import|export|from|as|extends|implements|interface|type|enum|static|this|super|def|print|self", C.kw2);
    kw("true|false|null|undefined|void|int|float|double|bool|string", C.type); nm(); fn();
  }
  return s;
}

function formatInline(text: string): string {
  let s = text;
  s = s.replace(/\*\*(.+?)\*\*/g, '<b style="color:#fff;font-weight:700">$1</b>');
  s = s.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i style="color:#d4d4d4">$1</i>');
  s = s.replace(/~~(.+?)~~/g, '<span style="text-decoration:line-through;color:#6a6d6f">$1</span>');
  s = s.replace(/`(.+?)`/g, '<code style="background:#222;padding:1px 5px;border-radius:4px;font-size:11px;color:#ce9178;font-family:monospace;border:1px solid #333">$1</code>');
  s = s.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" style="color:#569cd6;text-decoration:underline">$1</a>');
  s = s.replace(/@(\w+)/g, '<span style="color:#569cd6;font-weight:600;cursor:pointer">@$1</span>');
  return s;
}

export function renderFormattedBody(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeLines: string[] = [];
  let codeLang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        const highlighted = highlightCode(codeLines.join("\n"), codeLang);
        result.push(
          <div key={`code-${i}`} className="my-1.5 rounded-lg border border-nf-border-2 overflow-hidden">
            {codeLang && <div className="px-3 py-1 bg-nf-secondary/50 text-[9px] text-nf-dim font-mono border-b border-nf-border-2">{codeLang}</div>}
            <pre className="px-3 py-2 bg-[#1e1e1e] font-mono text-[11px] leading-relaxed overflow-x-auto" dangerouslySetInnerHTML={{ __html: highlighted }} />
          </div>
        );
        codeLines = [];
        codeLang = "";
      } else {
        inCodeBlock = true;
        codeLang = line.trimStart().replace(/```/, "").trim();
        codeLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    if (line.startsWith("    ") || line.startsWith("\t")) {
      const highlighted = highlightCode(line.trimStart(), "");
      result.push(<div key={i} className="bg-[#1e1e1e] rounded px-3 py-1 font-mono text-[11px] border-l-2 border-[#6a9955]/40 my-0.5" dangerouslySetInnerHTML={{ __html: highlighted }} />);
      continue;
    }

    if (line.startsWith("> ")) {
      const quoted = formatInline(line.slice(2));
      result.push(<blockquote key={i} className="border-r-2 border-nf-accent/40 pr-3 my-1 text-[12px] text-nf-muted italic" dangerouslySetInnerHTML={{ __html: quoted }} />);
      continue;
    }

    if (line.startsWith("# ")) {
      const heading = formatInline(line.slice(2));
      result.push(<h2 key={i} className="text-[15px] font-bold text-white mt-2 mb-1" dangerouslySetInnerHTML={{ __html: heading }} />);
      continue;
    }

    if (line.match(/^[-*]\s/)) {
      const item = formatInline(line.replace(/^[-*]\s/, ""));
      result.push(<div key={i} className="flex items-start gap-2 my-0.5"><span className="text-nf-accent mt-0.5">•</span><span className="text-[12px] text-nf-muted flex-1" dangerouslySetInnerHTML={{ __html: item }} /></div>);
      continue;
    }

    // Numbered list
    if (line.match(/^\d+\.\s/)) {
      const num = line.match(/^(\d+)\./)?.[1] || "1";
      const item = formatInline(line.replace(/^\d+\.\s/, ""));
      result.push(<div key={i} className="flex items-start gap-2 my-0.5"><span className="text-nf-accent font-bold text-[11px] mt-0.5 min-w-[14px] text-left">{num}.</span><span className="text-[12px] text-nf-muted flex-1" dangerouslySetInnerHTML={{ __html: item }} /></div>);
      continue;
    }

    // Horizontal rule
    if (line.match(/^---+$|^\*\*\*+$|^___+$/)) {
      result.push(<hr key={i} className="my-3 border-nf-border-2" />);
      continue;
    }

    // Table: detect rows with | separator
    if (line.includes("|") && line.trim().startsWith("|")) {
      // Collect consecutive table rows
      const tableRows: string[][] = [];
      let j = i;
      while (j < lines.length && lines[j].includes("|") && lines[j].trim().startsWith("|")) {
        const row = lines[j].split("|").map(c => c.trim()).filter(c => c !== "");
        // Skip separator row (e.g. |---|---|)
        if (row.every(cell => /^[-:]+$/.test(cell))) { j++; continue; }
        tableRows.push(row);
        j++;
      }
      if (tableRows.length > 0) {
        const maxCols = Math.max(...tableRows.map(r => r.length));
        result.push(
          <div key={`table-${i}`} className="my-2 overflow-x-auto rounded-lg border border-nf-border-2">
            <table className="w-full text-[11px]">
              <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className={ri === 0 ? "bg-nf-secondary/30" : "border-t border-nf-border-2/50"}>
                  {Array.from({ length: maxCols }).map((_, ci) => {
                    const cell = row[ci] || "";
                    const formatted = formatInline(cell);
                    return ri === 0
                      ? <th key={ci} className="px-3 py-1.5 text-right font-bold text-white whitespace-nowrap" dangerouslySetInnerHTML={{ __html: formatted }} />
                      : <td key={ci} className="px-3 py-1.5 text-nf-muted whitespace-nowrap" dangerouslySetInnerHTML={{ __html: formatted }} />;
                  })}
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        );
        i = j - 1; // skip processed lines
        continue;
      }
    }

    if (!line.trim()) {
      result.push(<div key={i} className="h-2" />);
      continue;
    }

    const formatted = formatInline(line);
    result.push(<p key={i} className="text-[12px] text-nf-muted leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />);
  }

  if (inCodeBlock && codeLines.length > 0) {
    const highlighted = highlightCode(codeLines.join("\n"), codeLang);
    result.push(
      <div key="code-end" className="my-1.5 rounded-lg border border-nf-border-2 overflow-hidden">
        {codeLang && <div className="px-3 py-1 bg-nf-secondary/50 text-[9px] text-nf-dim font-mono border-b border-nf-border-2">{codeLang}</div>}
        <pre className="px-3 py-2 bg-[#1e1e1e] font-mono text-[11px] leading-relaxed overflow-x-auto" dangerouslySetInnerHTML={{ __html: highlighted }} />
      </div>
    );
  }

  return result;
}
