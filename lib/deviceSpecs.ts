export interface DeviceSpecs {
  os: string;
  cpu: string;   // "12-Core Processor"
  ram: string;   // "16 GB"
  gpu: string;   // "NVIDIA GeForce GTX 1080 Ti"
  vram: string;  // "4+ GB"
  screen: string; // "1920×1080"
  browser: string;
}

// ─── GPU: aggressive multi-pass cleanup ──────────────────────────────────────
function cleanGPU(raw: string): string {
  if (!raw) return "Unknown GPU";
  let s = raw;

  // Pass 1 — extract from ANGLE wrapper
  // e.g. "ANGLE (NVIDIA, NVIDIA GeForce GTX 1080 Ti (0x00001B06) Direct3D11 vs_5_0 ps_5_0, D3D11)"
  const m = s.match(/ANGLE\s*\(\s*[^,]+,\s*(.+?)(?:\s*\(0x[0-9a-fA-F]+\)|\s+Direct3D|\s+vs_|\s+ps_|\s*,\s*D3D)/i);
  if (m) s = m[1].trim();

  // Pass 2 — remove hex IDs
  s = s.replace(/\s*\(0x[0-9a-fA-F]+\)/gi, "");

  // Pass 3 — remove renderer suffixes
  s = s.replace(/\s*(Direct3D\S*|OpenGL\S*|Vulkan\S*|Metal\S*|vs_\S+|ps_\S+|D3D\d+\S*)/gi, "");

  // Pass 4 — remove duplicate vendor: "NVIDIA NVIDIA" → "NVIDIA"
  s = s.replace(/^(NVIDIA|AMD|Intel|Apple)\s+\1\s*/i, "$1 ");

  // Pass 5 — remove trailing junk
  s = s.replace(/[,;()\[\]]+$/, "").replace(/\s{2,}/g, " ").trim();

  return s || "Unknown GPU";
}

function estimateVRAM(gl: WebGLRenderingContext): string {
  try {
    const t = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
    if (t >= 16384) return "4+ GB";
    if (t >= 8192)  return "2 GB";
    if (t >= 4096)  return "1 GB";
    return "< 1 GB";
  } catch { return ""; }
}

function getGPUInfo(): { gpu: string; vram: string } {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return { gpu: "Unknown GPU", vram: "" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const raw = ext
      ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string)
      : (gl.getParameter(gl.RENDERER) as string);
    return { gpu: cleanGPU(raw || ""), vram: estimateVRAM(gl) };
  } catch { return { gpu: "Unknown GPU", vram: "" }; }
}

function getOS(ua: string): string {
  if (/Windows NT 10\.0/.test(ua)) return "Windows 10/11";
  if (/Windows NT 6\.3/.test(ua))  return "Windows 8.1";
  if (/Windows NT 6\.1/.test(ua))  return "Windows 7";
  if (/Windows/.test(ua))          return "Windows";
  const ios = ua.match(/iPhone OS (\d+)/);
  if (ios) return `iOS ${ios[1]}`;
  const ipad = ua.match(/iPad.*OS (\d+)/);
  if (ipad) return `iPadOS ${ipad[1]}`;
  const android = ua.match(/Android (\d+)/);
  if (android) return `Android ${android[1]}`;
  const mac = ua.match(/Mac OS X ([\d_.]+)/);
  if (mac) return `macOS ${mac[1].replace(/_/g, ".")}`;
  if (/CrOS/.test(ua))  return "ChromeOS";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown OS";
}

function getBrowser(ua: string): string {
  if (/Edg\/(\d+)/.test(ua))     return `Edge ${ua.match(/Edg\/(\d+)/)?.[1] || ""}`;
  if (/OPR\/(\d+)/.test(ua))     return `Opera ${ua.match(/OPR\/(\d+)/)?.[1] || ""}`;
  if (/Chrome\/(\d+)/.test(ua) && !/Chromium/.test(ua))
                                  return `Chrome ${ua.match(/Chrome\/(\d+)/)?.[1] || ""}`;
  if (/Firefox\/(\d+)/.test(ua)) return `Firefox ${ua.match(/Firefox\/(\d+)/)?.[1] || ""}`;
  if (/Safari\/(\d+)/.test(ua) && !/Chrome/.test(ua))
                                  return `Safari ${ua.match(/Version\/(\d+)/)?.[1] || ""}`;
  return "Unknown Browser";
}

export function getDeviceSpecs(): DeviceSpecs {
  const ua = navigator.userAgent;
  const cores = navigator.hardwareConcurrency || 0;
  const ramGB  = (navigator as any).deviceMemory || 0;
  const { gpu, vram } = getGPUInfo();

  // Multiply by devicePixelRatio to obtain the true physical screen resolution.
  // Standard CSS pixels returned by screen.width/height are scaled by OS/browser zoom levels.
  const dpr = typeof window !== "undefined" ? (window.devicePixelRatio || 1) : 1;
  const sw = typeof window !== "undefined" ? Math.round(window.screen.width * dpr) : 1920;
  const sh = typeof window !== "undefined" ? Math.round(window.screen.height * dpr) : 1080;

  return {
    os:      getOS(ua),
    browser: getBrowser(ua),
    cpu:     cores > 0 ? `${cores}-Core Processor` : "Unknown Processor",
    ram:     ramGB  > 0 ? `${ramGB} GB`             : "Unknown",
    gpu,
    vram,
    screen:  `${sw}×${sh}`,
  };
}
