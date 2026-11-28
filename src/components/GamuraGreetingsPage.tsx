import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import jsQR from "jsqr";
import {
  ArrowLeft,
  Check,
  Copy,
  Download,
  ExternalLink,
  Gift,
  Home,
  ImagePlus,
  Moon,
  Plus,
  QrCode,
  ScanLine,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
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

interface GamuraGreetingsPageProps {
  onBackHome: () => void;
  onBackStore?: () => void;
}

type ViewTab = "home" | "studio" | "cards" | "scan";
type CardKind = "occ" | "voucher" | "id" | "biz";

interface ThemeDef {
  n: string;
  bg: [string, string];
  ink: string;
  foil: string[];
  acc: string;
  dark: boolean;
}

interface FieldDef {
  l: string;
  t: "text" | "area";
  max: number;
}

interface CardTypeDef {
  n: string;
  d: string;
  kind: CardKind;
  motif?: "balloons" | "flowers" | "hearts" | "rings" | "confetti" | "sparkle" | "stars";
  head?: string;
  forL?: string;
  f: string[];
  th: string;
  size?: [number, number];
  wide?: boolean;
  sides?: boolean;
  v: Record<string, string>;
}

interface CardOpts {
  logo: boolean;
  qr: boolean;
}

interface RenderCardData {
  type: string;
  theme: string;
  f: Record<string, string>;
  photoImg: HTMLImageElement | null;
  opts: CardOpts;
  id: string;
}

interface SavedCardRecord {
  id: string;
  type: string;
  theme: string;
  f: Record<string, string>;
  photo: string | null;
  opts: CardOpts;
  ts: number;
}

interface QrMatrix {
  n: number;
  get: (r: number, c: number) => boolean;
}

interface QrResult {
  qr: QrMatrix | null;
  text: string;
  full?: string;
}

const STORAGE_KEY = "gamura.cards.v1";

const THEMES: Record<string, ThemeDef> = {
  aurora: {
    n: "Aurora",
    bg: ["#fff7ff", "#e6efff"],
    ink: "#1b2147",
    foil: ["#e4372f", "#2f5bea", "#1f9d55", "#f2b21a"],
    acc: "#2f5bea",
    dark: false,
  },
  midnight: {
    n: "Midnight Gold",
    bg: ["#141a3c", "#04060f"],
    ink: "#f6edcf",
    foil: ["#fbe9a0", "#c8962e", "#fff4c4", "#a8761b"],
    acc: "#e2b857",
    dark: true,
  },
  rose: {
    n: "Rose Blush",
    bg: ["#fff1f4", "#ffd3de"],
    ink: "#5a1630",
    foil: ["#f07a96", "#b3294f", "#f9b4c4"],
    acc: "#c2335b",
    dark: false,
  },
  ocean: {
    n: "Ocean",
    bg: ["#eafaff", "#b9e3fa"],
    ink: "#07344f",
    foil: ["#2aa0e0", "#0a4f86", "#69cdf5"],
    acc: "#0f76b8",
    dark: false,
  },
  forest: {
    n: "Forest",
    bg: ["#f0faf1", "#c9e8cb"],
    ink: "#12361f",
    foil: ["#35a95d", "#14602f", "#98d9a3"],
    acc: "#1f7a3e",
    dark: false,
  },
  sunset: {
    n: "Sunset",
    bg: ["#fff4e2", "#ffbf9b"],
    ink: "#4a1d12",
    foil: ["#f47a3f", "#c42d3a", "#ffb84d"],
    acc: "#e0522a",
    dark: false,
  },
  royal: {
    n: "Royal Purple",
    bg: ["#2d1660", "#12072a"],
    ink: "#f4edff",
    foil: ["#f6dcff", "#b58cf0", "#7d4fd1"],
    acc: "#b58cf0",
    dark: true,
  },
  ivory: {
    n: "Ivory Classic",
    bg: ["#fcfaf4", "#e9e3d2"],
    ink: "#2b2a26",
    foil: ["#8a7a4a", "#d2c284", "#6e6038"],
    acc: "#8a7a4a",
    dark: false,
  },
};

const FIELDS: Record<string, FieldDef> = {
  headline: { l: "Headline", t: "text", max: 40 },
  to: { l: "For", t: "text", max: 50 },
  number: { l: "Big number (age, years)", t: "text", max: 4 },
  message: { l: "Message", t: "area", max: 300 },
  from: { l: "From", t: "text", max: 50 },
  date: { l: "Date", t: "text", max: 40 },
  time: { l: "Time", t: "text", max: 30 },
  venue: { l: "Venue", t: "text", max: 70 },
  name: { l: "Full name", t: "text", max: 50 },
  role: { l: "Role / title", t: "text", max: 40 },
  org: { l: "Organisation", t: "text", max: 40 },
  idno: { l: "ID number (blank = auto)", t: "text", max: 20 },
  email: { l: "Email", t: "text", max: 60 },
  phone: { l: "Phone", t: "text", max: 24 },
  country: { l: "Country", t: "text", max: 30 },
  issued: { l: "Issued", t: "text", max: 20 },
  expires: { l: "Valid until", t: "text", max: 20 },
  web: { l: "Website", t: "text", max: 60 },
  addr: { l: "Address", t: "text", max: 90 },
  note: { l: "Short note", t: "text", max: 80 },
  amount: { l: "Amount", t: "text", max: 14 },
  valid: { l: "Valid until", t: "text", max: 20 },
  code: { l: "Voucher code (blank = auto)", t: "text", max: 20 },
};

const TYPES: Record<string, CardTypeDef> = {
  birthday: {
    n: "Birthday",
    d: "Balloons and confetti",
    kind: "occ",
    motif: "balloons",
    head: "Happy Birthday",
    forL: "For",
    f: ["headline", "to", "number", "message", "from", "date"],
    th: "aurora",
    v: {
      headline: "Happy Birthday",
      to: "Aarav",
      number: "25",
      message:
        "Wishing you a year full of joy, laughter and everything you dream of. Make it unforgettable!",
      from: "Ranjan",
      date: "",
    },
  },
  greeting: {
    n: "Greeting",
    d: "Warm wishes for anyone",
    kind: "occ",
    motif: "flowers",
    head: "Warm Wishes",
    forL: "Dear",
    f: ["headline", "to", "message", "from", "date"],
    th: "rose",
    v: {
      headline: "Warm Wishes",
      to: "My Friend",
      message:
        "Sending you good thoughts, good health and good times. Thank you for being part of my story.",
      from: "GAMURA",
      date: "",
    },
  },
  anniversary: {
    n: "Anniversary",
    d: "Celebrate your years",
    kind: "occ",
    motif: "hearts",
    head: "Happy Anniversary",
    forL: "To",
    f: ["headline", "to", "number", "message", "from", "date"],
    th: "midnight",
    v: {
      headline: "Happy Anniversary",
      to: "Priya & Karthik",
      number: "10",
      message:
        "Ten years of love, and still the best is ahead. Cheers to many more.",
      from: "With love",
      date: "",
    },
  },
  wedding: {
    n: "Wedding Invite",
    d: "Names, date and venue",
    kind: "occ",
    motif: "rings",
    head: "We're Getting Married",
    forL: "",
    f: ["headline", "to", "message", "date", "time", "venue", "from"],
    th: "ivory",
    v: {
      headline: "We're Getting Married",
      to: "Anika & Rohan",
      message:
        "Together with our families, we joyfully invite you to celebrate our wedding.",
      from: "",
      date: "14 February 2027",
      time: "6:30 PM",
      venue: "The Grand Palace, Chennai",
    },
  },
  thanks: {
    n: "Thank You",
    d: "Say it beautifully",
    kind: "occ",
    motif: "flowers",
    head: "Thank You",
    forL: "Dear",
    f: ["headline", "to", "message", "from"],
    th: "forest",
    v: {
      headline: "Thank You",
      to: "Team",
      message:
        "Your support meant more than words can say. I am truly grateful.",
      from: "Ranjan",
      date: "",
    },
  },
  congrats: {
    n: "Congratulations",
    d: "Cheer a big win",
    kind: "occ",
    motif: "confetti",
    head: "Congratulations",
    forL: "To",
    f: ["headline", "to", "message", "from", "date"],
    th: "sunset",
    v: {
      headline: "Congratulations",
      to: "Meera",
      message:
        "Your hard work has paid off. We are so proud of everything you have achieved.",
      from: "All of us",
      date: "",
    },
  },
  festival: {
    n: "Festival",
    d: "Lights and sparkle",
    kind: "occ",
    motif: "sparkle",
    head: "Happy Festival",
    forL: "To",
    f: ["headline", "to", "message", "from"],
    th: "royal",
    v: {
      headline: "Happy Diwali",
      to: "Dear Family",
      message:
        "May the festival of lights fill your home with warmth, prosperity and endless happiness.",
      from: "GAMURA",
      date: "",
    },
  },
  getwell: {
    n: "Get Well",
    d: "Gentle healing wishes",
    kind: "occ",
    motif: "flowers",
    head: "Get Well Soon",
    forL: "For",
    f: ["headline", "to", "message", "from"],
    th: "ocean",
    v: {
      headline: "Get Well Soon",
      to: "Dad",
      message:
        "Rest well and heal fast. Sending you strength, sunshine and big hugs.",
      from: "Ranjan",
      date: "",
    },
  },
  baby: {
    n: "New Baby",
    d: "Welcome the little one",
    kind: "occ",
    motif: "stars",
    head: "Welcome Little One",
    forL: "For",
    f: ["headline", "to", "message", "from", "date"],
    th: "ocean",
    v: {
      headline: "Welcome Little One",
      to: "Baby Diya",
      message:
        "A tiny miracle has arrived. Congratulations on your beautiful new chapter.",
      from: "Your family",
      date: "",
    },
  },
  love: {
    n: "Love",
    d: "Say I love you",
    kind: "occ",
    motif: "hearts",
    head: "With All My Love",
    forL: "My Dearest",
    f: ["headline", "to", "message", "from"],
    th: "rose",
    v: {
      headline: "With All My Love",
      to: "Sanjana",
      message:
        "Every day with you is my favorite day. You are my home.",
      from: "Forever yours",
      date: "",
    },
  },
  invite: {
    n: "Party Invite",
    d: "Event details and RSVP",
    kind: "occ",
    motif: "confetti",
    head: "You're Invited",
    forL: "Hosted by",
    f: ["headline", "to", "message", "date", "time", "venue"],
    th: "aurora",
    v: {
      headline: "You're Invited",
      to: "GAMURA Team",
      message:
        "Join us for an evening of music, food and good company. Dress to impress!",
      date: "20 December 2026",
      time: "7:00 PM",
      venue: "Skyline Terrace, Bengaluru",
      from: "",
    },
  },
  voucher: {
    n: "Gift Voucher",
    d: "Premium gift card",
    kind: "voucher",
    f: ["amount", "to", "from", "message", "valid", "code"],
    th: "midnight",
    size: [1200, 600],
    wide: true,
    v: {
      amount: "₹2,500",
      to: "Aarav",
      from: "Ranjan",
      message: "Treat yourself to something special.",
      valid: "31 Dec 2027",
      code: "",
    },
  },
  id: {
    n: "GAMURA ID Card",
    d: "Identity card with QR",
    kind: "id",
    f: ["name", "role", "org", "idno", "email", "phone", "country", "issued", "expires"],
    th: "aurora",
    size: [1012, 638],
    wide: true,
    sides: true,
    v: {
      name: "Selvaranjan Ganthi",
      role: "Founder",
      org: "GAMURA",
      idno: "",
      email: "name@example.com",
      phone: "+91 00000 00000",
      country: "India",
      issued: "11/2026",
      expires: "11/2031",
    },
  },
  biz: {
    n: "Digital Business Card",
    d: "vCard with QR code",
    kind: "biz",
    f: ["name", "role", "org", "phone", "email", "web", "addr", "note"],
    th: "midnight",
    size: [1050, 600],
    wide: true,
    sides: true,
    v: {
      name: "Selvaranjan Ganthi",
      role: "Founder",
      org: "GAMURA",
      phone: "+91 00000 00000",
      email: "name@example.com",
      web: "www.example.com",
      addr: "Your city, India",
      note: "Premium cards for everyone",
    },
  },
};

const SERIF = '"Playfair Display", Georgia, serif';
const SCRIPT = '"Great Vibes", "Brush Script MT", cursive';
const UI_FONT = '"Outfit", "Plus Jakarta Sans", system-ui, sans-serif';

function rng(seed: number) {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rr(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

function foilG(
  c: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  cols: string[],
) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  cols.forEach((cl, i) => {
    g.addColorStop(cols.length > 1 ? i / (cols.length - 1) : 0, cl);
  });
  return g;
}

function wrapLines(c: CanvasRenderingContext2D, text: string, maxW: number) {
  const out: string[] = [];
  String(text || "")
    .split(/\n/)
    .forEach((p) => {
      let cur = "";
      p.split(/\s+/).forEach((w) => {
        if (!w) return;
        const t = cur ? `${cur} ${w}` : w;
        if (c.measureText(t).width > maxW && cur) {
          out.push(cur);
          cur = w;
        } else {
          cur = t;
        }
      });
      out.push(cur);
    });
  return out;
}

function fitFont(
  c: CanvasRenderingContext2D,
  text: string,
  fn: (size: number) => string,
  maxW: number,
  start: number,
  min: number,
) {
  let s = start;
  while (s > min) {
    c.font = fn(s);
    if (c.measureText(text).width <= maxW) break;
    s -= 2;
  }
  c.font = fn(s);
  return s;
}

function coverImg(
  c: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  const r = Math.max(w / img.width, h / img.height);
  const sw = w / r;
  const sh = h / r;
  c.drawImage(
    img,
    (img.width - sw) / 2,
    (img.height - sh) / 2,
    sw,
    sh,
    x,
    y,
    w,
    h,
  );
}

function setCanvasSpacing(c: CanvasRenderingContext2D, v: string) {
  try {
    (c as unknown as { letterSpacing?: string }).letterSpacing = v;
  } catch {
    // ignore unsupported browsers
  }
}

function hexA(h: string, a: number) {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

function drawBadge(
  c: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  logoImg: HTMLImageElement | null,
) {
  c.save();
  c.shadowColor = "rgba(0,0,0,.35)";
  c.shadowBlur = r * 0.4;
  c.shadowOffsetY = r * 0.12;
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fill();
  c.restore();

  c.save();
  c.beginPath();
  c.arc(cx, cy, Math.max(1, r - 2), 0, Math.PI * 2);
  c.clip();
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    const pad = r * 1.08;
    c.drawImage(logoImg, cx - pad, cy - pad, pad * 2, pad * 2);
  } else {
    c.fillStyle = "#2f5bea";
    c.font = `800 ${Math.round(r * 1.1)}px ${UI_FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("G", cx, cy + 1);
  }
  c.restore();
}

function drawPaper(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  th: ThemeDef,
  seed: number,
) {
  c.fillStyle = foilG(c, 0, 0, w * 0.35, h, th.bg);
  c.fillRect(0, 0, w, h);
  const g = c.createRadialGradient(w * 0.3, h * 0.15, 0, w * 0.3, h * 0.15, w * 0.9);
  g.addColorStop(0, th.dark ? "rgba(255,255,255,.10)" : "rgba(255,255,255,.65)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  c.fillStyle = g;
  c.fillRect(0, 0, w, h);
  const r = rng(seed || 7);
  for (let i = 0; i < 2200; i++) {
    c.fillStyle = r() < 0.5 ? "rgba(0,0,0,.035)" : "rgba(255,255,255,.05)";
    c.fillRect(r() * w, r() * h, 1.6, 1.6);
  }
}

function drawSparkle(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  col: string,
) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x, y - r);
  c.quadraticCurveTo(x, y, x + r, y);
  c.quadraticCurveTo(x, y, x, y + r);
  c.quadraticCurveTo(x, y, x - r, y);
  c.quadraticCurveTo(x, y, x, y - r);
  c.fill();
}

function drawHeart(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  s: number,
  col: string,
) {
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(x, y + s * 0.35);
  c.bezierCurveTo(x - s * 0.9, y - s * 0.35, x - s * 0.45, y - s * 0.95, x, y - s * 0.45);
  c.bezierCurveTo(x + s * 0.45, y - s * 0.95, x + s * 0.9, y - s * 0.35, x, y + s * 0.35);
  c.fill();
}

function drawFlower(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  col: string,
  rot: number,
) {
  c.save();
  c.translate(x, y);
  c.rotate(rot || 0);
  for (let i = 0; i < 7; i++) {
    c.rotate((Math.PI * 2) / 7);
    const g = c.createRadialGradient(0, -r * 0.6, 2, 0, -r * 0.6, r * 0.7);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.25, col);
    g.addColorStop(1, hexA(col.length === 7 ? col : "#d0507a", 0.8));
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(0, -r * 0.62, r * 0.28, r * 0.5, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = "#f6c453";
  c.beginPath();
  c.arc(0, 0, r * 0.2, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawBalloon(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  col: string,
  rot: number,
) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.strokeStyle = "rgba(120,120,140,.7)";
  c.lineWidth = 2.5;
  c.beginPath();
  c.moveTo(0, r * 1.2);
  c.bezierCurveTo(-r * 0.4, r * 2, r * 0.5, r * 2.5, 0, r * 3.2);
  c.stroke();

  const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.3);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.18, col);
  g.addColorStop(1, "rgba(0,0,0,.55)");
  c.fillStyle = g;
  c.shadowColor = "rgba(0,0,0,.25)";
  c.shadowBlur = 18;
  c.shadowOffsetY = 8;
  c.beginPath();
  c.ellipse(0, 0, r * 0.9, r * 1.15, 0, 0, Math.PI * 2);
  c.fill();
  c.shadowColor = "transparent";

  c.fillStyle = col;
  c.beginPath();
  c.moveTo(0, r * 1.12);
  c.lineTo(-r * 0.14, r * 1.34);
  c.lineTo(r * 0.14, r * 1.34);
  c.fill();

  c.fillStyle = "rgba(255,255,255,.55)";
  c.beginPath();
  c.ellipse(-r * 0.38, -r * 0.5, r * 0.13, r * 0.28, 0.5, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function drawMotif(
  c: CanvasRenderingContext2D,
  w: number,
  h: number,
  th: ThemeDef,
  kind: CardTypeDef["motif"],
  seed: number,
) {
  const r = rng(seed || 3);
  const f = th.foil;
  c.save();
  if (kind === "balloons") {
    const spots: [number, number][] = [
      [70, 150],
      [165, 255],
      [95, 370],
      [w - 70, 160],
      [w - 165, 265],
      [w - 95, 385],
      [80, h - 330],
      [170, h - 230],
      [w - 80, h - 340],
      [w - 170, h - 240],
    ];
    spots.forEach((p, j) => {
      drawBalloon(c, p[0], p[1], 48 + r() * 14, f[j % f.length], (r() - 0.5) * 0.5);
    });
  }
  if (kind === "confetti" || kind === "balloons") {
    const count = kind === "confetti" ? 120 : 50;
    for (let i = 0; i < count; i++) {
      const x = r() * w;
      const y = r() * h;
      if (x > 150 && x < w - 150 && y > 260 && y < h - 240) continue;
      c.save();
      c.translate(x, y);
      c.rotate(r() * 6);
      c.fillStyle = hexA(f[i % f.length], 0.85);
      const s = 8 + r() * 16;
      if (i % 3) {
        c.fillRect(-s / 2, -s / 4, s, s / 2);
      } else {
        c.beginPath();
        c.arc(0, 0, s / 3, 0, Math.PI * 2);
        c.fill();
      }
      c.restore();
    }
  }
  if (kind === "hearts") {
    for (let i = 0; i < 26; i++) {
      const x = r() * w;
      const y = r() * h;
      if (x > 170 && x < w - 170 && y > 250 && y < h - 230) {
        i--;
        if (r() < 0.2) i++;
        continue;
      }
      drawHeart(c, x, y, 16 + r() * 44, hexA(f[i % f.length], 0.25 + r() * 0.5));
    }
  }
  if (kind === "flowers" || kind === "rings") {
    c.globalAlpha = kind === "rings" ? 0.35 : 1;
    const corners: [number, number, number, number][] = [
      [0, 0, 1, 1],
      [w, 0, -1, 1],
      [0, h, 1, -1],
      [w, h, -1, -1],
    ];
    corners.forEach((p, q) => {
      for (let i = 0; i < 5; i++) {
        c.fillStyle = "rgba(46,140,84,.55)";
        c.save();
        c.translate(p[0] + p[2] * (40 + i * 52), p[1] + p[3] * (120 + i * 30));
        c.rotate(p[2] * p[3] * (0.8 + i * 0.15));
        c.beginPath();
        c.ellipse(0, 0, 46, 14, 0, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
      drawFlower(c, p[0] + p[2] * 95, p[1] + p[3] * 95, 78, f[q % f.length], q);
      drawFlower(
        c,
        p[0] + p[2] * 210,
        p[1] + p[3] * 70,
        44,
        f[(q + 1) % f.length],
        q * 2,
      );
      drawFlower(
        c,
        p[0] + p[2] * 60,
        p[1] + p[3] * 215,
        48,
        f[(q + 2) % f.length],
        q * 3,
      );
    });
    c.globalAlpha = 1;
  }
  if (kind === "rings") {
    c.lineWidth = 9;
    c.strokeStyle = foilG(c, w / 2 - 190, 380, w / 2 + 190, 560, f);
    c.globalAlpha = 0.3;
    c.beginPath();
    c.arc(w / 2 - 72, h / 2 - 40, 150, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(w / 2 + 72, h / 2 - 40, 150, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  }
  if (kind === "sparkle") {
    c.strokeStyle = "rgba(120,120,140,.6)";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, 60);
    c.quadraticCurveTo(w / 2, 210, w, 60);
    c.stroke();
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      const bx = w * t;
      const by = (1 - t) * (1 - t) * 60 + 2 * (1 - t) * t * 210 + t * t * 60;
      const col = f[i % f.length];
      const g = c.createRadialGradient(bx, by + 22, 2, bx, by + 22, 40);
      g.addColorStop(0, "#fff");
      g.addColorStop(0.3, col);
      g.addColorStop(1, hexA(col.length === 7 ? col : "#ffcc66", 0));
      c.fillStyle = g;
      c.beginPath();
      c.arc(bx, by + 22, 40, 0, Math.PI * 2);
      c.fill();
    }
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = r() * h;
      if (y < 260 || (x > 130 && x < w - 130 && y < h - 220)) continue;
      drawSparkle(c, x, y, 10 + r() * 26, hexA(f[i % f.length], 0.8));
    }
  }
  if (kind === "stars") {
    c.fillStyle = foilG(c, w - 300, 60, w - 100, 260, f);
    c.beginPath();
    c.arc(w - 170, 170, 70, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "destination-out";
    c.beginPath();
    c.arc(w - 140, 150, 64, 0, Math.PI * 2);
    c.fill();
    c.globalCompositeOperation = "source-over";
    for (let i = 0; i < 46; i++) {
      const x = r() * w;
      const y = r() * h;
      if (x > 150 && x < w - 150 && y > 260 && y < h - 230) continue;
      drawSparkle(c, x, y, 8 + r() * 24, hexA(f[i % f.length], 0.85));
    }
  }
  c.restore();
}

function drawQR(
  c: CanvasRenderingContext2D,
  qr: QrMatrix | null,
  x: number,
  y: number,
  s: number,
  ink?: string,
) {
  c.save();
  c.shadowColor = "rgba(0,0,0,.25)";
  c.shadowBlur = s * 0.08;
  c.shadowOffsetY = s * 0.03;
  c.fillStyle = "#fff";
  rr(c, x, y, s, s, s * 0.07);
  c.fill();
  c.restore();

  if (!qr) return;
  const q = s * 0.07 + s * 0.04;
  const m = (s - 2 * q) / qr.n;
  c.fillStyle = ink || "#111";
  for (let a = 0; a < qr.n; a++) {
    for (let b = 0; b < qr.n; b++) {
      if (qr.get(a, b)) {
        c.fillRect(
          Math.floor(x + q + b * m),
          Math.floor(y + q + a * m),
          Math.ceil(m) + 0.4,
          Math.ceil(m) + 0.4,
        );
      }
    }
  }
}

function drawSilhouette(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  col: string,
) {
  c.fillStyle = col;
  c.beginPath();
  c.arc(x + w / 2, y + h * 0.36, w * 0.2, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.ellipse(x + w / 2, y + h * 0.95, w * 0.38, h * 0.34, 0, Math.PI, 0);
  c.fill();
}

function drawRingPhoto(
  c: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cx: number,
  cy: number,
  r: number,
  foil: string[],
  ringBg: string,
) {
  c.save();
  c.shadowColor = "rgba(0,0,0,.35)";
  c.shadowBlur = 26;
  c.shadowOffsetY = 10;
  c.fillStyle = foilG(c, cx - r, cy - r, cx + r, cy + r, foil);
  c.beginPath();
  c.arc(cx, cy, r + 12, 0, Math.PI * 2);
  c.fill();
  c.restore();

  c.fillStyle = ringBg;
  c.beginPath();
  c.arc(cx, cy, r + 4, 0, Math.PI * 2);
  c.fill();

  c.save();
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.clip();
  coverImg(c, img, cx - r, cy - r, 2 * r, 2 * r);
  c.restore();
}

function hashStr(s: string) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function autoCode(card: RenderCardData, pre: string) {
  const n = hashStr(
    (card.f.name || card.f.to || "") + (card.f.org || "") + (card.id || "x"),
  )
    .toString(36)
    .toUpperCase()
    .padStart(7, "0")
    .slice(0, 7);
  return `${pre}-${n.slice(0, 4)}-${n.slice(4)}6`;
}

function drawBarcode(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: string,
  col: string,
) {
  const r = rng(hashStr(seed));
  let px = x;
  c.fillStyle = col;
  while (px < x + w - 4) {
    const bw = 1 + Math.floor(r() * 4);
    c.fillRect(px, y, bw, h);
    px += bw + 1 + Math.floor(r() * 3);
  }
}

function drawOcc(
  c: CanvasRenderingContext2D,
  card: RenderCardData,
  qr: QrMatrix | null,
  logoImg: HTMLImageElement | null,
) {
  const T = TYPES[card.type] || TYPES.birthday;
  const th = THEMES[card.theme] || THEMES.aurora;
  const d = card.f;
  const w = 1080;
  const h = 1350;
  const f = th.foil;
  const ink = th.ink;

  c.clearRect(0, 0, w, h);
  c.save();
  rr(c, 0, 0, w, h, 34);
  c.clip();
  drawPaper(c, w, h, th, 11);
  drawMotif(c, w, h, th, T.motif, 5);

  c.lineWidth = 6;
  c.strokeStyle = foilG(c, 0, 0, w, h, f);
  rr(c, 36, 36, w - 72, h - 72, 22);
  c.stroke();

  c.lineWidth = 1.6;
  c.strokeStyle = hexA(th.dark ? "#ffffff" : "#000000", 0.28);
  rr(c, 56, 56, w - 112, h - 112, 14);
  c.stroke();

  c.textAlign = "center";
  c.textBaseline = "alphabetic";
  let y = 150;
  if (card.opts.logo) {
    drawBadge(c, w / 2, y, 50, logoImg);
  }
  setCanvasSpacing(c, "7px");
  c.font = `600 22px ${UI_FONT}`;
  c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.75);
  c.fillText("GAMURA GREETINGS", w / 2 + 3, y + 92);
  setCanvasSpacing(c, "0px");

  y = 395;
  const head = d.headline || T.head || T.n;
  fitFont(c, head, (s) => `${s}px ${SCRIPT}`, w - 230, 168, 64);
  c.save();
  c.shadowColor = "rgba(0,0,0,.28)";
  c.shadowBlur = 10;
  c.shadowOffsetY = 4;
  c.fillStyle = foilG(c, w * 0.2, y - 120, w * 0.8, y + 30, f.concat(f.slice().reverse()));
  c.fillText(head, w / 2, y);
  c.restore();

  y += 40;
  const hasPhoto = Boolean(card.photoImg);
  const num = (d.number || "").trim();
  if (hasPhoto && card.photoImg) {
    const pr = 135;
    const pcy = y + pr + 14;
    drawRingPhoto(c, card.photoImg, w / 2, pcy, pr, th.foil, th.bg[0]);
    if (num) {
      const bx = w / 2 + pr * 0.78;
      const by = pcy + pr * 0.78;
      c.save();
      c.shadowColor = "rgba(0,0,0,.4)";
      c.shadowBlur = 16;
      c.fillStyle = foilG(c, bx - 60, by - 60, bx + 60, by + 60, f);
      c.beginPath();
      c.arc(bx, by, 62, 0, Math.PI * 2);
      c.fill();
      c.restore();

      c.fillStyle = th.dark ? "#1a1a1a" : "#ffffff";
      fitFont(c, num, (s) => `800 ${s}px ${SERIF}`, 84, 58, 26);
      c.textBaseline = "middle";
      c.fillText(num, bx, by + 2);
      c.textBaseline = "alphabetic";
    }
    y = pcy + pr + 60;
  } else if (num) {
    fitFont(c, num, (s) => `800 ${s}px ${SERIF}`, w - 300, 250, 100);
    const nsMatch = c.font.match(/(\d+)px/);
    const ns = nsMatch ? parseInt(nsMatch[1], 10) : 140;
    c.save();
    c.shadowColor = "rgba(0,0,0,.3)";
    c.shadowBlur = 14;
    c.shadowOffsetY = 6;
    c.fillStyle = foilG(c, w / 2 - 200, y, w / 2 + 200, y + ns, f.concat(f.slice().reverse()));
    c.fillText(num, w / 2, y + ns * 0.82);
    c.restore();
    y += ns * 0.82 + 50;
  } else {
    y += 90;
  }

  const footH = 190;
  const fromH = d.from ? 96 : 0;
  const det: [string, string][] = [];
  if (d.date && T.f.indexOf("time") >= 0) {
    det.push(["DATE", d.date]);
  } else if (d.date) {
    det.push(["", d.date]);
  }
  if (d.time && T.f.indexOf("time") >= 0) det.push(["TIME", d.time]);
  if (d.venue && T.f.indexOf("venue") >= 0) det.push(["VENUE", d.venue]);
  const detH = det.length ? det.length * 50 + 36 : 0;

  if (d.to) {
    if (T.forL) {
      setCanvasSpacing(c, "6px");
      c.font = `600 24px ${UI_FONT}`;
      c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.7);
      c.fillText(T.forL.toUpperCase(), w / 2 + 3, y);
      setCanvasSpacing(c, "0px");
      y += 62;
    }
    fitFont(c, d.to, (s) => `700 ${s}px ${SERIF}`, w - 240, 70, 34);
    c.fillStyle = ink;
    c.fillText(d.to, w / 2, y);
    y += 48;
  }

  if (d.message) {
    c.font = `italic 500 36px ${SERIF}`;
    c.fillStyle = ink;
    let ls = wrapLines(c, d.message, w - 290);
    const max = Math.max(2, Math.floor((h - footH - y - fromH - detH) / 54));
    if (ls.length > max) {
      ls = ls.slice(0, max);
      ls[max - 1] = `${ls[max - 1].replace(/\s*\S*$/, "")}…`;
    }
    ls.forEach((l, i) => {
      c.fillText(l, w / 2, y + i * 54);
    });
    y += ls.length * 54 + 10;
  }

  if (det.length) {
    y += 10;
    det.forEach((p) => {
      c.font = `600 30px ${UI_FONT}`;
      c.fillStyle = ink;
      c.textAlign = "center";
      if (p[0]) {
        setCanvasSpacing(c, "4px");
        c.font = `600 20px ${UI_FONT}`;
        c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.6);
        c.textAlign = "right";
        c.fillText(p[0], w / 2 - 14, y);
        c.textAlign = "left";
        setCanvasSpacing(c, "0px");
        c.font = `600 30px ${UI_FONT}`;
        c.fillStyle = ink;
        c.fillText(p[1], w / 2 + 14, y + 1);
        c.textAlign = "center";
      } else {
        c.fillText(p[1], w / 2, y);
      }
      y += 50;
    });
  }

  if (d.from) {
    fitFont(c, d.from, (s) => `${s}px ${SCRIPT}`, w - 260, 78, 40);
    c.save();
    c.fillStyle = foilG(c, w * 0.3, y, w * 0.7, y + 70, f.concat(f.slice().reverse()));
    c.fillText(d.from, w / 2, y + (det.length ? 64 : 52));
    c.restore();
  }

  const fy = h - 150;
  if (card.opts.qr && qr) {
    drawQR(c, qr, w - 86 - 150, h - 86 - 150, 150, "#14182e");
    c.textAlign = "left";
    c.font = `600 20px ${UI_FONT}`;
    setCanvasSpacing(c, "2px");
    c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.75);
    c.fillText("SCAN TO OPEN", 92, fy + 70);
    c.fillText("THIS CARD", 92, fy + 98);
    setCanvasSpacing(c, "0px");
  } else {
    c.textAlign = "center";
    setCanvasSpacing(c, "8px");
    c.font = `700 34px ${UI_FONT}`;
    c.fillStyle = foilG(c, w / 2 - 140, fy, w / 2 + 140, fy + 40, f);
    c.fillText("GAMURA", w / 2 + 4, fy + 80);
    setCanvasSpacing(c, "0px");
  }
  c.restore();
}

function drawVoucher(
  c: CanvasRenderingContext2D,
  card: RenderCardData,
  qr: QrMatrix | null,
  logoImg: HTMLImageElement | null,
) {
  const th = THEMES[card.theme] || THEMES.midnight;
  const d = card.f;
  const w = 1200;
  const h = 600;
  const f = th.foil;
  const ink = th.ink;
  const sx = 850;
  const code = d.code || autoCode(card, "GV");

  c.clearRect(0, 0, w, h);
  c.save();
  rr(c, 0, 0, w, h, 34);
  c.clip();
  drawPaper(c, w, h, th, 21);

  for (let i = 0; i < 14; i++) {
    const col = f[i % f.length];
    c.strokeStyle = hexA(col.length === 7 ? col : "#d4a017", 0.16);
    c.lineWidth = 2;
    c.beginPath();
    c.arc(150, 300, 60 + i * 34, 0, Math.PI * 2);
    c.stroke();
  }
  c.lineWidth = 4;
  c.strokeStyle = foilG(c, 0, 0, w, h, f);
  rr(c, 22, 22, w - 44, h - 44, 18);
  c.stroke();

  c.textAlign = "left";
  if (card.opts.logo) drawBadge(c, 100, 100, 40, logoImg);
  setCanvasSpacing(c, "8px");
  c.font = `700 26px ${UI_FONT}`;
  c.fillStyle = foilG(c, 150, 60, 420, 100, f);
  c.fillText("GIFT VOUCHER", 160, 98);
  setCanvasSpacing(c, "3px");
  c.font = `500 18px ${UI_FONT}`;
  c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.7);
  c.fillText("GAMURA GREETINGS", 162, 126);
  setCanvasSpacing(c, "0px");

  const am = d.amount || "";
  fitFont(c, am, (s) => `800 ${s}px ${SERIF}`, sx - 130, 180, 70);
  const s2Match = c.font.match(/(\d+)px/);
  const s2 = s2Match ? parseInt(s2Match[1], 10) : 120;
  c.save();
  c.shadowColor = "rgba(0,0,0,.3)";
  c.shadowBlur = 12;
  c.shadowOffsetY = 5;
  c.fillStyle = foilG(c, 70, 230, sx - 60, 330, f.concat(f.slice().reverse()));
  c.fillText(am, 70, 300 + s2 * 0.2);
  c.restore();

  let y = 400;
  if (d.to) {
    c.font = `600 22px ${UI_FONT}`;
    setCanvasSpacing(c, "4px");
    c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.65);
    c.fillText("FOR", 70, y);
    setCanvasSpacing(c, "0px");
    fitFont(c, d.to, (s) => `700 ${s}px ${SERIF}`, sx - 300, 44, 26);
    c.fillStyle = ink;
    c.fillText(d.to, 130, y + 1);
    y += 50;
  }
  if (d.message) {
    c.font = `italic 500 26px ${SERIF}`;
    c.fillStyle = ink;
    wrapLines(c, d.message, sx - 140)
      .slice(0, 2)
      .forEach((l, i) => {
        c.fillText(l, 70, y + i * 36);
      });
  }
  if (d.from) {
    c.font = `52px ${SCRIPT}`;
    c.fillStyle = foilG(c, 70, 520, 300, 560, f);
    c.fillText(`From ${d.from}`, 70, 555);
  }

  c.globalCompositeOperation = "destination-out";
  c.beginPath();
  c.arc(sx, 0, 26, 0, Math.PI * 2);
  c.fill();
  c.beginPath();
  c.arc(sx, h, 26, 0, Math.PI * 2);
  c.fill();
  c.globalCompositeOperation = "source-over";

  c.strokeStyle = hexA(ink.length === 7 ? ink : "#222222", 0.4);
  c.lineWidth = 3;
  c.setLineDash([10, 12]);
  c.beginPath();
  c.moveTo(sx, 40);
  c.lineTo(sx, h - 40);
  c.stroke();
  c.setLineDash([]);

  const cx = (sx + w) / 2;
  if (card.opts.qr && qr) drawQR(c, qr, cx - 100, 90, 200, "#14182e");
  c.textAlign = "center";
  c.font = `600 20px ${UI_FONT}`;
  setCanvasSpacing(c, "3px");
  c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.7);
  c.fillText("CODE", cx, 350);
  setCanvasSpacing(c, "2px");
  c.font = `700 28px ${UI_FONT}`;
  c.fillStyle = ink;
  c.fillText(code, cx, 392);
  setCanvasSpacing(c, "3px");
  if (d.valid) {
    c.font = `600 18px ${UI_FONT}`;
    c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.65);
    c.fillText("VALID UNTIL", cx, 458);
    setCanvasSpacing(c, "1px");
    c.font = `600 26px ${UI_FONT}`;
    c.fillStyle = ink;
    c.fillText(d.valid, cx, 494);
  }
  setCanvasSpacing(c, "0px");
  c.restore();
}

function drawId(
  c: CanvasRenderingContext2D,
  card: RenderCardData,
  qr: QrMatrix | null,
  side: number,
  logoImg: HTMLImageElement | null,
) {
  const th = THEMES[card.theme] || THEMES.aurora;
  const d = card.f;
  const w = 1012;
  const h = 638;
  const f = th.foil;
  const col = th.dark
    ? { bg: th.bg, ink: th.ink, sub: hexA("#ffffff", 0.65) }
    : { bg: ["#141a44", "#070a1f"], ink: "#ffffff", sub: "rgba(255,255,255,.66)" };
  const idno = d.idno || autoCode(card, "GMR");

  c.clearRect(0, 0, w, h);
  c.save();
  rr(c, 0, 0, w, h, 40);
  c.clip();
  c.fillStyle = foilG(c, 0, 0, w * 0.7, h, col.bg);
  c.fillRect(0, 0, w, h);

  for (let i = 0; i < 26; i++) {
    c.strokeStyle = `rgba(255,255,255,${0.025 + (i % 3) * 0.012})`;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(w * 0.82, h * 1.05, 120 + i * 28, 80 + i * 20, -0.35, 0, Math.PI * 2);
    c.stroke();
  }
  for (let i = 0; i < 4; i++) {
    c.save();
    c.globalAlpha = 0.2;
    c.fillStyle = f[i % f.length];
    c.beginPath();
    const o = 470 + i * 74;
    c.moveTo(o, h);
    c.lineTo(o + 120, h);
    c.lineTo(o + 330, 0);
    c.lineTo(o + 210, 0);
    c.fill();
    c.restore();
  }
  const sh = c.createLinearGradient(0, 0, w, h);
  sh.addColorStop(0, "rgba(255,255,255,.14)");
  sh.addColorStop(0.3, "rgba(255,255,255,0)");
  sh.addColorStop(0.75, "rgba(255,255,255,0)");
  sh.addColorStop(1, "rgba(255,255,255,.07)");
  c.fillStyle = sh;
  c.fillRect(0, 0, w, h);

  c.textAlign = "left";
  c.textBaseline = "alphabetic";

  if (side === 1) {
    c.fillStyle = "#05060e";
    c.fillRect(0, 56, w, 92);
    c.fillStyle = "rgba(255,255,255,.12)";
    c.fillRect(0, 56, w, 3);
    c.fillStyle = "#f4f4f6";
    rr(c, 50, 176, w - 100, 64, 8);
    c.fill();
    c.font = `60px ${SCRIPT}`;
    c.fillStyle = "#1a2150";
    c.fillText(d.name || "Signature", 74, 226);
    c.font = `600 15px ${UI_FONT}`;
    setCanvasSpacing(c, "3px");
    c.fillStyle = "#6a7090";
    c.fillText("AUTHORISED SIGNATURE", w - 330, 196);
    setCanvasSpacing(c, "0px");

    drawQR(c, qr, 50, 274, 310, "#12162b");
    c.fillStyle = col.ink;
    c.font = `700 34px ${UI_FONT}`;
    c.fillText(d.org || "GAMURA", 400, 320);
    c.fillStyle = col.sub;
    c.font = `400 22px ${UI_FONT}`;
    [
      "This card verifies the identity of the holder",
      "within the GAMURA community. It remains the",
      "property of the issuer. Scan the QR code to",
      "view the holder's details and contact card.",
    ].forEach((l, j) => {
      c.fillText(l, 400, 362 + j * 32);
    });
    c.fillStyle = col.ink;
    c.font = `500 22px ${UI_FONT}`;
    if (d.email) c.fillText(d.email, 400, 520);
    if (d.phone) c.fillText(d.phone, 400, 552);
    c.font = `500 18px ${UI_FONT}`;
    setCanvasSpacing(c, "4px");
    c.fillStyle = col.sub;
    c.fillText(`ID  ${idno}`, 400, 596);
    setCanvasSpacing(c, "0px");
    if (card.opts.logo) drawBadge(c, w - 90, h - 90, 38, logoImg);
    c.restore();
    return;
  }

  if (card.opts.logo) drawBadge(c, 88, 84, 38, logoImg);
  c.font = `700 40px ${UI_FONT}`;
  setCanvasSpacing(c, "6px");
  c.fillStyle = foilG(c, 140, 50, 400, 100, f);
  c.fillText("GAMURA", 142, 86);
  setCanvasSpacing(c, "5px");
  c.font = `500 16px ${UI_FONT}`;
  c.fillStyle = col.sub;
  c.fillText("IDENTITY CARD", 144, 114);
  setCanvasSpacing(c, "0px");

  c.textAlign = "right";
  c.font = `600 18px ${UI_FONT}`;
  setCanvasSpacing(c, "3px");
  c.fillStyle = col.sub;
  c.fillText((d.country || "").toUpperCase(), w - 52, 70);
  setCanvasSpacing(c, "0px");
  c.textAlign = "left";

  const cg = foilG(c, w - 190, 60, w - 100, 130, ["#f8e7a2", "#c79a34", "#f7e3a0"]);
  c.fillStyle = cg;
  rr(c, w - 170, 86, 92, 70, 12);
  c.fill();
  c.strokeStyle = "rgba(90,60,0,.55)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(w - 170, 121);
  c.lineTo(w - 78, 121);
  c.moveTo(w - 124, 86);
  c.lineTo(w - 124, 156);
  c.stroke();
  rr(c, w - 150, 104, 52, 34, 8);
  c.stroke();

  const px = 52;
  const py = 176;
  const pw = 210;
  const ph = 262;
  c.save();
  c.shadowColor = "rgba(0,0,0,.45)";
  c.shadowBlur = 20;
  c.shadowOffsetY = 8;
  c.fillStyle = foilG(c, px, py, px + pw, py + ph, f);
  rr(c, px - 6, py - 6, pw + 12, ph + 12, 22);
  c.fill();
  c.restore();

  c.save();
  rr(c, px, py, pw, ph, 17);
  c.clip();
  if (card.photoImg) {
    coverImg(c, card.photoImg, px, py, pw, ph);
  } else {
    c.fillStyle = "#2a3160";
    c.fillRect(px, py, pw, ph);
    drawSilhouette(c, px, py, pw, ph, "rgba(255,255,255,.35)");
  }
  c.restore();

  const tx = 300;
  const mw = w - tx - 52;
  c.font = `600 15px ${UI_FONT}`;
  setCanvasSpacing(c, "4px");
  c.fillStyle = col.sub;
  c.fillText("NAME", tx, 198);
  setCanvasSpacing(c, "0px");

  fitFont(c, d.name || "Your Name", (s) => `700 ${s}px ${UI_FONT}`, mw, 52, 28);
  c.fillStyle = col.ink;
  c.fillText(d.name || "Your Name", tx, 250);
  c.font = `500 28px ${UI_FONT}`;
  c.fillStyle = foilG(c, tx, 260, tx + 300, 290, f);
  c.fillText(d.role || "", tx, 292);
  c.font = `400 24px ${UI_FONT}`;
  c.fillStyle = col.sub;
  c.fillText(d.org || "", tx, 326);

  const kv = (k: string, v: string, x: number, yPos: number) => {
    c.font = `600 14px ${UI_FONT}`;
    setCanvasSpacing(c, "4px");
    c.fillStyle = col.sub;
    c.fillText(k, x, yPos);
    setCanvasSpacing(c, "0px");
    c.font = `600 26px ${UI_FONT}`;
    c.fillStyle = col.ink;
    c.fillText(v || "—", x, yPos + 32);
  };
  kv("ID NUMBER", idno, tx, 372);
  kv("VALID THRU", d.expires || "—", tx + 300, 372);

  c.font = `500 20px ${UI_FONT}`;
  c.fillStyle = col.sub;
  let cy = 450;
  [d.email, d.phone].forEach((t) => {
    if (t) {
      fitFont(c, t, (s) => `500 ${s}px ${UI_FONT}`, mw, 21, 14);
      c.fillStyle = col.sub;
      c.fillText(t, tx, cy);
      cy += 30;
    }
  });

  drawBarcode(c, 52, h - 96, 340, 50, idno, "rgba(255,255,255,.88)");
  c.font = `500 15px ${UI_FONT}`;
  setCanvasSpacing(c, "6px");
  c.fillStyle = col.sub;
  c.fillText(idno, 52, h - 30);
  setCanvasSpacing(c, "0px");

  if (d.issued) {
    c.textAlign = "right";
    c.font = `500 16px ${UI_FONT}`;
    c.fillStyle = col.sub;
    c.fillText(`ISSUED ${d.issued}`, w - 52, h - 34);
    c.textAlign = "left";
  }
  c.restore();
}

function drawBiz(
  c: CanvasRenderingContext2D,
  card: RenderCardData,
  qr: QrMatrix | null,
  side: number,
  logoImg: HTMLImageElement | null,
) {
  const th = THEMES[card.theme] || THEMES.midnight;
  const d = card.f;
  const w = 1050;
  const h = 600;
  const f = th.foil;
  const ink = th.ink;

  c.clearRect(0, 0, w, h);
  c.save();
  rr(c, 0, 0, w, h, 30);
  c.clip();
  drawPaper(c, w, h, th, 31);
  c.textBaseline = "alphabetic";

  if (side === 1) {
    drawQR(c, qr, 70, 120, 360, "#12162b");
    c.textAlign = "left";
    c.font = `600 20px ${UI_FONT}`;
    setCanvasSpacing(c, "5px");
    c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.7);
    c.fillText("SCAN TO SAVE MY CONTACT", 490, 200);
    setCanvasSpacing(c, "0px");

    fitFont(c, d.name || "Your Name", (s) => `700 ${s}px ${SERIF}`, w - 540, 56, 30);
    c.fillStyle = ink;
    c.fillText(d.name || "Your Name", 490, 274);
    c.font = `500 28px ${UI_FONT}`;
    c.fillStyle = foilG(c, 490, 290, 800, 320, f);
    c.fillText(d.role || "", 490, 320);
    c.font = `400 24px ${UI_FONT}`;
    c.fillStyle = ink;
    c.fillText(d.org || "", 490, 360);
    c.font = `400 20px ${UI_FONT}`;
    c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.7);
    if (d.web) c.fillText(d.web, 490, 410);
    c.lineWidth = 4;
    c.strokeStyle = foilG(c, 0, 0, w, h, f);
    rr(c, 20, 20, w - 40, h - 40, 20);
    c.stroke();
    if (card.opts.logo) drawBadge(c, w - 90, h - 90, 38, logoImg);
    c.restore();
    return;
  }

  const lw = 350;
  c.fillStyle = foilG(c, 0, 0, lw, h, f.length > 3 ? f : f.concat([f[0]]));
  c.fillRect(0, 0, lw, h);
  const sh = c.createLinearGradient(0, 0, lw, h);
  sh.addColorStop(0, "rgba(255,255,255,.35)");
  sh.addColorStop(0.5, "rgba(255,255,255,0)");
  sh.addColorStop(1, "rgba(0,0,0,.25)");
  c.fillStyle = sh;
  c.fillRect(0, 0, lw, h);

  c.fillStyle = "rgba(255,255,255,.12)";
  c.beginPath();
  c.arc(lw * 0.2, h * 0.85, 200, 0, Math.PI * 2);
  c.fill();

  if (card.photoImg) {
    drawRingPhoto(
      c,
      card.photoImg,
      lw / 2,
      230,
      110,
      ["#ffffff", "#e8e8e8", "#ffffff"],
      "#ffffff",
    );
  } else if (card.opts.logo) {
    drawBadge(c, lw / 2, 230, 100, logoImg);
  }

  c.textAlign = "center";
  c.fillStyle = "#ffffff";
  c.save();
  c.shadowColor = "rgba(0,0,0,.4)";
  c.shadowBlur = 8;
  fitFont(
    c,
    (d.org || "GAMURA").toUpperCase(),
    (s) => `700 ${s}px ${UI_FONT}`,
    lw - 60,
    40,
    20,
  );
  setCanvasSpacing(c, "6px");
  c.fillText((d.org || "GAMURA").toUpperCase(), lw / 2 + 3, 430);
  c.restore();
  setCanvasSpacing(c, "0px");

  if (card.photoImg && card.opts.logo) drawBadge(c, lw / 2, 510, 34, logoImg);

  c.textAlign = "left";
  const x = lw + 60;
  const mw = w - x - 50;
  fitFont(c, d.name || "Your Name", (s) => `700 ${s}px ${SERIF}`, mw, 64, 32);
  c.fillStyle = ink;
  c.fillText(d.name || "Your Name", x, 170);
  c.font = `500 30px ${UI_FONT}`;
  c.fillStyle = foilG(c, x, 190, x + 300, 230, f);
  c.fillText(d.role || "", x, 222);
  c.fillStyle = hexA(f[0], 0.7);
  c.fillRect(x, 250, 90, 4);

  let y = 324;
  const rows: [string, string | undefined][] = [
    ["T", d.phone],
    ["E", d.email],
    ["W", d.web],
    ["A", d.addr],
  ];
  rows.forEach((r, j) => {
    if (!r[1]) return;
    c.fillStyle = foilG(c, x, y - 30, x + 44, y + 14, [
      f[j % f.length],
      f[(j + 1) % f.length],
    ]);
    c.beginPath();
    c.arc(x + 22, y - 9, 22, 0, Math.PI * 2);
    c.fill();
    c.font = `700 20px ${UI_FONT}`;
    c.textAlign = "center";
    c.fillStyle = "#fff";
    c.fillText(r[0], x + 22, y - 2);
    c.textAlign = "left";
    fitFont(c, r[1], (s) => `500 ${s}px ${UI_FONT}`, mw - 70, 26, 15);
    c.fillStyle = ink;
    c.fillText(r[1], x + 60, y);
    y += 62;
  });

  if (d.note) {
    c.font = `italic 500 22px ${SERIF}`;
    c.fillStyle = hexA(ink.length === 7 ? ink : "#222222", 0.75);
    c.fillText(d.note, x, h - 48);
  }
  if (card.opts.qr && qr) {
    drawQR(c, qr, w - 50 - 110, h - 50 - 110, 110, "#12162b");
  }
  c.restore();
}

function sizeOfCard(type: string): [number, number] {
  return TYPES[type]?.size || [1080, 1350];
}

function renderCardToCanvas(
  cv: HTMLCanvasElement,
  card: RenderCardData,
  side: number,
  qr: QrMatrix | null,
  logoImg: HTMLImageElement | null,
) {
  const s = sizeOfCard(card.type);
  cv.width = s[0];
  cv.height = s[1];
  const c = cv.getContext("2d");
  if (!c) return;
  const k = (TYPES[card.type] || TYPES.birthday).kind;
  if (k === "occ") drawOcc(c, card, qr, logoImg);
  else if (k === "voucher") drawVoucher(c, card, qr, logoImg);
  else if (k === "id") drawId(c, card, qr, side || 0, logoImg);
  else drawBiz(c, card, qr, side || 0, logoImg);
}

function b64Encode(obj: unknown) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin);
}

function b64Decode(str: string) {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return JSON.parse(new TextDecoder().decode(bytes));
}

function cleanFields(card: RenderCardData) {
  const T = TYPES[card.type] || TYPES.birthday;
  const o: Record<string, string> = {};
  T.f.forEach((k) => {
    const v = (card.f[k] || "").trim();
    if (v) o[k] = v;
  });
  return o;
}

function makeVcard(card: RenderCardData) {
  const d = card.f;
  const nm = (d.name || "").trim().split(/\s+/);
  const last = nm.length > 1 ? nm.pop() || "" : "";
  const first = nm.join(" ");
  const L = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${last};${first};;;`,
    `FN:${d.name || ""}`,
  ];
  if (d.org) L.push(`ORG:${d.org}`);
  if (d.role) L.push(`TITLE:${d.role}`);
  if (d.phone) L.push(`TEL;TYPE=CELL:${d.phone}`);
  if (d.email) L.push(`EMAIL:${d.email}`);
  if (d.web) L.push(`URL:${d.web}`);
  if (d.addr) L.push(`ADR;TYPE=WORK:;;${d.addr};;;;`);
  if (d.note) L.push(`NOTE:${d.note}`);
  L.push(`X-GAMURA-THEME:${card.theme}`, "END:VCARD");
  return L.join("\n");
}

function makeReadable(card: RenderCardData) {
  const d = card.f;
  const T = TYPES[card.type] || TYPES.birthday;
  const L: string[] = [];
  if (T.kind === "id") {
    L.push("GAMURA IDENTITY CARD", d.name || "");
    if (d.role) L.push(d.role + (d.org ? `, ${d.org}` : ""));
    L.push(`ID: ${d.idno || autoCode(card, "GMR")}`);
    if (d.email) L.push(d.email);
    if (d.phone) L.push(d.phone);
  } else if (T.kind === "voucher") {
    L.push(`GAMURA GIFT VOUCHER ${d.amount || ""}`);
    if (d.to) L.push(`For ${d.to}`);
    if (d.from) L.push(`From ${d.from}`);
    L.push(`Code: ${d.code || autoCode(card, "GV")}`);
    if (d.valid) L.push(`Valid until ${d.valid}`);
  } else {
    L.push(d.headline || T.head || T.n);
    if (d.to) L.push(d.to);
    if (d.number) L.push(`#${d.number}`);
    if (d.message) L.push(d.message);
    if (d.date) L.push(d.date);
    if (d.time) L.push(d.time);
    if (d.venue) L.push(d.venue);
    if (d.from) L.push(`— ${d.from}`);
  }
  L.push("Made with GAMURA Greetings");
  return L.join("\n");
}

function mkQR(text: string): QrMatrix | null {
  for (const level of ["M", "L"] as const) {
    try {
      const q = QRCode.create(text, { errorCorrectionLevel: level });
      const n = q.modules.size;
      return {
        n,
        get: (r: number, col: number) => Boolean(q.modules.get(r, col)),
      };
    } catch {
      // try lower ECC level
    }
  }
  return null;
}

function qrForCard(card: RenderCardData): QrResult {
  const T = TYPES[card.type] || TYPES.birthday;
  if (T.kind === "biz") {
    const text = makeVcard(card);
    return { qr: mkQR(text), text, full: text };
  }
  const tail = `\n#G1:${b64Encode({
    t: card.type,
    th: card.theme,
    f: cleanFields(card),
  })}`;
  const rd = makeReadable(card);
  const full = rd + tail;
  const q1 = mkQR(full);
  if (q1) return { qr: q1, text: rd, full };
  const q2 = mkQR(rd);
  if (q2) return { qr: q2, text: rd, full: rd };
  const clipped = rd.slice(0, 900);
  return { qr: mkQR(clipped), text: clipped, full: clipped };
}

function loadImgElement(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function nameOfCard(card: { type: string; f: Record<string, string> }) {
  const d = card.f;
  const T = TYPES[card.type] || TYPES.birthday;
  return (d.name || d.to || d.headline || d.amount || T.n).toString();
}

function sanitizeCardData(
  t: string,
  th: string,
  f: Record<string, unknown>,
): RenderCardData | null {
  const T = TYPES[t];
  if (!T) return null;
  const o: Record<string, string> = {};
  T.f.forEach((k) => {
    const val = f[k];
    if (typeof val === "string") {
      o[k] = val.slice(0, FIELDS[k]?.max || 80);
    }
  });
  return {
    type: t,
    theme: THEMES[th] ? th : T.th,
    f: o,
    photoImg: null,
    opts: { logo: true, qr: true },
    id: "scan",
  };
}

function parseVcard(text: string): RenderCardData | null {
  const get = (re: RegExp) => {
    const m = text.match(re);
    return m ? m[1].trim() : "";
  };
  const n = get(/^FN:(.*)$/m);
  const a = get(/^ADR[^:]*:(.*)$/m)
    .split(";")
    .filter(Boolean)
    .join(", ");
  return sanitizeCardData("biz", get(/^X-GAMURA-THEME:(.*)$/m), {
    name: n,
    org: get(/^ORG:(.*)$/m),
    role: get(/^TITLE:(.*)$/m),
    phone: get(/^TEL[^:]*:(.*)$/m),
    email: get(/^EMAIL[^:]*:(.*)$/m),
    web: get(/^URL[^:]*:(.*)$/m),
    addr: a,
    note: get(/^NOTE:(.*)$/m),
  });
}

function loadSavedCards(): SavedCardRecord[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? (JSON.parse(s) as SavedCardRecord[]) : [];
  } catch {
    return [];
  }
}

function storeSavedCards(items: SavedCardRecord[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch {
    return false;
  }
}

const CardThumbCanvas: React.FC<{
  card: RenderCardData;
  fontsReady: boolean;
  logoImg: HTMLImageElement | null;
  className?: string;
}> = ({ card, fontsReady, logoImg, className }) => {
  const cvRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!fontsReady || !cvRef.current) return;
    const s = sizeOfCard(card.type);
    const T = TYPES[card.type] || TYPES.birthday;
    const k = (T.wide ? 560 : 330) / s[0];
    const big = document.createElement("canvas");
    const q = qrForCard(card).qr;
    renderCardToCanvas(big, card, 0, q, logoImg);
    const cv = cvRef.current;
    cv.width = Math.round(s[0] * k);
    cv.height = Math.round(s[1] * k);
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(big, 0, 0, cv.width, cv.height);
  }, [card, fontsReady, logoImg]);

  return <canvas ref={cvRef} className={className} />;
};

