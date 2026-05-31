/** VS Code Dark+ syntax highlighting for code blocks */

const C = {
  kw: "#569cd6",
  kwCtrl: "#c586c0",
  fn: "#dcdcaa",
  num: "#b5cea8",
  str: "#ce9178",
  cm: "#6a9955",
  type: "#4ec9b0",
  attr: "#9cdcfe",
  bool: "#569cd6",
  macro: "#9b9b9b",
};

function span(color: string, text: string, extra = ""): string {
  return `<span style="color:${color}${extra ? ";" + extra : ""}">${text}</span>`;
}

function colorizeCode(code: string, lang: string): string {
  const l = lang.toLowerCase();
  let s = code;

  const kw = (words: string, color = C.kw) => {
    s = s.replace(new RegExp(`\\b(${words})\\b`, "g"), (_, w) => span(color, w));
  };

  if (["csharp", "cs", "c#", "unity"].includes(l)) {
    s = s.replace(/(\[[\w\s,.\(\)]+\])/g, (_, a) => span(C.attr, a));
    s = s.replace(/\b(MonoBehaviour|GameObject|Transform|Vector2|Vector3|Input|KeyCode|Application|SerializeField|Rigidbody|Collider|Camera|Time|Debug|Mathf|ScriptableObject)\b/g, (_, t) =>
      span(C.type, t)
    );
    kw(
      "using|namespace|public|private|protected|internal|static|readonly|virtual|override|abstract|sealed|partial|extern|volatile|async|await|ref|out|in|params|where|new|class|struct|enum|interface|record|delegate|event|operator|implicit|explicit",
      C.kw
    );
    kw("void|return|if|else|for|foreach|while|do|switch|case|break|default|try|catch|throw|finally|continue|goto|lock|yield|this|base", C.kwCtrl);
    kw("int|float|double|bool|string|object|byte|char|decimal|long|short|uint|ulong|ushort|sbyte|nint|nuint|var|dynamic", C.type);
    kw("true|false|null", C.bool);
    s = s.replace(/\b(\d+\.?\d*f?)\b/g, (_, n) => span(C.num, n));
    s = s.replace(/(\w+)\s*(?=\()/g, (match, name) => {
      if (match.includes(">")) return match;
      if (/^(if|for|foreach|while|switch|catch|return|new|typeof|sizeof|nameof|lock|using)$/.test(name)) return match;
      return span(C.fn, name) + " ";
    });
    s = s.replace(/\b([A-Z]\w*)\b/g, (match, name, offset, whole) => {
      if (whole.slice(0, offset).includes(`>${name}<`)) return match;
      if (/^(MonoBehaviour|GameObject|Transform|Vector2|Vector3|Input|KeyCode|Application|SerializeField|Rigidbody|Collider|Camera|Time|Debug|Mathf|ScriptableObject)$/.test(name)) {
        return match;
      }
      return span(C.type, name);
    });
  } else if (["js", "ts", "javascript", "typescript", "jsx", "tsx"].includes(l)) {
    kw("const|let|var|function|return|if|else|for|while|do|switch|case|break|default|try|catch|throw|finally|yield|of|in|void|delete|super|static|new|typeof|instanceof|debugger|with", C.kwCtrl);
    kw("class|import|export|from|as|extends|implements|interface|type|enum|declare|readonly|abstract|async|await|require|module|namespace", C.kw);
    kw("true|false|null|undefined|NaN|Infinity|this", C.bool);
    s = s.replace(/\b(\d+\.?\d*f?)\b/g, (_, n) => span(C.num, n));
    s = s.replace(/(\w+)\s*(?=\()/g, (match, name) => {
      if (/^(if|for|while|switch|catch|return|new|typeof|delete|void)$/.test(name)) return match;
      return span(C.fn, name) + " ";
    });
  } else if (["python", "py"].includes(l)) {
    kw("def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|yield|lambda|pass|break|continue|and|or|not|in|is|global|nonlocal|async|await|del|assert", C.kwCtrl);
    kw("True|False|None|self|print", C.kw);
    s = s.replace(/\b(\d+\.?\d*f?)\b/g, (_, n) => span(C.num, n));
    s = s.replace(/(\w+)\s*(?=\()/g, (_, name) => span(C.fn, name) + " ");
  } else {
    kw("return|if|else|for|while|do|switch|case|break|default|try|catch|throw|new|delete|typeof|instanceof|yield|async|await", C.kwCtrl);
    kw("const|let|var|function|class|import|export|from|as|extends|implements|interface|type|enum|static|this|super|def|print|self|using|namespace|public|void", C.kw);
    kw("true|false|null|undefined|void|int|float|double|bool|string", C.type);
    s = s.replace(/\b(\d+\.?\d*f?)\b/g, (_, n) => span(C.num, n));
    s = s.replace(/(\w+)\s*(?=\()/g, (_, name) => span(C.fn, name) + " ");
  }

  return s;
}

export function highlightCode(code: string, lang: string): string {
  if (code.includes("\n")) {
    return code
      .split("\n")
      .map((line) => {
        const m = line.match(/^(\s*)([\s\S]*)$/);
        const lead = m?.[1] ?? "";
        const body = m?.[2] ?? "";
        if (!body) return lead;
        return lead + highlightCode(body, lang);
      })
      .join("\n");
  }

  const esc = code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  type Seg = { t: string; v: string };
  const segs: Seg[] = [];
  const re = /\/\*[\s\S]*?\*\/|\/\/.*$|(["'`])(?:(?!\1)[^\\]|\\.)*\1/gm;
  let li = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(esc)) !== null) {
    if (m.index > li) segs.push({ t: "c", v: esc.slice(li, m.index) });
    segs.push({ t: m[0].startsWith("/*") || m[0].startsWith("//") ? "cm" : "s", v: m[0] });
    li = m.index + m[0].length;
  }
  if (li < esc.length) segs.push({ t: "c", v: esc.slice(li) });

  return segs
    .map((s) =>
      s.t === "cm"
        ? span(C.cm, s.v, "font-style:italic")
        : s.t === "s"
          ? span(C.str, s.v)
          : colorizeCode(s.v, lang)
    )
    .join("");
}

export function guessCodeLang(code: string): string {
  if (/\b(using\s+UnityEngine|MonoBehaviour|SerializeField|GameObject|Transform|Input\.GetAxis)\b/.test(code)) {
    return "csharp";
  }
  if (/\b(namespace|public\s+class|void\s+Start|void\s+Update|\[SerializeField\])\b/.test(code)) return "csharp";
  if (/\b(func|package|import)\b/.test(code) && code.includes("fmt.")) return "go";
  if (/\b(def|elif|print)\b/.test(code)) return "python";
  if (/<\/?[a-z][\s\S]*>/i.test(code)) return "html";
  if (/\b(fn|let mut|impl)\b/.test(code)) return "rust";
  return "javascript";
}