export default function GamuraGreetingsPage({
  onBackHome,
  onBackStore,
}: GamuraGreetingsPageProps) {
  const [dark, setDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem("gamura_greetings_theme") === "dark";
    } catch {
      return false;
    }
  });
  const [view, setView] = useState<ViewTab>("home");
  const [fontsReady, setFontsReady] = useState(false);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  const [cardType, setCardType] = useState<string>("birthday");
  const [theme, setTheme] = useState<string>(TYPES.birthday.th);
  const [fields, setFields] = useState<Record<string, string>>(() => ({
    ...TYPES.birthday.v,
  }));
  const [draftCache, setDraftCache] = useState<
    Record<string, { f: Record<string, string>; theme: string }>
  >({});
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoImg, setPhotoImg] = useState<HTMLImageElement | null>(null);
  const [optLogo, setOptLogo] = useState<boolean>(true);
  const [optQr, setOptQr] = useState<boolean>(true);
  const [side, setSide] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [savedCards, setSavedCards] = useState<SavedCardRecord[]>(() =>
    loadSavedCards(),
  );
  const [savedCardThumbs, setSavedCardThumbs] = useState<
    Record<string, HTMLImageElement | null>
  >({});
  const [armedDeleteId, setArmedDeleteId] = useState<string | null>(null);

  // Scan state
  const [scanBusy, setScanBusy] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanRaw, setScanRaw] = useState<string | null>(null);
  const [scanCard, setScanCard] = useState<RenderCardData | null>(null);
  const [dropActive, setDropActive] = useState(false);

  // Download fallback modal + Toast
  const [previewModal, setPreviewModal] = useState<{
    msg: string;
    url: string;
    filename: string;
  } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Universe Store status
  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(() =>
    readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []).some(
      (a) => a.id === "gamura-greetings",
    ),
  );

  const studioCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const studioQrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  useEffect(() => {
    const prev = document.title;
    document.title = "GAMURA Greetings — Card, ID & QR Studio";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("gamura_greetings_theme", dark ? "dark" : "light");
    } catch {
      // ignore
    }
  }, [dark]);

  useEffect(() => {
    const syncUniverse = () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-greetings"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
    window.addEventListener("storage", syncUniverse);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
      window.removeEventListener("storage", syncUniverse);
    };
  }, []);

  // Load Google Fonts & GAMURA Logo before first canvas draw
  useEffect(() => {
    let active = true;
    const fontList = [
      '600 40px "Playfair Display"',
      'italic 500 36px "Playfair Display"',
      '800 60px "Playfair Display"',
      '700 40px "Playfair Display"',
      '64px "Great Vibes"',
      "400 20px Outfit",
      "500 20px Outfit",
      "600 20px Outfit",
      "700 20px Outfit",
    ];
    const fontsP = Promise.race([
      Promise.all(
        fontList.map((f) =>
          document.fonts?.load ? document.fonts.load(f, "Aa 123") : Promise.resolve(),
        ),
      ),
      new Promise((r) => setTimeout(r, 2500)),
    ]);

    const logoP = loadImgElement("/gamura-logo.png")
      .then((im) => {
        if (active) setLogoImg(im);
      })
      .catch(() => null);

    Promise.all([fontsP, logoP]).finally(() => {
      if (active) setFontsReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  // Load photos for saved cards
  useEffect(() => {
    let cancelled = false;
    savedCards.forEach((rec) => {
      if (rec.photo && !(rec.id in savedCardThumbs)) {
        loadImgElement(rec.photo)
          .then((img) => {
            if (!cancelled) {
              setSavedCardThumbs((prev) => ({ ...prev, [rec.id]: img }));
            }
          })
          .catch(() => {
            if (!cancelled) {
              setSavedCardThumbs((prev) => ({ ...prev, [rec.id]: null }));
            }
          });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [savedCards, savedCardThumbs]);

  const currentTypeDef = TYPES[cardType] || TYPES.birthday;

  const currentCard: RenderCardData = useMemo(
    () => ({
      type: cardType,
      theme,
      f: fields,
      photoImg,
      opts: { logo: optLogo, qr: optQr },
      id: editingId || "draft",
    }),
    [cardType, theme, fields, photoImg, optLogo, optQr, editingId],
  );

  const currentQr = useMemo(() => qrForCard(currentCard), [currentCard]);

  // Paint Studio Canvas & QR Preview Canvas
  useEffect(() => {
    if (!fontsReady || view !== "studio") return;
    const raf = window.requestAnimationFrame(() => {
      if (studioCanvasRef.current) {
        renderCardToCanvas(
          studioCanvasRef.current,
          currentCard,
          side,
          currentQr.qr,
          logoImg,
        );
      }
      if (studioQrCanvasRef.current) {
        const qc = studioQrCanvasRef.current;
        const c = qc.getContext("2d");
        if (c) {
          c.fillStyle = "#fff";
          c.fillRect(0, 0, 264, 264);
          if (currentQr.qr) {
            const m = (264 - 32) / currentQr.qr.n;
            c.fillStyle = "#12162b";
            for (let a = 0; a < currentQr.qr.n; a++) {
              for (let b = 0; b < currentQr.qr.n; b++) {
                if (currentQr.qr.get(a, b)) {
                  c.fillRect(
                    Math.floor(16 + b * m),
                    Math.floor(16 + a * m),
                    Math.ceil(m) + 0.3,
                    Math.ceil(m) + 0.3,
                  );
                }
              }
            }
          }
        }
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, [fontsReady, view, currentCard, currentQr, side, logoImg]);

  // Paint scanned card canvas
  useEffect(() => {
    if (!fontsReady || view !== "scan" || !scanCard || !scanCanvasRef.current) return;
    const q = qrForCard(scanCard).qr;
    renderCardToCanvas(scanCanvasRef.current, scanCard, 0, q, logoImg);
  }, [fontsReady, view, scanCard, logoImg]);

  const switchCardType = (nextType: string) => {
    if (nextType === cardType) {
      setView("studio");
      return;
    }
    const nextCache = {
      ...draftCache,
      [cardType]: { f: { ...fields }, theme },
    };
    setDraftCache(nextCache);
    const T = TYPES[nextType] || TYPES.birthday;
    const prev = nextCache[nextType];
    if (prev) {
      setFields({ ...prev.f });
      setTheme(prev.theme);
    } else {
      setFields({ ...T.v });
      setTheme(T.th);
    }
    setCardType(nextType);
    setSide(0);
    setEditingId(null);
    setView("studio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const triggerDownloadCanvas = (canvas: HTMLCanvasElement, filename: string) => {
    try {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 4000);
          showToast(`Saved ${filename} ✓`);
        } else {
          const dataUrl = canvas.toDataURL("image/png");
          setPreviewModal({
            msg: "Right-click or long-press the image to save it.",
            url: dataUrl,
            filename,
          });
        }
      }, "image/png");
    } catch {
      const dataUrl = canvas.toDataURL("image/png");
      setPreviewModal({
        msg: "Right-click or long-press the image to save it.",
        url: dataUrl,
        filename,
      });
    }
  };

  const handleDownloadCard = () => {
    const cv = document.createElement("canvas");
    renderCardToCanvas(cv, currentCard, side, currentQr.qr, logoImg);
    const suffix = currentTypeDef.sides ? (side ? "-back" : "-front") : "";
    triggerDownloadCanvas(cv, `gamura-${cardType}${suffix}.png`);
  };

  const handleDownloadQr = () => {
    if (!currentQr.qr) return;
    const q = currentQr.qr;
    const s = 900;
    const cv = document.createElement("canvas");
    cv.width = s;
    cv.height = s;
    const c = cv.getContext("2d");
    if (!c) return;
    c.fillStyle = "#fff";
    c.fillRect(0, 0, s, s);
    const m = (s - 120) / q.n;
    c.fillStyle = "#12162b";
    for (let a = 0; a < q.n; a++) {
      for (let b = 0; b < q.n; b++) {
        if (q.get(a, b)) {
          c.fillRect(
            Math.floor(60 + b * m),
            Math.floor(60 + a * m),
            Math.ceil(m),
            Math.ceil(m),
          );
        }
      }
    }
    triggerDownloadCanvas(cv, `gamura-qr-${cardType}.png`);
  };

  const handleCopyText = async (rawText?: string) => {
    const t = rawText ?? currentQr.full ?? currentQr.text;
    try {
      await navigator.clipboard.writeText(t);
      showToast("Copied ✓");
    } catch {
      try {
        const a = document.createElement("textarea");
        a.value = t;
        a.style.position = "fixed";
        a.style.opacity = "0";
        document.body.appendChild(a);
        a.select();
        document.execCommand("copy");
        a.remove();
        showToast("Copied ✓");
      } catch {
        showToast("Select and copy manually");
      }
    }
  };

  const handleSaveCard = () => {
    const id =
      editingId ||
      Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const rec: SavedCardRecord = {
      id,
      type: cardType,
      theme,
      f: { ...fields },
      photo: photoDataUrl,
      opts: { logo: optLogo, qr: optQr },
      ts: Date.now(),
    };
    const next = [rec, ...savedCards.filter((x) => x.id !== id)];
    if (storeSavedCards(next)) {
      setSavedCards(next);
      setEditingId(id);
      if (photoImg) {
        setSavedCardThumbs((prev) => ({ ...prev, [id]: photoImg }));
      }
      showToast("Saved to My Cards ✓");
    } else {
      showToast("Storage is full. Delete an old card first.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const rawUrl = await new Promise<string>((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(String(r.result || ""));
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const im = await loadImgElement(rawUrl);
      const k = Math.min(1, 720 / Math.max(im.width, im.height));
      const cv = document.createElement("canvas");
      cv.width = Math.max(1, Math.round(im.width * k));
      cv.height = Math.max(1, Math.round(im.height * k));
      cv.getContext("2d")?.drawImage(im, 0, 0, cv.width, cv.height);
      const dataUrl = cv.toDataURL("image/jpeg", 0.86);
      const resizedImg = await loadImgElement(dataUrl);
      setPhotoDataUrl(dataUrl);
      setPhotoImg(resizedImg);
      showToast("Photo added to card ✓");
    } catch {
      showToast("That image could not be read. Try a JPG or PNG.");
    }
  };

  const handleEditSavedCard = async (rec: SavedCardRecord) => {
    setDraftCache((prev) => ({
      ...prev,
      [cardType]: { f: { ...fields }, theme },
    }));
    let loadedImg = savedCardThumbs[rec.id] || null;
    if (rec.photo && !loadedImg) {
      loadedImg = await loadImgElement(rec.photo).catch(() => null);
    }
    setCardType(rec.type);
    setTheme(rec.theme);
    setFields({ ...rec.f });
    setPhotoDataUrl(rec.photo || null);
    setPhotoImg(loadedImg);
    setOptLogo(rec.opts?.logo ?? true);
    setOptQr(rec.opts?.qr ?? true);
    setEditingId(rec.id);
    setSide(0);
    setView("studio");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDownloadSavedCard = async (rec: SavedCardRecord) => {
    let loadedImg = savedCardThumbs[rec.id] || null;
    if (rec.photo && !loadedImg) {
      loadedImg = await loadImgElement(rec.photo).catch(() => null);
    }
    const cardObj: RenderCardData = {
      type: rec.type,
      theme: rec.theme,
      f: rec.f,
      photoImg: loadedImg,
      opts: rec.opts || { logo: true, qr: true },
      id: rec.id,
    };
    const cv = document.createElement("canvas");
    renderCardToCanvas(cv, cardObj, 0, qrForCard(cardObj).qr, logoImg);
    triggerDownloadCanvas(cv, `gamura-${rec.type}.png`);
  };

  const handleDeleteSavedCard = (id: string) => {
    if (armedDeleteId !== id) {
      setArmedDeleteId(id);
      window.setTimeout(() => {
        setArmedDeleteId((cur) => (cur === id ? null : cur));
      }, 3000);
      return;
    }
    const next = savedCards.filter((x) => x.id !== id);
    storeSavedCards(next);
    setSavedCards(next);
    setArmedDeleteId(null);
    if (editingId === id) setEditingId(null);
    showToast("Card removed");
  };

  const scanFile = async (file: File) => {
    setScanBusy(true);
    setScanError(null);
    setScanRaw(null);
    setScanCard(null);
    try {
      const dataUrl = await new Promise<string>((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result || ""));
        fr.onerror = rej;
        fr.readAsDataURL(file);
      });
      const im = await loadImgElement(dataUrl);
      let decoded: ReturnType<typeof jsQR> = null;
      for (const target of [1200, 700, 420]) {
        const k = Math.min(1, target / Math.max(im.width, im.height));
        const cv = document.createElement("canvas");
        cv.width = Math.max(1, Math.round(im.width * k));
        cv.height = Math.max(1, Math.round(im.height * k));
        const c = cv.getContext("2d");
        if (!c) continue;
        c.drawImage(im, 0, 0, cv.width, cv.height);
        const imgData = c.getImageData(0, 0, cv.width, cv.height);
        decoded = jsQR(imgData.data, cv.width, cv.height);
        if (decoded) break;
      }

      if (!decoded) {
        setScanError(
          "No QR code found. Use a sharp, well-lit image where the whole code is visible.",
        );
        return;
      }

      const raw = decoded.data;
      let parsedCard: RenderCardData | null = null;
      const g1Index = raw.indexOf("#G1:");
      try {
        if (g1Index >= 0) {
          const obj = b64Decode(raw.slice(g1Index + 4).trim());
          parsedCard = sanitizeCardData(obj.t, obj.th, obj.f || {});
        } else if (/^BEGIN:VCARD/i.test(raw.trim())) {
          parsedCard = parseVcard(raw);
        }
      } catch {
        parsedCard = null;
      }

      setScanCard(parsedCard);
      setScanRaw(g1Index >= 0 ? raw.slice(0, g1Index).trim() : raw);
    } catch {
      setScanError("That file is not a valid image.");
    } finally {
      setScanBusy(false);
    }
  };

  const handleToggleUniverse = () => {
    const storeItem = BUILTIN_STORE_APPS.find(
      (a) => a.id === "gamura-greetings",
    );
    if (!storeItem) return;
    if (installedInUniverse) {
      removeAppFromUniverse(storeItem.id);
      setInstalledInUniverse(false);
      showToast("Removed from Universe Apps");
    } else {
      addAppToUniverse(storeItem);
      setInstalledInUniverse(true);
      showToast("Added GAMURA GREETINGS to Universe Apps ✓");
    }
  };

  const bgMain = dark
    ? "bg-[#0d1020] text-[#eef0fb]"
    : "bg-[#f4f6fc] text-[#12162b]";
  const surface = dark
    ? "bg-[#171b31] border-[#2b3153] text-[#eef0fb]"
    : "bg-white border-[#dde2f0] text-[#12162b]";
  const surfaceMuted = dark ? "bg-[#1f2440]" : "bg-[#eef1fa]";
  const mutedText = dark ? "text-[#9aa3c6]" : "text-[#5a6280]";
  const borderLine = dark ? "border-[#2b3153]" : "border-[#dde2f0]";
  const accentBtn = dark
    ? "bg-[#7b97ff] text-[#0b1030] hover:bg-[#91a9ff]"
    : "bg-[#2f5bea] text-white hover:bg-[#234cd4]";

  return (
    <div
      style={{ fontFamily: UI_FONT }}
      className={`min-h-screen flex flex-col transition-colors duration-200 pb-20 md:pb-10 ${bgMain}`}
    >
      {/* Top Bar */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-xl ${
          dark
            ? "bg-[#0d1020]/88 border-[#2b3153]"
            : "bg-[#f4f6fc]/88 border-[#dde2f0]"
        }`}
      >
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Left: Back & Brand */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBackStore || onBackHome}
              title={onBackStore ? "Back to Launch Store" : "Back to Gamura Home"}
              className={`h-9 px-2.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 whitespace-nowrap ${surface}`}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">
                {onBackStore ? "Store" : "Home"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setView("home")}
              className="flex items-center gap-2.5 text-left cursor-pointer min-w-0"
            >
              <span className="w-9 h-9 rounded-xl bg-white border border-black/10 shadow-xs overflow-hidden flex items-center justify-center shrink-0">
                <img
                  src="/gamura-logo.png"
                  alt="GAMURA"
                  className="w-8 h-8 object-contain"
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[15px] font-bold tracking-tight truncate">
                  GAMURA Greetings
                </span>
                <span className={`hidden sm:block text-[10px] tracking-[0.14em] uppercase ${mutedText}`}>
                  Cards, IDs &amp; QR Studio
                </span>
              </span>
            </button>
          </div>

          {/* Center Desktop Navigation */}
          <nav
            aria-label="Main navigation"
            className="hidden md:flex items-center gap-1"
          >
            {(
              [
                { id: "home" as const, label: "Home" },
                { id: "studio" as const, label: "Create" },
                {
                  id: "cards" as const,
                  label:
                    savedCards.length > 0
                      ? `My Cards (${savedCards.length})`
                      : "My Cards",
                },
                { id: "scan" as const, label: "Scan QR" },
              ] as const
            ).map((navItem) => {
              const active = view === navItem.id;
              return (
                <button
                  key={navItem.id}
                  type="button"
                  onClick={() => setView(navItem.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? dark
                        ? "bg-[#eef0fb] text-[#0d1020]"
                        : "bg-[#12162b] text-[#f4f6fc]"
                      : `${mutedText} hover:opacity-80`
                  }`}
                >
                  {navItem.label}
                </button>
              );
            })}
          </nav>

          {/* Right Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleUniverse}
              title={
                installedInUniverse
                  ? "Remove from Universe Apps"
                  : "Add to Universe Apps"
              }
              className={`hidden sm:inline-flex h-9 px-3 rounded-xl border text-xs font-semibold items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                installedInUniverse
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                  : surface
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span>{installedInUniverse ? "In Universe" : "Universe"}</span>
            </button>

            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              title={dark ? "Light mode" : "Dark mode"}
              className={`w-9 h-9 rounded-xl border flex items-center justify-center cursor-pointer transition-colors shrink-0 ${surface}`}
            >
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1240px] mx-auto px-4 sm:px-6 py-7 sm:py-9">
        {view === "home" && (
          <div className="space-y-9">
            {/* Hero */}
            <section className="grid grid-cols-1 md:grid-cols-[1.35fr_0.65fr] gap-8 items-center">
              <div className="space-y-4">
                <h1
                  style={{ textWrap: "balance" }}
                  className="text-3xl sm:text-5xl font-bold tracking-tight leading-[1.1]"
                >
                  Cards that feel{" "}
                  <span
                    style={{
                      background:
                        "linear-gradient(90deg, #e4372f, #2f5bea 45%, #1f9d55 75%, #f2b21a)",
                      WebkitBackgroundClip: "text",
                      backgroundClip: "text",
                      color: "transparent",
                    }}
                  >
                    real
                  </span>
                  , made in a minute.
                </h1>
                <p className={`text-base sm:text-lg max-w-[54ch] leading-relaxed ${mutedText}`}>
                  Birthday and greeting cards, GAMURA identity ID cards, digital
                  business cards and more. Add your photo, pick a finish, and
                  share a QR code anyone can scan.
                </p>
                <div className="flex flex-wrap items-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => switchCardType("birthday")}
                    className={`px-5 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 whitespace-nowrap ${accentBtn}`}
                  >
                    <Gift size={16} />
                    <span>Make a birthday card</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => switchCardType("id")}
                    className={`px-4 py-2.5 rounded-xl border font-semibold text-sm inline-flex items-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 whitespace-nowrap ${surface}`}
                  >
                    <Sparkles size={15} />
                    <span>Create my GAMURA ID</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("scan")}
                    className={`px-4 py-2.5 rounded-xl border font-semibold text-sm inline-flex items-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 whitespace-nowrap ${surface}`}
                  >
                    <QrCode size={15} />
                    <span>Scan a QR</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-center md:justify-end">
                <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-[32px] bg-white border border-black/8 shadow-[0_14px_40px_rgba(30,40,90,0.14)] p-6 flex items-center justify-center">
                  <img
                    src="/gamura-logo.png"
                    alt="GAMURA Emblem"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </section>

            {/* All 14 Card Templates */}
            <section className="space-y-4">
              <div className="flex items-end justify-between gap-3 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                  Choose a card
                </h2>
                <span className={`text-sm tabular-nums ${mutedText}`}>
                  {Object.keys(TYPES).length} card types
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Object.entries(TYPES).map(([k, T]) => {
                  const previewCard: RenderCardData = {
                    type: k,
                    theme: T.th,
                    f: T.v,
                    photoImg: null,
                    opts: { logo: true, qr: true },
                    id: "sample",
                  };
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => switchCardType(k)}
                      className={`rounded-[18px] border p-2.5 pb-3.5 text-left flex flex-col gap-2.5 transition-all hover:-translate-y-1 hover:shadow-lg cursor-pointer min-w-0 ${surface}`}
                    >
                      <div
                        className={`rounded-[11px] overflow-hidden grid place-items-center ${surfaceMuted} ${
                          T.wide ? "aspect-[16/10]" : "aspect-[4/5]"
                        }`}
                      >
                        <CardThumbCanvas
                          card={previewCard}
                          fontsReady={fontsReady}
                          logoImg={logoImg}
                          className={
                            T.wide
                              ? "w-full h-auto block"
                              : "max-w-full max-h-full h-full w-auto object-contain block"
                          }
                        />
                      </div>
                      <div className="px-1">
                        <div className="text-sm font-bold truncate">{T.n}</div>
                        <div className={`text-xs truncate ${mutedText}`}>{T.d}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {view === "studio" && (
          <div className="grid grid-cols-1 lg:grid-cols-[430px_minmax(0,1fr)] gap-6 items-start">
            {/* Left Inspector Panel */}
            <div className={`rounded-[20px] border p-5 space-y-5 order-2 lg:order-1 ${surface}`}>
              {/* Card Type Selector Chips */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold tracking-tight">Card type</h3>
                <div
                  role="group"
                  aria-label="Card type"
                  className="flex gap-2 overflow-x-auto pb-1.5"
                >
                  {Object.entries(TYPES).map(([k, T]) => {
                    const active = k === cardType;
                    return (
                      <button
                        key={k}
                        type="button"
                        aria-pressed={active}
                        onClick={() => switchCardType(k)}
                        className={`px-3.5 py-1.5 rounded-full border text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                          active
                            ? `${accentBtn} border-transparent`
                            : `${surfaceMuted} ${borderLine}`
                        }`}
                      >
                        {T.n}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Design Theme Swatches */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold tracking-tight">
                  Design ·{" "}
                  <span className={`font-medium ${mutedText}`}>
                    {THEMES[theme]?.n}
                  </span>
                </h3>
                <div
                  role="group"
                  aria-label="Design theme"
                  className="flex flex-wrap gap-2.5"
                >
                  {Object.entries(THEMES).map(([k, t]) => {
                    const active = k === theme;
                    return (
                      <button
                        key={k}
                        type="button"
                        title={t.n}
                        aria-label={t.n}
                        aria-pressed={active}
                        onClick={() => setTheme(k)}
                        style={{
                          background: `linear-gradient(135deg, ${t.bg[0]} 0 40%, ${t.foil[0]} 40% 70%, ${
                            t.foil[Math.min(1, t.foil.length - 1)]
                          } 70%)`,
                        }}
                        className={`w-9 h-9 rounded-full cursor-pointer transition-transform hover:scale-105 ${
                          active
                            ? "ring-[3px] ring-[#2f5bea] ring-offset-2"
                            : "ring-1 ring-black/15"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Fields */}
              <div className="space-y-3.5">
                {currentTypeDef.f.map((k) => {
                  const def = FIELDS[k];
                  if (!def) return null;
                  let label = def.l;
                  if (k === "to" && currentTypeDef.forL) {
                    label =
                      currentTypeDef.forL === "Hosted by"
                        ? currentTypeDef.forL
                        : `${currentTypeDef.forL} (name)`;
                  }
                  if (k === "to" && currentTypeDef.kind === "occ" && !currentTypeDef.forL) {
                    label = "Names";
                  }
                  if (k === "to" && currentTypeDef.kind === "voucher") {
                    label = "For";
                  }

                  return (
                    <div key={k} className="flex flex-col gap-1.5">
                      <label
                        htmlFor={`gg-field-${k}`}
                        className={`text-[11px] font-semibold uppercase tracking-wider ${mutedText}`}
                      >
                        {label}
                      </label>
                      {def.t === "area" ? (
                        <textarea
                          id={`gg-field-${k}`}
                          maxLength={def.max}
                          rows={3}
                          value={fields[k] || ""}
                          onChange={(e) =>
                            setFields((prev) => ({ ...prev, [k]: e.target.value }))
                          }
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2f5bea] ${surfaceMuted} ${borderLine}`}
                        />
                      ) : (
                        <input
                          id={`gg-field-${k}`}
                          type="text"
                          maxLength={def.max}
                          inputMode={
                            k === "email"
                              ? "email"
                              : k === "phone"
                                ? "tel"
                                : k === "number"
                                  ? "numeric"
                                  : "text"
                          }
                          value={fields[k] || ""}
                          onChange={(e) =>
                            setFields((prev) => ({ ...prev, [k]: e.target.value }))
                          }
                          className={`w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#2f5bea] ${surfaceMuted} ${borderLine}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Photo / Logo / QR Options */}
              <div className="space-y-3 pt-1 border-t border-black/5 dark:border-white/10">
                <div className={`text-[11px] font-semibold uppercase tracking-wider ${mutedText}`}>
                  Photo or image
                </div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {photoDataUrl && (
                    <img
                      src={photoDataUrl}
                      alt="Uploaded card photo"
                      className={`w-13 h-13 rounded-xl object-cover border ${borderLine}`}
                    />
                  )}
                  <label
                    htmlFor="gg-photo-in"
                    className={`px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${surface}`}
                  >
                    <ImagePlus size={15} />
                    <span>{photoDataUrl ? "Replace photo" : "Add photo"}</span>
                  </label>
                  <input
                    id="gg-photo-in"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {photoDataUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoDataUrl(null);
                        setPhotoImg(null);
                      }}
                      className={`px-3 py-2 rounded-xl border text-xs sm:text-sm font-semibold text-[#e4372f] cursor-pointer ${surface}`}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-2.5 text-sm cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={optLogo}
                    onChange={(e) => setOptLogo(e.target.checked)}
                    className="w-4 h-4 accent-[#2f5bea]"
                  />
                  <span>Show GAMURA badge</span>
                </label>

                <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optQr}
                    onChange={(e) => setOptQr(e.target.checked)}
                    className="w-4 h-4 accent-[#2f5bea]"
                  />
                  <span>Print QR code on the card</span>
                </label>
              </div>
            </div>

            {/* Right Sticky Live Canvas Preview */}
            <div className="order-1 lg:order-2 lg:sticky lg:top-20">
              <div className={`rounded-[20px] border p-5 space-y-4 ${surface}`}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-bold tracking-tight">
                    {currentTypeDef.n}
                  </h3>
                  {currentTypeDef.sides && (
                    <div className="flex items-center gap-1.5">
                      {[
                        { label: "Front", val: 0 },
                        { label: "Back", val: 1 },
                      ].map((sBtn) => (
                        <button
                          key={sBtn.val}
                          type="button"
                          aria-pressed={side === sBtn.val}
                          onClick={() => setSide(sBtn.val)}
                          className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors ${
                            side === sBtn.val
                              ? `${accentBtn} border-transparent`
                              : `${surfaceMuted} ${borderLine}`
                          }`}
                        >
                          {sBtn.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Checkered Stage */}
                <div
                  style={{
                    backgroundImage: dark
                      ? "repeating-conic-gradient(#1f2440 0 25%, #0d1020 0 50%)"
                      : "repeating-conic-gradient(#eef1fa 0 25%, #f4f6fc 0 50%)",
                    backgroundSize: "22px 22px",
                  }}
                  className="rounded-2xl p-4 sm:p-5 min-h-[280px] grid place-items-center"
                >
                  <canvas
                    ref={studioCanvasRef}
                    aria-label="Card preview"
                    className="max-w-full max-h-[540px] w-auto h-auto rounded-md shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={handleDownloadCard}
                    className={`px-4 py-2.5 rounded-xl font-semibold text-sm inline-flex items-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 whitespace-nowrap ${accentBtn}`}
                  >
                    <Download size={15} />
                    <span>
                      {currentTypeDef.sides ? "Download this side" : "Download card"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveCard}
                    className={`px-4 py-2.5 rounded-xl border font-semibold text-sm inline-flex items-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 whitespace-nowrap ${surface}`}
                  >
                    <Check size={15} />
                    <span>Save to My Cards</span>
                  </button>

                  <button
                    type="button"
                    disabled={!currentQr.qr}
                    onClick={handleDownloadQr}
                    className={`px-4 py-2.5 rounded-xl border font-semibold text-sm inline-flex items-center gap-2 cursor-pointer disabled:opacity-40 transition-transform hover:-translate-y-0.5 whitespace-nowrap ${surface}`}
                  >
                    <QrCode size={15} />
                    <span>Download QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleCopyText()}
                    className={`px-4 py-2.5 rounded-xl border font-semibold text-sm inline-flex items-center gap-2 cursor-pointer transition-transform hover:-translate-y-0.5 whitespace-nowrap ${surface}`}
                  >
                    <Copy size={15} />
                    <span>
                      {currentTypeDef.kind === "biz" ? "Copy vCard" : "Copy text"}
                    </span>
                  </button>
                </div>

                {/* Live QR Box */}
                <div className={`pt-4 border-t flex flex-wrap items-center gap-4 ${borderLine}`}>
                  <canvas
                    ref={studioQrCanvasRef}
                    width={264}
                    height={264}
                    aria-label="QR code"
                    className={`w-32 h-32 rounded-xl bg-white border shrink-0 ${borderLine}`}
                  />
                  <p className={`text-sm leading-relaxed flex-1 min-w-[200px] ${mutedText}`}>
                    {currentTypeDef.kind === "biz" ? (
                      <>
                        <b className={dark ? "text-[#eef0fb]" : "text-[#12162b]"}>
                          Scan to save the contact.
                        </b>{" "}
                        Any phone camera offers to add this vCard to contacts.
                      </>
                    ) : (
                      <>
                        <b className={dark ? "text-[#eef0fb]" : "text-[#12162b]"}>
                          Scan to open.
                        </b>{" "}
                        A phone camera shows the message. In this app, use Scan QR to
                        see the full card.
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === "cards" && (
          <div className="space-y-5">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                My Cards
              </h2>
              <span className={`text-sm tabular-nums ${mutedText}`}>
                {savedCards.length > 0
                  ? `${savedCards.length} saved on this device`
                  : ""}
              </span>
            </div>

            {savedCards.length === 0 ? (
              <div
                className={`rounded-[20px] border-2 border-dashed p-10 text-center space-y-3 ${borderLine} ${mutedText}`}
              >
                <p className="text-sm sm:text-base">
                  No saved cards yet. Create a card and tap Save to My Cards.
                </p>
                <button
                  type="button"
                  onClick={() => setView("studio")}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm inline-flex items-center gap-1.5 cursor-pointer ${accentBtn}`}
                >
                  <Plus size={15} />
                  <span>Create a card</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {savedCards.map((rec) => {
                  const T = TYPES[rec.type];
                  if (!T) return null;
                  const cardObj: RenderCardData = {
                    type: rec.type,
                    theme: rec.theme,
                    f: rec.f,
                    photoImg: savedCardThumbs[rec.id] || null,
                    opts: rec.opts || { logo: true, qr: true },
                    id: rec.id,
                  };
                  return (
                    <div
                      key={rec.id}
                      className={`rounded-[18px] border p-2.5 flex flex-col gap-2.5 min-w-0 ${surface}`}
                    >
                      <button
                        type="button"
                        onClick={() => void handleEditSavedCard(rec)}
                        className={`rounded-[11px] overflow-hidden grid place-items-center cursor-pointer ${surfaceMuted} ${
                          T.wide ? "aspect-[16/10]" : "aspect-[4/5]"
                        }`}
                      >
                        <CardThumbCanvas
                          card={cardObj}
                          fontsReady={fontsReady}
                          logoImg={logoImg}
                          className="max-w-full max-h-full block"
                        />
                      </button>

                      <div className="px-1">
                        <div className="text-sm font-bold truncate">
                          {nameOfCard(rec)}
                        </div>
                        <div className={`text-xs truncate ${mutedText}`}>
                          {T.n} · {new Date(rec.ts).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => void handleEditSavedCard(rec)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${surface}`}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDownloadSavedCard(rec)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer ${surface}`}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedCard(rec.id)}
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold text-[#e4372f] cursor-pointer inline-flex items-center gap-1 ${surface}`}
                        >
                          <Trash2 size={12} />
                          <span>
                            {armedDeleteId === rec.id
                              ? "Tap again to delete"
                              : "Delete"}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {view === "scan" && (
          <div className="space-y-5">
            <div className="flex items-end justify-between gap-3 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                Scan a QR code
              </h2>
              <span className={`text-sm ${mutedText}`}>
                Upload a photo or screenshot of a GAMURA QR code
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[420px_minmax(0,1fr)] gap-5 items-start">
              <div className="space-y-3">
                <label
                  htmlFor="gg-qr-in"
                  onDragEnter={(e) => {
                    e.preventDefault();
                    setDropActive(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDropActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDropActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropActive(false);
                    const file = e.dataTransfer?.files?.[0];
                    if (file) void scanFile(file);
                  }}
                  className={`block rounded-[20px] border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                    dropActive
                      ? `border-[#2f5bea] ${surfaceMuted}`
                      : `${borderLine} ${surface}`
                  }`}
                >
                  <Upload size={26} className="mx-auto mb-2 opacity-75" />
                  <b className="block text-base mb-1">Choose a QR image</b>
                  <span className={`text-sm ${mutedText}`}>
                    Drop an image here, or tap to pick one from your device
                  </span>
                </label>
                <input
                  id="gg-qr-in"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (f) void scanFile(f);
                  }}
                  className="hidden"
                />
                <p className={`text-xs sm:text-sm leading-relaxed ${mutedText}`}>
                  Your phone camera also reads these codes directly: contact cards
                  offer to save the contact, greetings show the message.
                </p>
              </div>

              <div className={`rounded-[20px] border p-5 space-y-4 ${surface}`}>
                {scanBusy ? (
                  <div className="py-12 text-center text-sm font-medium">
                    Reading QR code…
                  </div>
                ) : scanError ? (
                  <div
                    className={`rounded-2xl border-2 border-dashed p-10 text-center text-sm ${borderLine} ${mutedText}`}
                  >
                    {scanError}
                  </div>
                ) : scanRaw !== null ? (
                  <div className="space-y-4">
                    <h3 className="text-base font-bold">
                      {scanCard ? "GAMURA card found" : "QR code content"}
                    </h3>

                    {scanCard && (
                      <>
                        <div
                          style={{
                            backgroundImage: dark
                              ? "repeating-conic-gradient(#1f2440 0 25%, #0d1020 0 50%)"
                              : "repeating-conic-gradient(#eef1fa 0 25%, #f4f6fc 0 50%)",
                            backgroundSize: "22px 22px",
                          }}
                          className="rounded-2xl p-4 grid place-items-center"
                        >
                          <canvas
                            ref={scanCanvasRef}
                            className="max-w-full max-h-[420px] w-auto h-auto rounded-md shadow-lg"
                          />
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDraftCache((prev) => ({
                                ...prev,
                                [cardType]: { f: { ...fields }, theme },
                              }));
                              setCardType(scanCard.type);
                              setFields({ ...scanCard.f });
                              setTheme(scanCard.theme);
                              setPhotoDataUrl(null);
                              setPhotoImg(null);
                              setEditingId(null);
                              setSide(0);
                              setView("studio");
                            }}
                            className={`px-4 py-2 rounded-xl font-semibold text-sm cursor-pointer ${accentBtn}`}
                          >
                            Edit this card
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const c2 = document.createElement("canvas");
                              renderCardToCanvas(
                                c2,
                                scanCard,
                                0,
                                qrForCard(scanCard).qr,
                                logoImg,
                              );
                              triggerDownloadCanvas(
                                c2,
                                `gamura-scanned-${scanCard.type}.png`,
                              );
                            }}
                            className={`px-4 py-2 rounded-xl border font-semibold text-sm cursor-pointer ${surface}`}
                          >
                            Download
                          </button>

                          <button
                            type="button"
                            onClick={() => void handleCopyText(scanRaw)}
                            className={`px-4 py-2 rounded-xl border font-semibold text-sm cursor-pointer ${surface}`}
                          >
                            Copy text
                          </button>
                        </div>
                      </>
                    )}

                    {/^https:\/\//i.test(scanRaw) && (
                      <a
                        href={scanRaw}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2f5bea] dark:text-[#7b97ff] break-all hover:underline"
                      >
                        <span>{scanRaw}</span>
                        <ExternalLink size={14} />
                      </a>
                    )}

                    <pre
                      className={`whitespace-pre-wrap break-words rounded-xl p-3.5 text-xs sm:text-sm ${surfaceMuted}`}
                    >
                      {scanRaw}
                    </pre>
                  </div>
                ) : (
                  <div
                    className={`rounded-2xl border-2 border-dashed p-10 text-center text-sm ${borderLine} ${mutedText}`}
                  >
                    The scanned card appears here.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className={`text-center text-xs py-6 px-4 ${mutedText}`}>
        GAMURA Greetings · Cards are made in your browser. Photos never leave your
        device.
      </footer>

      {/* Mobile Bottom Tabbar */}
      <nav
        aria-label="Mobile navigation"
        className={`md:hidden fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-xl grid grid-cols-4 gap-1 px-2 py-1.5 ${
          dark
            ? "bg-[#0d1020]/90 border-[#2b3153]"
            : "bg-[#f4f6fc]/90 border-[#dde2f0]"
        }`}
      >
        {(
          [
            { id: "home" as const, label: "Home", Icon: Home },
            { id: "studio" as const, label: "Create", Icon: Plus },
            { id: "cards" as const, label: "My Cards", Icon: Gift },
            { id: "scan" as const, label: "Scan QR", Icon: ScanLine },
          ] as const
        ).map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`py-2 px-1 rounded-xl text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-colors ${
                active
                  ? dark
                    ? "bg-[#eef0fb] text-[#0d1020]"
                    : "bg-[#12162b] text-[#f4f6fc]"
                  : mutedText
              }`}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Fallback Image Modal */}
      {previewModal && (
        <div
          onClick={() => setPreviewModal(null)}
          className="fixed inset-0 z-50 bg-black/75 grid place-items-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`rounded-[20px] p-5 max-w-md w-full text-center space-y-3 border ${surface}`}
          >
            <p className="text-sm font-medium">{previewModal.msg}</p>
            <img
              src={previewModal.url}
              alt="Card export preview"
              className="max-w-full max-h-[65vh] mx-auto rounded-lg"
            />
            <div className="flex justify-center gap-2 pt-1">
              <a
                href={previewModal.url}
                download={previewModal.filename}
                className={`px-4 py-2 rounded-xl text-sm font-semibold ${accentBtn}`}
              >
                Download PNG
              </a>
              <button
                type="button"
                onClick={() => setPreviewModal(null)}
                className={`px-4 py-2 rounded-xl border text-sm font-semibold cursor-pointer ${surface}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 -translate-x-1/2 bottom-20 md:bottom-6 z-50 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg pointer-events-none ${
            dark
              ? "bg-[#eef0fb] text-[#0d1020]"
              : "bg-[#12162b] text-[#f4f6fc]"
          }`}
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
