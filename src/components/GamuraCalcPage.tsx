import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  Atom,
  BarChart3,
  Binary,
  Calculator,
  Cake,
  Calendar,
  Clock,
  Coins,
  Copy,
  Delete,
  FlaskConical,
  Gauge,
  Globe,
  HardDrive,
  History,
  KeyRound,
  Landmark,
  LineChart,
  Percent,
  Receipt,
  RotateCcw,
  Ruler,
  Scale,
  Sigma,
  Square,
  Tag,
  Thermometer,
  Trash2,
  TrendingUp,
  Utensils,
  Weight,
  X,
} from "lucide-react";
import {
  BUILTIN_STORE_APPS,
  GAMURA_CALC_LOGO_FALLBACK,
  GAMURA_CALC_LOGO_URL,
  UNIVERSE_APPS_EVENT,
  UNIVERSE_APPS_KEY,
  addAppToUniverse,
  readStoreJson,
  removeAppFromUniverse,
  type StoreAppItem,
} from "../utils/gamuraStoreApps";

type CalcTab = "calc" | "convert" | "finance" | "lab";

interface HistoryEntry {
  e: string;
  r: string;
}

interface FieldSpec {
  id: string;
  label: string;
  type: "number" | "date" | "text" | "sel";
  defaultValue: string | number;
  options?: string[];
}

interface ToolSpec {
  id: string;
  name: string;
  tab: "convert" | "finance" | "lab";
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  note?: string;
  big?: boolean;
  custom?: "graph" | "constants";
  fields?: FieldSpec[];
  compute?: (vals: Record<string, string | number>) => [string, string | number][];
}

const HISTORY_STORAGE_KEY = "gc_h2";

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Plus Jakarta Sans", system-ui, sans-serif',
};

/* ---------- Scientific Expression Evaluator ---------- */
function factorial(v: number): number {
  if (v < 0 || v % 1 !== 0 || v > 170) throw new Error("Domain");
  let r = 1;
  for (let i = 2; i <= v; i++) r *= i;
  return r;
}

function tokenize(src: string): string[] {
  const normalized = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-");
  const tokens: string[] = [];
  const re = /\d+\.?\d*(?:e[+-]?\d+)?|\.\d+|[a-z]+|[+\-*/^()!%√∛πℯ]/y;
  let i = 0;
  while (i < normalized.length) {
    re.lastIndex = i;
    const m = re.exec(normalized);
    if (!m) throw new Error("Token");
    tokens.push(m[0]);
    i = re.lastIndex;
  }
  return tokens;
}

function evalExpression(
  source: string,
  isDeg: boolean,
  vars?: { x?: number },
): number {
  let src = source;
  const openCount = (src.match(/\(/g) || []).length;
  const closeCount = (src.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    src += ")".repeat(openCount - closeCount);
  }
  const tokens = tokenize(src);
  let pos = 0;
  const pk = () => tokens[pos];
  const nx = () => tokens[pos++];

  const toRad = (x: number) => (isDeg ? (x * Math.PI) / 180 : x);
  const fromRad = (r: number) => (isDeg ? (r * 180) / Math.PI : r);
  const fns: Record<string, (x: number) => number> = {
    sin: (x) => Math.sin(toRad(x)),
    cos: (x) => Math.cos(toRad(x)),
    tan: (x) => Math.tan(toRad(x)),
    asin: (x) => fromRad(Math.asin(x)),
    acos: (x) => fromRad(Math.acos(x)),
    atan: (x) => fromRad(Math.atan(x)),
    ln: Math.log,
    lg: Math.log10,
    "√": Math.sqrt,
    "∛": Math.cbrt,
    abs: Math.abs,
  };

  const add = (): number => {
    let v = term();
    while (pk() === "+" || pk() === "-") {
      const o = nx();
      const r = term();
      v = o === "+" ? v + r : v - r;
    }
    return v;
  };

  const term = (): number => {
    let v = unary();
    for (;;) {
      const k = pk();
      if (k === "*" || k === "/") {
        nx();
        const r = unary();
        v = k === "*" ? v * r : v / r;
      } else if (k && /^[\d.a-zπℯ√∛(]/.test(k)) {
        v *= unary();
      } else {
        break;
      }
    }
    return v;
  };

  const unary = (): number => {
    if (pk() === "-") {
      nx();
      return -unary();
    }
    if (pk() === "+") {
      nx();
      return unary();
    }
    return power();
  };

  const power = (): number => {
    const base = postfix();
    if (pk() === "^") {
      nx();
      return Math.pow(base, unary());
    }
    return base;
  };

  const postfix = (): number => {
    let v = primary();
    while (pk() === "!" || pk() === "%") {
      v = nx() === "!" ? factorial(v) : v / 100;
    }
    return v;
  };

  const primary = (): number => {
    const k = nx();
    if (k === undefined) throw new Error("EOF");
    if (k === "(") {
      const v = add();
      if (nx() !== ")") throw new Error("Paren");
      return v;
    }
    if (k === "π") return Math.PI;
    if (k === "ℯ") return Math.E;
    if (k === "x" && vars && vars.x !== undefined) return vars.x;
    if (/^[\d.]/.test(k)) return parseFloat(k);
    const fn = fns[k];
    if (!fn || nx() !== "(") throw new Error("Fn");
    const arg = add();
    if (nx() !== ")") throw new Error("FnParen");
    const res = fn(arg);
    return Math.abs(res) < 1e-14 ? 0 : res;
  };

  const result = add();
  if (pos < tokens.length || !Number.isFinite(result)) {
    throw new Error("Invalid");
  }
  return result;
}

function fmtNum(n: number): string {
  if (n === 0) return "0";
  if (Math.abs(n) >= 1e15 || Math.abs(n) < 1e-9) {
    return n.toExponential(8).replace(/\.?0+e/, "e");
  }
  return String(parseFloat(n.toPrecision(12)));
}

/* ---------- Tool Helpers ---------- */
const ck = (...nums: number[]) => {
  for (const x of nums) {
    if (!Number.isFinite(x)) throw new Error("Invalid");
  }
};

const money = (n: number): string => {
  ck(n);
  return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
};

const todayIso = () => new Date().toLocaleDateString("en-CA");

const parseIsoDate = (s: string): Date => {
  const [a, b, c] = String(s).split("-").map(Number);
  if (!a || !b || !c) throw new Error("Date");
  return new Date(a, b - 1, c);
};

const diffYmd = (a: Date, b: Date): [number, number, number] => {
  let y = b.getFullYear() - a.getFullYear();
  let m = b.getMonth() - a.getMonth();
  let d = b.getDate() - a.getDate();
  if (d < 0) {
    m--;
    d += new Date(b.getFullYear(), b.getMonth(), 0).getDate();
  }
  if (m < 0) {
    y--;
    m += 12;
  }
  return [y, m, d];
};

const fmtDateStr = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const numField = (id: string, label: string, defaultValue: number): FieldSpec => ({
  id,
  label,
  type: "number",
  defaultValue,
});

function makeUnitTool(
  id: string,
  name: string,
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>,
  units: Record<string, number>,
  defaultKey: string,
): ToolSpec {
  const keys = Object.keys(units);
  return {
    id,
    name,
    tab: "convert",
    icon,
    fields: [
      numField("v", "Value", 1),
      {
        id: "u",
        label: "From",
        type: "sel",
        options: keys,
        defaultValue: defaultKey || keys[0],
      },
    ],
    compute: (v) => {
      const val = Number(v.v);
      const fromUnit = String(v.u);
      ck(val);
      return keys.map((k) => [k, fmtNum((val * units[fromUnit]) / units[k])]);
    },
  };
}

const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  INR: 94.3,
  EUR: 0.915,
  GBP: 0.78,
  JPY: 150,
  AED: 3.6725,
  AUD: 1.52,
  CAD: 1.38,
  CNY: 7.2,
  SGD: 1.34,
};
const CURRENCY_KEYS = Object.keys(CURRENCY_RATES);

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

const PHYSICS_CONSTANTS: [string, string, string][] = [
  ["Speed of light (c)", "299792458", "m/s"],
  ["Gravity (g)", "9.80665", "m/s²"],
  ["Gravitational (G)", "6.6743e-11", "N m²/kg²"],
  ["Planck (h)", "6.62607015e-34", "J s"],
  ["Avogadro (Nₐ)", "6.02214076e23", "1/mol"],
  ["Boltzmann (k)", "1.380649e-23", "J/K"],
  ["Gas constant (R)", "8.314462618", "J/mol K"],
  ["Electron charge (e)", "1.602176634e-19", "C"],
  ["Electron mass", "9.1093837e-31", "kg"],
  ["Atmosphere", "101325", "Pa"],
];

const ALL_TOOLS: ToolSpec[] = [
  /* CONVERT (13) */
  {
    id: "Age",
    name: "Age",
    tab: "convert",
    icon: Cake,
    fields: [
      { id: "b", label: "Date of birth", type: "date", defaultValue: "2000-01-01" },
      { id: "t", label: "Today", type: "date", defaultValue: todayIso() },
    ],
    compute: (v) => {
      const b = parseIsoDate(String(v.b));
      const t = parseIsoDate(String(v.t));
      if (b > t) throw new Error("Order");
      const [y, m, d] = diffYmd(b, t);
      const nb = new Date(t.getFullYear(), b.getMonth(), b.getDate());
      if (nb < t) nb.setFullYear(nb.getFullYear() + 1);
      const dy = Math.round((t.getTime() - b.getTime()) / 864e5);
      return [
        ["Age", `${y} years ${m} months ${d} days`],
        ["Next birthday", `${fmtDateStr(nb)} (${Math.round((nb.getTime() - t.getTime()) / 864e5)} days)`],
        ["Months", y * 12 + m],
        ["Weeks", Math.floor(dy / 7)],
        ["Days", dy],
        ["Hours", dy * 24],
        ["Minutes", dy * 1440],
      ];
    },
  },
  makeUnitTool(
    "Area",
    "Area",
    Square,
    {
      "m²": 1,
      "km²": 1e6,
      ha: 1e4,
      "cm²": 1e-4,
      "mm²": 1e-6,
      "ft²": 0.09290304,
      "in²": 6.4516e-4,
      "yd²": 0.83612736,
      acre: 4046.8564224,
      "mi²": 2589988.110336,
    },
    "m²",
  ),
  {
    id: "BMI",
    name: "BMI",
    tab: "convert",
    icon: Scale,
    big: true,
    fields: [numField("h", "Height (cm)", 170), numField("w", "Weight (kg)", 65)],
    compute: (v) => {
      const h = Number(v.h);
      const w = Number(v.w);
      ck(h, w);
      if (h <= 0 || w <= 0) throw new Error("Positive");
      const b = w / Math.pow(h / 100, 2);
      const cat =
        b < 18.5
          ? "Underweight"
          : b < 25
            ? "Normal"
            : b < 30
              ? "Overweight"
              : "Obese";
      return [
        ["BMI", b.toFixed(1)],
        ["Category", cat],
        [
          "Healthy weight range",
          `${(18.5 * Math.pow(h / 100, 2)).toFixed(1)} - ${(24.9 * Math.pow(h / 100, 2)).toFixed(1)} kg`,
        ],
      ];
    },
  },
  makeUnitTool(
    "Data",
    "Data",
    HardDrive,
    {
      bit: 0.125,
      B: 1,
      KB: 1024,
      MB: 1048576,
      GB: 1073741824,
      TB: 1099511627776,
      PB: 1125899906842624,
    },
    "GB",
  ),
  {
    id: "Date",
    name: "Date",
    tab: "convert",
    icon: Calendar,
    fields: [
      { id: "a", label: "From", type: "date", defaultValue: todayIso() },
      { id: "b", label: "To", type: "date", defaultValue: todayIso() },
      numField("n", "Add or subtract days", 30),
    ],
    compute: (v) => {
      const a = parseIsoDate(String(v.a));
      const b = parseIsoDate(String(v.b));
      const [x, y] = a <= b ? [a, b] : [b, a];
      const [Y, M, D] = diffYmd(x, y);
      const n = Math.round((y.getTime() - x.getTime()) / 864e5);
      const k = Number(v.n) || 0;
      const r = new Date(a);
      r.setDate(r.getDate() + k);
      return [
        ["Difference", `${n} days`],
        ["In weeks", `${Math.floor(n / 7)} weeks ${n % 7} days`],
        ["Calendar", `${Y} y ${M} m ${D} d`],
        [`From date ${k >= 0 ? "+ " : "- "}${Math.abs(k)} days`, fmtDateStr(r)],
      ];
    },
  },
  {
    id: "Discount",
    name: "Discount",
    tab: "convert",
    icon: Tag,
    big: true,
    fields: [
      numField("p", "Price", 1000),
      numField("d", "Discount %", 20),
      numField("t", "Tax %", 0),
    ],
    compute: (v) => {
      const p = Number(v.p);
      const d = Number(v.d);
      const t = Number(v.t);
      ck(p, d, t);
      const s = (p * d) / 100;
      const a = p - s;
      const tx = (a * t) / 100;
      return [
        ["Final price", money(a + tx)],
        ["You save", money(s)],
        ["Price after discount", money(a)],
        ["Tax", money(tx)],
      ];
    },
  },
  makeUnitTool(
    "Length",
    "Length",
    Ruler,
    {
      mm: 0.001,
      cm: 0.01,
      m: 1,
      km: 1000,
      in: 0.0254,
      ft: 0.3048,
      yd: 0.9144,
      mi: 1609.344,
      nmi: 1852,
    },
    "m",
  ),
  makeUnitTool(
    "Mass",
    "Mass",
    Weight,
    {
      mg: 1e-6,
      g: 0.001,
      kg: 1,
      t: 1000,
      oz: 0.028349523,
      lb: 0.45359237,
      st: 6.35029318,
    },
    "kg",
  ),
  {
    id: "Numeral",
    name: "Numeral system",
    tab: "convert",
    icon: Binary,
    fields: [
      { id: "n", label: "Value", type: "text", defaultValue: "255" },
      {
        id: "b",
        label: "Base",
        type: "sel",
        options: ["2", "8", "10", "16"],
        defaultValue: "10",
      },
    ],
    compute: (v) => {
      const base = Number(v.b);
      const raw = String(v.n).trim();
      if (!raw) throw new Error("Empty");
      const x = parseInt(raw, base);
      if (Number.isNaN(x) || x < 0) throw new Error("Base");
      return [
        ["Binary (2)", x.toString(2)],
        ["Octal (8)", x.toString(8)],
        ["Decimal (10)", x.toString(10)],
        ["Hex (16)", x.toString(16).toUpperCase()],
      ];
    },
  },
  makeUnitTool(
    "Speed",
    "Speed",
    Gauge,
    {
      "m/s": 1,
      "km/h": 1 / 3.6,
      mph: 0.44704,
      kn: 0.514444,
      "ft/s": 0.3048,
      Mach: 340.29,
    },
    "km/h",
  ),
  {
    id: "Temperature",
    name: "Temperature",
    tab: "convert",
    icon: Thermometer,
    fields: [
      numField("v", "Value", 25),
      {
        id: "u",
        label: "From",
        type: "sel",
        options: ["°C", "°F", "K"],
        defaultValue: "°C",
      },
    ],
    compute: (v) => {
      const val = Number(v.v);
      ck(val);
      const u = String(v.u);
      const c = u === "°F" ? ((val - 32) * 5) / 9 : u === "K" ? val - 273.15 : val;
      return [
        ["°C", fmtNum(c)],
        ["°F", fmtNum((c * 9) / 5 + 32)],
        ["K", fmtNum(c + 273.15)],
      ];
    },
  },
  makeUnitTool(
    "Time",
    "Time",
    Clock,
    {
      ms: 0.001,
      s: 1,
      min: 60,
      h: 3600,
      day: 86400,
      week: 604800,
      month: 2629746,
      year: 31556952,
    },
    "h",
  ),
  makeUnitTool(
    "Volume",
    "Volume",
    FlaskConical,
    {
      mL: 0.001,
      L: 1,
      "m³": 1000,
      tsp: 0.00492892,
      tbsp: 0.0147868,
      "fl oz": 0.0295735,
      cup: 0.236588,
      pint: 0.473176,
      gal: 3.78541,
    },
    "L",
  ),

  /* FINANCE (4) */
  {
    id: "Currency",
    name: "Currency",
    tab: "finance",
    icon: ArrowLeftRight,
    note: "Offline reference rates. Edit any rate below to match live market prices.",
    fields: [
      numField("a", "Amount", 1),
      {
        id: "u",
        label: "From",
        type: "sel",
        options: CURRENCY_KEYS,
        defaultValue: "INR",
      },
      ...CURRENCY_KEYS.filter((k) => k !== "USD").map((k) =>
        numField(`r_${k}`, `1 USD in ${k}`, CURRENCY_RATES[k]),
      ),
    ],
    compute: (v) => {
      const amt = Number(v.a);
      const from = String(v.u);
      ck(amt);
      const rateOf = (k: string) => (k === "USD" ? 1 : Number(v[`r_${k}`]));
      CURRENCY_KEYS.forEach((k) => ck(rateOf(k)));
      return CURRENCY_KEYS.map((k) => [
        k,
        ((amt / rateOf(from)) * rateOf(k)).toLocaleString("en-US", {
          maximumFractionDigits: 4,
        }),
      ]);
    },
  },
  {
    id: "GST",
    name: "GST",
    tab: "finance",
    icon: Receipt,
    big: true,
    fields: [
      numField("a", "Amount", 1000),
      {
        id: "r",
        label: "GST rate %",
        type: "sel",
        options: ["3", "5", "12", "18", "28"],
        defaultValue: "18",
      },
      {
        id: "m",
        label: "Mode",
        type: "sel",
        options: ["Add GST", "Remove GST"],
        defaultValue: "Add GST",
      },
    ],
    compute: (v) => {
      const amt = Number(v.a);
      ck(amt);
      const rate = Number(v.r);
      let base: number;
      let gst: number;
      let total: number;
      if (v.m === "Add GST") {
        base = amt;
        gst = (base * rate) / 100;
        total = base + gst;
      } else {
        total = amt;
        base = total / (1 + rate / 100);
        gst = total - base;
      }
      return [
        ["Total amount", money(total)],
        ["Net amount", money(base)],
        ["GST", money(gst)],
        ["CGST", money(gst / 2)],
        ["SGST", money(gst / 2)],
      ];
    },
  },
  {
    id: "Investment",
    name: "Investment",
    tab: "finance",
    icon: TrendingUp,
    big: true,
    fields: [
      numField("p", "Lump sum", 100000),
      numField("m", "Monthly SIP", 5000),
      numField("r", "Return % per year", 12),
      numField("y", "Years", 10),
    ],
    compute: (v) => {
      const p = Number(v.p);
      const m = Number(v.m);
      const rPct = Number(v.r);
      const y = Number(v.y);
      ck(p, m, rPct, y);
      const r = rPct / 1200;
      const n = y * 12;
      const g = Math.pow(1 + r, n);
      const fl = p * g;
      const fs = r ? m * ((g - 1) / r) * (1 + r) : m * n;
      const inv = p + m * n;
      return [
        ["Future value", money(fl + fs)],
        ["Invested amount", money(inv)],
        ["Estimated returns", money(fl + fs - inv)],
      ];
    },
  },
  {
    id: "Loan",
    name: "Loan",
    tab: "finance",
    icon: Landmark,
    big: true,
    fields: [
      numField("a", "Loan amount", 1000000),
      numField("r", "Interest % per year", 9),
      numField("y", "Tenure (years)", 5),
    ],
    compute: (v) => {
      const a = Number(v.a);
      const rPct = Number(v.r);
      const y = Number(v.y);
      ck(a, rPct, y);
      const r = rPct / 1200;
      const n = y * 12;
      if (n <= 0) throw new Error("Tenure");
      const emi = r
        ? (a * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        : a / n;
      return [
        ["Monthly EMI", money(emi)],
        ["Total interest", money(emi * n - a)],
        ["Total payment", money(emi * n)],
        ["Number of EMIs", n],
      ];
    },
  },

  /* LAB (8) */
  {
    id: "Graph",
    name: "Graph",
    tab: "lab",
    icon: LineChart,
    custom: "graph",
  },
  {
    id: "Quadratic",
    name: "Quadratic",
    tab: "lab",
    icon: Sigma,
    big: true,
    fields: [numField("a", "a (x²)", 1), numField("b", "b (x)", -3), numField("c", "c", 2)],
    compute: (v) => {
      const a = Number(v.a);
      const b = Number(v.b);
      const c = Number(v.c);
      ck(a, b, c);
      if (!a) throw new Error("a=0");
      const D = b * b - 4 * a * c;
      const vx = -b / (2 * a);
      const vy = a * vx * vx + b * vx + c;
      const roots: [string, string | number][] =
        D >= 0
          ? [
              ["Root x₁", fmtNum((-b + Math.sqrt(D)) / (2 * a))],
              ["Root x₂", fmtNum((-b - Math.sqrt(D)) / (2 * a))],
            ]
          : [
              ["Root x₁", `${fmtNum(vx)} + ${fmtNum(Math.abs(Math.sqrt(-D) / (2 * a)))}i`],
              ["Root x₂", `${fmtNum(vx)} − ${fmtNum(Math.abs(Math.sqrt(-D) / (2 * a)))}i`],
            ];
      return [
        ...roots,
        ["Discriminant", fmtNum(D)],
        ["Vertex", `(${fmtNum(vx)}, ${fmtNum(vy)})`],
      ];
    },
  },
  {
    id: "Simultaneous",
    name: "2 Equations",
    tab: "lab",
    icon: Calculator,
    note: "Solve a₁x + b₁y = c₁ and a₂x + b₂y = c₂.",
    big: true,
    fields: [
      numField("a1", "a₁", 2),
      numField("b1", "b₁", 1),
      numField("c1", "c₁", 5),
      numField("a2", "a₂", 1),
      numField("b2", "b₂", -1),
      numField("c2", "c₂", 1),
    ],
    compute: (v) => {
      const a1 = Number(v.a1);
      const b1 = Number(v.b1);
      const c1 = Number(v.c1);
      const a2 = Number(v.a2);
      const b2 = Number(v.b2);
      const c2 = Number(v.c2);
      ck(a1, b1, c1, a2, b2, c2);
      const d = a1 * b2 - a2 * b1;
      if (!d) return [["No unique solution", ""]];
      return [
        ["x", fmtNum((c1 * b2 - c2 * b1) / d)],
        ["y", fmtNum((a1 * c2 - a2 * c1) / d)],
        ["Determinant", fmtNum(d)],
      ];
    },
  },
  {
    id: "Statistics",
    name: "Statistics",
    tab: "lab",
    icon: BarChart3,
    note: "Separate numbers with commas or spaces.",
    big: true,
    fields: [
      { id: "l", label: "Numbers", type: "text", defaultValue: "4, 8, 15, 16, 23, 42" },
    ],
    compute: (v) => {
      const nums = String(v.l)
        .split(/[\s,;]+/)
        .filter(Boolean)
        .map(Number);
      if (!nums.length || nums.some((x) => Number.isNaN(x))) throw new Error("List");
      const n = nums.length;
      const sum = nums.reduce((a, b) => a + b, 0);
      const mean = sum / n;
      const sorted = [...nums].sort((a, b) => a - b);
      const median =
        n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
      const ss = nums.reduce((a, b) => a + (b - mean) * (b - mean), 0);
      const counts: Record<number, number> = {};
      nums.forEach((x) => {
        counts[x] = (counts[x] || 0) + 1;
      });
      const maxCount = Math.max(...Object.values(counts));
      const mode =
        maxCount > 1
          ? Object.keys(counts)
              .filter((k) => counts[Number(k)] === maxCount)
              .join(", ")
          : "none";
      return [
        ["Mean", fmtNum(mean)],
        ["Median", fmtNum(median)],
        ["Mode", mode],
        ["Count", n],
        ["Sum", fmtNum(sum)],
        ["Min / Max", `${fmtNum(sorted[0])} / ${fmtNum(sorted[n - 1])}`],
        ["Range", fmtNum(sorted[n - 1] - sorted[0])],
        ["Std dev (population)", fmtNum(Math.sqrt(ss / n))],
        ["Std dev (sample)", n > 1 ? fmtNum(Math.sqrt(ss / (n - 1))) : "-"],
        ["Variance (population)", fmtNum(ss / n)],
      ];
    },
  },
  {
    id: "Percentage",
    name: "Percentage",
    tab: "lab",
    icon: Percent,
    big: true,
    fields: [numField("x", "X", 20), numField("y", "Y", 150)],
    compute: (v) => {
      const x = Number(v.x);
      const y = Number(v.y);
      ck(x, y);
      return [
        [`${x}% of ${y}`, fmtNum((x * y) / 100)],
        [`${x} is what % of ${y}`, y ? `${fmtNum((x / y) * 100)}%` : "-"],
        [`Change from ${x} to ${y}`, x ? `${fmtNum(((y - x) / x) * 100)}%` : "-"],
      ];
    },
  },
  {
    id: "GCD",
    name: "GCD, LCM, Primes",
    tab: "lab",
    icon: KeyRound,
    big: true,
    fields: [numField("a", "Number A", 84), numField("b", "Number B", 36)],
    compute: (v) => {
      const a = Number(v.a);
      const b = Number(v.b);
      ck(a, b);
      if (
        a < 1 ||
        b < 1 ||
        a % 1 !== 0 ||
        b % 1 !== 0 ||
        a > 1e12 ||
        b > 1e12
      ) {
        throw new Error("Int");
      }
      let n = a;
      const factors: number[] = [];
      for (let p = 2; p * p <= n; p++) {
        while (n % p === 0) {
          factors.push(p);
          n /= p;
        }
      }
      if (n > 1) factors.push(n);
      const g = gcd(a, b);
      return [
        ["GCD (HCF)", g],
        ["LCM", fmtNum((a / g) * b)],
        [
          `Prime factors of ${a}`,
          factors.length === 1 && factors[0] === a
            ? `${a} is prime`
            : factors.join(" × ") || "1",
        ],
      ];
    },
  },
  {
    id: "Tip",
    name: "Tip and Split",
    tab: "lab",
    icon: Utensils,
    big: true,
    fields: [
      numField("b", "Bill", 1200),
      numField("t", "Tip %", 10),
      numField("p", "People", 4),
    ],
    compute: (v) => {
      const b = Number(v.b);
      const t = Number(v.t);
      const p = Number(v.p);
      ck(b, t, p);
      if (p < 1) throw new Error("People");
      const tip = (b * t) / 100;
      const tot = b + tip;
      return [
        ["Each person pays", money(tot / p)],
        ["Tip", money(tip)],
        ["Total", money(tot)],
      ];
    },
  },
  {
    id: "Constants",
    name: "Constants",
    tab: "lab",
    icon: Atom,
    custom: "constants",
  },
];

/* ---------- Keypad Definition ---------- */
type KeyKind = "fn" | "ac" | "op" | "eq" | "num";
interface KeySpec {
  id: string;
  label: string;
  kind: KeyKind;
  altId?: string;
  altLabel?: string;
}

const KEYPAD: KeySpec[] = [
  { id: "2nd", label: "2nd", kind: "fn" },
  { id: "deg", label: "deg", kind: "fn" },
  { id: "sin", label: "sin", kind: "fn", altId: "asin", altLabel: "sin⁻¹" },
  { id: "cos", label: "cos", kind: "fn", altId: "acos", altLabel: "cos⁻¹" },
  { id: "tan", label: "tan", kind: "fn", altId: "atan", altLabel: "tan⁻¹" },

  { id: "xʸ", label: "xʸ", kind: "fn", altId: "x²", altLabel: "x²" },
  { id: "lg", label: "lg", kind: "fn", altId: "10ˣ", altLabel: "10ˣ" },
  { id: "ln", label: "ln", kind: "fn", altId: "eˣ", altLabel: "eˣ" },
  { id: "(", label: "(", kind: "fn" },
  { id: ")", label: ")", kind: "fn" },

  { id: "√", label: "√", kind: "fn", altId: "∛", altLabel: "∛" },
  { id: "AC", label: "AC", kind: "ac" },
  { id: "⌫", label: "⌫", kind: "ac" },
  { id: "%", label: "%", kind: "ac" },
  { id: "÷", label: "÷", kind: "op" },

  { id: "x!", label: "x!", kind: "fn", altId: "abs", altLabel: "|x|" },
  { id: "7", label: "7", kind: "num" },
  { id: "8", label: "8", kind: "num" },
  { id: "9", label: "9", kind: "num" },
  { id: "×", label: "×", kind: "op" },

  { id: "1/x", label: "1/x", kind: "fn", altId: "x³", altLabel: "x³" },
  { id: "4", label: "4", kind: "num" },
  { id: "5", label: "5", kind: "num" },
  { id: "6", label: "6", kind: "num" },
  { id: "−", label: "−", kind: "op" },

  { id: "π", label: "π", kind: "fn" },
  { id: "1", label: "1", kind: "num" },
  { id: "2", label: "2", kind: "num" },
  { id: "3", label: "3", kind: "num" },
  { id: "+", label: "+", kind: "op" },

  { id: "±", label: "±", kind: "fn" },
  { id: "ℯ", label: "ℯ", kind: "fn" },
  { id: "0", label: "0", kind: "num" },
  { id: ".", label: ".", kind: "num" },
  { id: "=", label: "=", kind: "eq" },
];

/* ---------- Interactive Graph Widget ---------- */
function GraphLabTool() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [f1, setF1] = useState("sin(x)");
  const [f2, setF2] = useState("x^2/4");
  const viewRef = useRef({ cx: 0, cy: 0, s: 44 });
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [cursorReadout, setCursorReadout] = useState("Drag canvas to pan · Scroll to zoom");

  const safeEvalX = useCallback((src: string, x: number): number => {
    try {
      return evalExpression(src, false, { x });
    } catch {
      return NaN;
    }
  }, []);

  const drawGraph = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const rect = cv.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(rect.width * dpr);
    cv.height = Math.round(rect.height * dpr);
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = rect.width;
    const H = rect.height;
    const V = viewRef.current;
    const toX = (px: number) => (px - W / 2) / V.s + V.cx;
    const toPx = (x: number) => (x - V.cx) * V.s + W / 2;
    const toPy = (y: number) => H / 2 - (y - V.cy) * V.s;

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const tg = 60 / V.s;
    const pw = Math.pow(10, Math.floor(Math.log10(tg)));
    const st = [1, 2, 5, 10].map((m) => m * pw).find((v) => v >= tg) || 1;

    ctx.font = '11px -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif';
    ctx.fillStyle = "#8e8e93";
    ctx.strokeStyle = "#ececef";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = Math.ceil(toX(0) / st) * st; x <= toX(W); x += st) {
      const px = toPx(x);
      ctx.moveTo(px, 0);
      ctx.lineTo(px, H);
      ctx.fillText(
        fmtNum(+x.toPrecision(6)),
        px + 3,
        Math.min(H - 4, Math.max(12, toPy(0) + 13)),
      );
    }
    for (
      let y = Math.ceil((V.cy - H / 2 / V.s) / st) * st;
      y <= V.cy + H / 2 / V.s;
      y += st
    ) {
      const py = toPy(y);
      ctx.moveTo(0, py);
      ctx.lineTo(W, py);
      if (Math.abs(y) > st / 2) {
        ctx.fillText(
          fmtNum(+y.toPrecision(6)),
          Math.min(W - 34, Math.max(4, toPx(0) + 4)),
          py - 3,
        );
      }
    }
    ctx.stroke();

    // Axes
    ctx.strokeStyle = "#1c1c1e";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(toPx(0), 0);
    ctx.lineTo(toPx(0), H);
    ctx.moveTo(0, toPy(0));
    ctx.lineTo(W, toPy(0));
    ctx.stroke();

    // Plots
    const series: [string, string][] = [
      [f1.trim(), "#0071e3"],
      [f2.trim(), "#1c1c1e"],
    ];
    series.forEach(([expr, color]) => {
      if (!expr) return;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      let started = false;
      for (let px = 0; px <= W; px += 1) {
        const y = safeEvalX(expr, toX(px));
        const py = toPy(y);
        if (Number.isFinite(y) && Math.abs(py) < H * 3) {
          if (started) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
          started = true;
        } else {
          started = false;
        }
      }
      ctx.stroke();
    });
  }, [f1, f2, safeEvalX]);

  useEffect(() => {
    const id = window.setTimeout(drawGraph, 40);
    const onResize = () => drawGraph();
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("resize", onResize);
    };
  }, [drawGraph]);

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xs divide-y divide-black/[0.06] px-4">
        <label className="flex items-center justify-between gap-3 py-3">
          <span className="text-sm font-semibold text-[#0071e3] shrink-0">y₁ =</span>
          <input
            type="text"
            value={f1}
            onChange={(e) => setF1(e.target.value)}
            placeholder="sin(x)"
            className="flex-1 text-right bg-transparent outline-none text-base font-medium text-[#1c1c1e] font-mono"
          />
        </label>
        <label className="flex items-center justify-between gap-3 py-3">
          <span className="text-sm font-semibold text-[#1c1c1e] shrink-0">y₂ =</span>
          <input
            type="text"
            value={f2}
            onChange={(e) => setF2(e.target.value)}
            placeholder="x^2/4"
            className="flex-1 text-right bg-transparent outline-none text-base font-medium text-[#1c1c1e] font-mono"
          />
        </label>
      </div>

      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xs p-3 space-y-2.5">
        <canvas
          ref={canvasRef}
          onPointerDown={(e) => {
            dragRef.current = { x: e.clientX, y: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
          onPointerMove={(e) => {
            const cv = canvasRef.current;
            if (!cv) return;
            const r = cv.getBoundingClientRect();
            const V = viewRef.current;
            if (dragRef.current) {
              V.cx -= (e.clientX - dragRef.current.x) / V.s;
              V.cy += (e.clientY - dragRef.current.y) / V.s;
              dragRef.current = { x: e.clientX, y: e.clientY };
              drawGraph();
            }
            const x = (e.clientX - r.left - r.width / 2) / V.s + V.cx;
            const y1 = safeEvalX(f1, x);
            setCursorReadout(
              `x = ${fmtNum(+x.toPrecision(5))}${Number.isFinite(y1) ? `   y₁ = ${fmtNum(+y1.toPrecision(5))}` : ""}`,
            );
          }}
          onWheel={(e) => {
            e.preventDefault();
            viewRef.current.s *= e.deltaY < 0 ? 1.15 : 1 / 1.15;
            drawGraph();
          }}
          className="w-full h-[320px] sm:h-[360px] rounded-2xl touch-none block cursor-grab active:cursor-grabbing border border-black/[0.05]"
        />

        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <button
            type="button"
            onClick={() => {
              viewRef.current.s *= 1.3;
              drawGraph();
            }}
            aria-label="Zoom in"
            className="w-10 h-10 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-base font-bold text-[#1c1c1e] cursor-pointer"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              viewRef.current.s /= 1.3;
              drawGraph();
            }}
            aria-label="Zoom out"
            className="w-10 h-10 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 text-base font-bold text-[#1c1c1e] cursor-pointer"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => {
              viewRef.current = { cx: 0, cy: 0, s: 44 };
              drawGraph();
            }}
            aria-label="Reset view"
            className="w-10 h-10 rounded-full bg-[#F5F5F7] hover:bg-zinc-200/80 inline-flex items-center justify-center text-[#1c1c1e] cursor-pointer"
          >
            <RotateCcw size={15} />
          </button>
          <span className="ml-auto text-xs text-[#6E6E73] tabular-nums font-medium">
            {cursorReadout}
          </span>
        </div>
      </div>

      <p className="text-xs text-[#6E6E73] px-1">
        Drag to pan. Use <code className="font-mono">x</code> with sin, cos, tan,
        ln, lg, √, ^, π, ℯ. Angles are evaluated in radians.
      </p>
    </div>
  );
}

/* ---------- Generic Tool Runner ---------- */
function DynamicToolView({
  tool,
  onCopyToast,
}: {
  tool: ToolSpec;
  onCopyToast: (msg: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string | number>>(() => {
    const initial: Record<string, string | number> = {};
    tool.fields?.forEach((f) => {
      initial[f.id] = f.defaultValue;
    });
    return initial;
  });

  useEffect(() => {
    const reset: Record<string, string | number> = {};
    tool.fields?.forEach((f) => {
      reset[f.id] = f.defaultValue;
    });
    setValues(reset);
  }, [tool]);

  if (tool.custom === "graph") return <GraphLabTool />;

  if (tool.custom === "constants") {
    return (
      <div className="space-y-2.5">
        <p className="text-xs text-[#6E6E73] px-1">
          Tap any constant row to copy its exact value.
        </p>
        <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xs divide-y divide-black/[0.06] px-4">
          {PHYSICS_CONSTANTS.map(([name, val, unit]) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(val).catch(() => {});
                onCopyToast(`Copied ${val}`);
              }}
              className="w-full py-3.5 flex items-center justify-between gap-4 text-left hover:opacity-80 cursor-pointer"
            >
              <span className="text-sm text-[#6E6E73]">{name}</span>
              <span className="text-sm font-semibold text-[#1c1c1e] tabular-nums text-right">
                {val} {unit}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  let rows: [string, string | number][] = [];
  if (tool.compute) {
    try {
      rows = tool.compute(values);
    } catch {
      rows = [["Enter valid values", ""]];
    }
  }

  return (
    <div className="space-y-3">
      {tool.note && (
        <p className="text-xs text-[#6E6E73] px-1">{tool.note}</p>
      )}

      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xs divide-y divide-black/[0.06] px-4">
        {tool.fields?.map((f) => (
          <label
            key={f.id}
            className="flex items-center justify-between gap-3 py-3 min-h-[48px]"
          >
            <span className="text-sm text-[#6E6E73] shrink-0 max-w-[46%]">
              {f.label}
            </span>
            {f.type === "sel" ? (
              <select
                value={String(values[f.id] ?? f.defaultValue)}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.id]: e.target.value }))
                }
                className="flex-1 min-w-0 text-right bg-transparent font-medium text-base text-[#1c1c1e] outline-none cursor-pointer"
              >
                {f.options?.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type}
                inputMode={f.type === "number" ? "decimal" : undefined}
                step={f.type === "number" ? "any" : undefined}
                value={values[f.id] ?? f.defaultValue}
                onChange={(e) =>
                  setValues((prev) => ({ ...prev, [f.id]: e.target.value }))
                }
                className="flex-1 min-w-0 text-right bg-transparent font-medium text-base text-[#1c1c1e] outline-none tabular-nums"
              />
            )}
          </label>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xs divide-y divide-black/[0.06] px-4">
        {rows.map(([label, value], i) => {
          const isBig = i === 0 && tool.big;
          return (
            <button
              key={label + i}
              type="button"
              onClick={() => {
                if (value !== "" && value !== undefined) {
                  navigator.clipboard?.writeText(String(value)).catch(() => {});
                  onCopyToast(`Copied ${value}`);
                }
              }}
              className={`w-full py-3.5 text-left cursor-pointer hover:opacity-85 transition-opacity ${
                isBig
                  ? "flex flex-col items-start gap-1"
                  : "flex items-center justify-between gap-3"
              }`}
            >
              <span className="text-sm text-[#6E6E73]">{label}</span>
              <span
                className={`text-[#1c1c1e] tabular-nums break-words ${
                  isBig
                    ? "text-3xl sm:text-4xl font-light tracking-tight"
                    : "text-sm sm:text-base font-semibold text-right"
                }`}
              >
                {String(value)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ========== MAIN PAGE COMPONENT ========== */
export default function GamuraCalcPage({
  onBackHome,
}: {
  onBackHome: () => void;
}) {
  const [logoStage, setLogoStage] = useState(0);
  const [tab, setTab] = useState<CalcTab>("calc");
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);

  // Calculator state
  const [ex, setEx] = useState("");
  const [isDeg, setIsDeg] = useState(true);
  const [mem, setMem] = useState(0);
  const [fresh, setFresh] = useState(false);
  const [alt, setAlt] = useState(false);
  const [hist, setHist] = useState<HistoryEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]") as HistoryEntry[];
    } catch {
      return [];
    }
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [installedInUniverse, setInstalledInUniverse] = useState(() => {
    const list = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
    return list.some((a) => a.id === "gamura-calculator");
  });

  useEffect(() => {
    const prev = document.title;
    document.title = "Gamura Calculator";
    return () => {
      document.title = prev;
    };
  }, []);

  useEffect(() => {
    const syncUniverse = () => {
      const list = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(list.some((a) => a.id === "gamura-calculator"));
    };
    window.addEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
    window.addEventListener("storage", syncUniverse);
    return () => {
      window.removeEventListener(UNIVERSE_APPS_EVENT, syncUniverse);
      window.removeEventListener("storage", syncUniverse);
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 1500);
  }, []);

  // Computed display state
  const { subExpr, displayRes } = useMemo(() => {
    if (fresh) {
      return {
        subExpr: hist[0] ? `${hist[0].e} =` : "",
        displayRes: ex || "0",
      };
    }
    if (!ex) return { subExpr: "", displayRes: "0" };
    try {
      const val = fmtNum(evalExpression(ex, isDeg));
      return { subExpr: ex, displayRes: val };
    } catch {
      return { subExpr: ex, displayRes: ex };
    }
  }, [ex, fresh, hist, isDeg]);

  const pressKey = useCallback(
    (keyId: string) => {
      try {
        navigator.vibrate?.(6);
      } catch {
        // ignore haptics errors
      }

      if (keyId === "2nd") {
        setAlt((a) => !a);
        return;
      }

      const fnNames = new Set([
        "sin",
        "cos",
        "tan",
        "asin",
        "acos",
        "atan",
        "ln",
        "lg",
        "√",
        "∛",
        "abs",
      ]);

      setEx((prevEx) => {
        let cur = prevEx;
        const isDigit = /^\d$/.test(keyId);
        const isOp = "+−×÷".includes(keyId) && keyId.length === 1;

        if (fresh) {
          if (
            isDigit ||
            keyId === "." ||
            keyId === "π" ||
            keyId === "ℯ" ||
            keyId === "(" ||
            fnNames.has(keyId) ||
            keyId === "10ˣ" ||
            keyId === "eˣ"
          ) {
            cur = "";
          }
          setFresh(false);
        }

        if (isDigit) return cur + keyId;

        if (keyId === ".") {
          const tail = (cur.match(/[\d.]*$/) || [""])[0];
          if (!tail.includes(".")) return cur + (tail ? "" : "0") + ".";
          return cur;
        }

        if (isOp) {
          if (!cur && keyId !== "−") cur = "0";
          if (/[+−×÷^]$/.test(cur)) {
            if (cur.length > 1) return cur.slice(0, -1) + keyId;
            return cur;
          }
          return cur + keyId;
        }

        if (keyId === "AC") return "";

        if (keyId === "⌫") {
          const stripped = cur.replace(
            /(asin|acos|atan|abs|sin|cos|tan|ln|lg|√|∛)\($/,
            "",
          );
          return stripped === cur ? cur.slice(0, -1) : stripped;
        }

        if (keyId === "%") return cur ? `${cur}%` : cur;

        if (keyId === "±") {
          const negMatch = cur.match(/\(−(\d+\.?\d*)\)$/);
          if (negMatch) return cur.slice(0, -negMatch[0].length) + negMatch[1];
          const numMatch = cur.match(/\d+\.?\d*$/);
          if (numMatch) {
            return cur.slice(0, -numMatch[0].length) + `(−${numMatch[0]})`;
          }
          return cur;
        }

        if (keyId === "=") {
          if (!cur) return cur;
          try {
            const computed = fmtNum(evalExpression(cur, isDeg));
            const nextHist = [{ e: cur, r: computed }, ...hist].slice(0, 50);
            setHist(nextHist);
            try {
              localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(nextHist));
            } catch {
              // ignore
            }
            setFresh(true);
            return computed;
          } catch {
            showToast("Invalid expression");
            return cur;
          }
        }

        if (keyId === "deg") {
          setIsDeg((d) => !d);
          return cur;
        }
        if (keyId === "x²") return cur ? `${cur}^2` : cur;
        if (keyId === "x³") return cur ? `${cur}^3` : cur;
        if (keyId === "xʸ") return cur ? `${cur}^` : cur;
        if (keyId === "x!") return cur ? `${cur}!` : cur;
        if (keyId === "10ˣ") return `${cur}10^(`;
        if (keyId === "eˣ") return `${cur}ℯ^(`;
        if (keyId === "1/x") return cur ? `1÷(${cur})` : cur;
        if (keyId === "π" || keyId === "ℯ" || keyId === "(" || keyId === ")") {
          return cur + keyId;
        }
        if (fnNames.has(keyId)) return `${cur}${keyId}(`;

        if (keyId === "MC") {
          setMem(0);
          showToast("Memory cleared");
          return cur;
        }
        if (keyId === "MR") {
          return mem ? cur + fmtNum(mem) : cur;
        }
        if (keyId === "M+" || keyId === "M−") {
          try {
            const v = evalExpression(cur || "0", isDeg);
            const nextMem = mem + (keyId === "M+" ? v : -v);
            setMem(nextMem);
            showToast(`Memory ${fmtNum(nextMem)}`);
          } catch {
            showToast("Invalid value");
          }
          return cur;
        }

        return cur;
      });
    },
    [fresh, hist, isDeg, mem, showToast],
  );

  // Physical keyboard support when Calculator tab is active
  useEffect(() => {
    const keyMap: Record<string, string> = {
      "*": "×",
      "/": "÷",
      "-": "−",
      "+": "+",
      "^": "xʸ",
      "(": "(",
      ")": ")",
      ".": ".",
      "%": "%",
      "!": "x!",
      Enter: "=",
      "=": "=",
      Backspace: "⌫",
      Escape: "AC",
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobilePanelOpen) {
        setMobilePanelOpen(false);
        return;
      }
      if (tab !== "calc" || mobilePanelOpen || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        return;
      }
      const mapped = /^\d$/.test(e.key) ? e.key : keyMap[e.key];
      if (mapped) {
        e.preventDefault();
        pressKey(mapped);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobilePanelOpen, pressKey, tab]);

  const handleToggleUniverseInstall = () => {
    const appDef = BUILTIN_STORE_APPS.find((a) => a.id === "gamura-calculator");
    if (!appDef) return;
    if (installedInUniverse) {
      removeAppFromUniverse("gamura-calculator");
      setInstalledInUniverse(false);
      showToast("Removed from Universe Apps");
    } else {
      addAppToUniverse(appDef);
      setInstalledInUniverse(true);
      showToast("Added to Universe Apps");
    }
  };

  const tabTools = useMemo(
    () => ALL_TOOLS.filter((t) => t.tab === tab),
    [tab],
  );

  const selectedTool = useMemo(() => {
    if (tab === "calc") return null;
    const found = tabTools.find((t) => t.id === activeToolId);
    return found || tabTools[0] || null;
  }, [activeToolId, tab, tabTools]);

  const handleSelectTab = (next: CalcTab) => {
    setTab(next);
    setMobilePanelOpen(false);
    if (next !== "calc") {
      const first = ALL_TOOLS.find((t) => t.tab === next);
      if (first) setActiveToolId(first.id);
    }
  };

  const handleOpenTool = (toolId: string) => {
    setActiveToolId(toolId);
    setMobilePanelOpen(true);
  };

  const logoSrc =
    logoStage === 0
      ? GAMURA_CALC_LOGO_URL
      : logoStage === 1
        ? "/assets/aistudio/1794827362170_4380eebb.jpg"
        : GAMURA_CALC_LOGO_FALLBACK;

  const resFontSizePx = Math.max(
    28,
    Math.min(58, (310 / Math.max(1, displayRes.length)) * 1.7),
  );

  return (
    <div
      style={APPLE_FONT_STYLE}
      className="min-h-screen bg-[#f2f2f7] text-[#1c1c1e] flex flex-col pb-24 lg:pb-10"
    >
      {/* Top Apple Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/88 backdrop-blur-2xl border-b border-black/[0.06]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          {/* Left: Back + Official GAMURA CALCULATOR Lockup */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={onBackHome}
              className="min-h-[40px] px-3 rounded-full bg-[#f2f2f7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1c1c1e] inline-flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              <ArrowLeft size={14} />
              <span>Home</span>
            </button>

            <a
              href="/launch"
              className="hidden sm:inline-flex min-h-[40px] px-3 rounded-full bg-[#f2f2f7] hover:bg-zinc-200/80 text-xs font-semibold text-[#1c1c1e] items-center transition-colors whitespace-nowrap shrink-0"
            >
              Launch Store
            </a>

            <div className="flex items-center gap-2 min-w-0 pl-1">
              <div className="w-8 h-8 rounded-[9px] bg-white border border-black/[0.08] shadow-xs overflow-hidden shrink-0 flex items-center justify-center">
                <img
                  src={logoSrc}
                  alt="Gamura Calculator logo"
                  referrerPolicy="no-referrer"
                  onError={() => setLogoStage((s) => Math.min(2, s + 1))}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-sm font-bold tracking-tight text-[#1c1c1e] truncate whitespace-nowrap">
                GAMURA CALCULATOR
              </span>
            </div>
          </div>

          {/* Center Desktop Tabs */}
          <nav
            aria-label="Calculator sections"
            className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-[#f2f2f7] border border-black/[0.05]"
          >
            {(
              [
                { id: "calc", label: "Calculator", icon: Calculator },
                { id: "convert", label: "Convert", icon: ArrowLeftRight },
                { id: "finance", label: "Finance", icon: Coins },
                { id: "lab", label: "Lab", icon: FlaskConical },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-white text-[#1c1c1e] shadow-xs"
                      : "text-[#6E6E73] hover:text-[#1c1c1e]"
                  }`}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleUniverseInstall}
              title="Add or remove in Universe Apps"
              className={`min-h-[38px] px-3 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 border transition-colors cursor-pointer whitespace-nowrap ${
                installedInUniverse
                  ? "bg-[#E2F5ED] border-[#0f9f6e]/30 text-[#0f9f6e]"
                  : "bg-white border-black/[0.08] text-[#1c1c1e] hover:bg-[#f2f2f7]"
              }`}
            >
              <Globe size={14} />
              <span className="hidden sm:inline">
                {installedInUniverse ? "In Universe" : "Universe"}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setHistoryOpen(true)}
              aria-label="Calculation history"
              className="min-h-[38px] min-w-[38px] rounded-full bg-[#f2f2f7] hover:bg-zinc-200/80 border border-black/[0.06] inline-flex items-center justify-center text-[#1c1c1e] cursor-pointer"
            >
              <History size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-3.5 sm:px-6 pt-3 sm:pt-6">
        {tab === "calc" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Left / Center: Scientific Calculator Keypad */}
            <section className="lg:col-span-7 flex flex-col gap-2.5 max-w-[460px] w-full mx-auto lg:max-w-none">
              <div className="flex items-center justify-between px-1">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                  Calculator
                </h1>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(true)}
                  className="lg:hidden min-h-[40px] min-w-[40px] rounded-full bg-white border border-black/[0.08] shadow-xs inline-flex items-center justify-center text-[#1c1c1e] cursor-pointer"
                  aria-label="Open history"
                >
                  <History size={17} />
                </button>
              </div>

              {/* Display Card */}
              <div
                onClick={() => {
                  navigator.clipboard?.writeText(displayRes).catch(() => {});
                  showToast("Copied");
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigator.clipboard?.writeText(displayRes).catch(() => {});
                    showToast("Copied");
                  }
                }}
                title="Tap result to copy"
                className="bg-white rounded-[24px] border border-black/[0.08] shadow-xs px-4 py-3.5 min-h-[126px] flex flex-col justify-end items-end gap-0.5 overflow-hidden cursor-pointer select-text"
              >
                <div className="w-full flex items-center justify-between text-[11px] font-bold text-[#8e8e93] tracking-[0.08em] h-4">
                  <span>{isDeg ? "DEG" : "RAD"}</span>
                  <span>{mem ? `M (${fmtNum(mem)})` : ""}</span>
                </div>
                <div className="w-full text-right text-lg sm:text-xl text-[#8e8e93] break-all min-h-[26px] max-h-[56px] overflow-hidden tabular-nums">
                  {subExpr}
                </div>
                <div
                  style={{ fontSize: `${resFontSizePx}px` }}
                  className="font-light tracking-[-0.03em] leading-[1.05] text-[#1c1c1e] whitespace-nowrap tabular-nums"
                >
                  {displayRes}
                </div>
              </div>

              {/* Memory Bar */}
              <div className="grid grid-cols-4 gap-2 px-0.5">
                {(["MC", "MR", "M+", "M−"] as const).map((mKey) => (
                  <button
                    key={mKey}
                    type="button"
                    onClick={() => pressKey(mKey)}
                    className="min-h-[34px] rounded-xl bg-white border border-black/[0.08] text-xs font-semibold text-[#6E6E73] hover:text-[#1c1c1e] hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer"
                  >
                    {mKey}
                  </button>
                ))}
              </div>

              {/* 5x7 Scientific Keypad */}
              <div className="grid grid-cols-5 gap-2 flex-1">
                {KEYPAD.map((spec) => {
                  const effectiveId =
                    spec.id === "2nd"
                      ? "2nd"
                      : alt && spec.altId
                        ? spec.altId
                        : spec.id;
                  const effectiveLabel =
                    spec.id === "deg"
                      ? isDeg
                        ? "deg"
                        : "rad"
                      : alt && spec.altLabel
                        ? spec.altLabel
                        : spec.label;

                  const isAltToggle = spec.id === "2nd" && alt;
                  let btnClass =
                    "min-h-[52px] sm:min-h-[58px] rounded-[18px] sm:rounded-[20px] flex items-center justify-center select-none transition-all active:scale-95 cursor-pointer ";
                  if (spec.kind === "eq") {
                    btnClass +=
                      "bg-gradient-to-br from-[#3a3a3c] to-black text-white text-2xl sm:text-[28px] font-medium shadow-[0_6px_18px_rgba(0,0,0,0.24)]";
                  } else if (isAltToggle) {
                    btnClass += "bg-[#1c1c1e] text-white text-sm font-semibold";
                  } else if (spec.kind === "op") {
                    btnClass +=
                      "bg-[#e9e9ee] hover:bg-[#dfdfea] text-[#1c1c1e] text-2xl sm:text-[26px] font-medium border border-black/[0.06]";
                  } else if (spec.kind === "ac") {
                    btnClass +=
                      "bg-[#e9e9ee] hover:bg-[#dfdfea] text-[#1c1c1e] text-lg font-medium border border-black/[0.06]";
                  } else if (spec.kind === "fn") {
                    btnClass +=
                      "bg-[#f8f8fb] hover:bg-[#efeff5] text-[#1c1c1e] text-sm sm:text-base font-medium border border-black/[0.06]";
                  } else {
                    btnClass +=
                      "bg-white hover:bg-zinc-50 text-[#1c1c1e] text-2xl font-normal border border-black/[0.08] shadow-[0_1px_2px_rgba(0,0,0,0.04)] tabular-nums";
                  }

                  return (
                    <button
                      key={spec.id}
                      type="button"
                      onClick={() => pressKey(effectiveId)}
                      aria-label={effectiveLabel}
                      className={btnClass}
                    >
                      {spec.id === "⌫" ? <Delete size={19} /> : effectiveLabel}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Right Desktop Column: Live History & Quick Reference */}
            <aside className="hidden lg:flex lg:col-span-5 flex-col gap-4">
              <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xs p-5 flex-1 flex flex-col min-h-[480px] max-h-[600px]">
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-[#6E6E73]" />
                    <h2 className="text-base font-bold tracking-tight">
                      History
                    </h2>
                  </div>
                  {hist.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setHist([]);
                        try {
                          localStorage.removeItem(HISTORY_STORAGE_KEY);
                        } catch {
                          // ignore
                        }
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>Clear</span>
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-black/[0.05] mt-1">
                  {hist.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-12 text-xs text-[#6E6E73] space-y-2">
                      <Calculator size={24} className="text-[#8e8e93]" />
                      <p>Press = on any expression to save history.</p>
                    </div>
                  ) : (
                    hist.map((entry, idx) => (
                      <button
                        key={`${entry.e}_${idx}`}
                        type="button"
                        onClick={() => {
                          setEx(entry.r);
                          setFresh(false);
                        }}
                        className="w-full py-3 px-1.5 text-right hover:bg-[#f2f2f7] rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="text-xs text-[#6E6E73] truncate tabular-nums">
                          {entry.e}
                        </div>
                        <div className="text-xl font-medium text-[#1c1c1e] tabular-nums">
                          = {entry.r}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        )}

        {/* CONVERT, FINANCE & LAB TABS */}
        {tab !== "calc" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight capitalize">
                {tab === "convert"
                  ? "Convert"
                  : tab === "finance"
                    ? "Finance"
                    : "Lab"}
              </h1>
              <span className="text-xs font-medium text-[#6E6E73]">
                {tabTools.length} tools
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Tool Selector Grid */}
              <div className="lg:col-span-5 grid grid-cols-3 gap-2.5 sm:gap-3">
                {tabTools.map((t) => {
                  const Icon = t.icon;
                  const active = selectedTool?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleOpenTool(t.id)}
                      className={`min-h-[96px] rounded-[22px] p-3 flex flex-col items-center justify-center gap-2 text-center transition-all active:scale-95 cursor-pointer border ${
                        active
                          ? "lg:bg-[#1c1c1e] lg:text-white lg:border-[#1c1c1e] bg-white text-[#1c1c1e] border-black/[0.08] shadow-xs"
                          : "bg-white hover:bg-zinc-50 text-[#1c1c1e] border-black/[0.08] shadow-xs"
                      }`}
                    >
                      <Icon size={24} strokeWidth={1.8} />
                      <span className="text-xs font-semibold leading-tight line-clamp-2">
                        {t.name}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Desktop Active Tool Workspace */}
              <div className="hidden lg:block lg:col-span-7">
                {selectedTool && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h2 className="text-xl font-bold tracking-tight">
                        {selectedTool.name}
                      </h2>
                    </div>
                    <DynamicToolView
                      tool={selectedTool}
                      onCopyToast={showToast}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Slide-In Tool Panel */}
      {mobilePanelOpen && selectedTool && (
        <div className="lg:hidden fixed inset-0 z-40 bg-[#f2f2f7] overflow-y-auto px-4 pt-3 pb-16">
          <div className="max-w-md mx-auto space-y-3">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMobilePanelOpen(false)}
                className="min-h-[44px] px-2 inline-flex items-center gap-1 text-base font-semibold text-[#1c1c1e] cursor-pointer"
              >
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
              <h2 className="text-lg font-bold text-[#1c1c1e] truncate">
                {selectedTool.name}
              </h2>
              <div className="w-16" />
            </div>

            <DynamicToolView tool={selectedTool} onCopyToast={showToast} />
          </div>
        </div>
      )}

      {/* Mobile Bottom Apple Tab Dock */}
      <nav
        aria-label="Calculator navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/88 backdrop-blur-2xl border-t border-black/[0.08] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-2">
          {(
            [
              { id: "calc", label: "Calculator", icon: Calculator },
              { id: "convert", label: "Convert", icon: ArrowLeftRight },
              { id: "finance", label: "Finance", icon: Coins },
              { id: "lab", label: "Lab", icon: FlaskConical },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectTab(item.id)}
                className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                  active ? "text-[#1c1c1e]" : "text-[#8e8e93]"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.3 : 1.8} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* History Drawer Sheet */}
      {historyOpen && (
        <div
          onClick={() => setHistoryOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[75dvh] bg-white rounded-t-[28px] sm:rounded-[28px] p-5 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <h2 className="text-base font-bold">History</h2>
              <div className="flex items-center gap-3">
                {hist.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setHist([]);
                      try {
                        localStorage.removeItem(HISTORY_STORAGE_KEY);
                      } catch {
                        // ignore
                      }
                    }}
                    className="text-xs font-semibold text-red-600 cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="text-xs font-semibold text-[#1c1c1e] cursor-pointer inline-flex items-center gap-1"
                >
                  <span>Done</span>
                  <X size={14} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-black/[0.06] mt-1">
              {hist.length === 0 ? (
                <p className="text-sm text-[#6E6E73] py-8 text-center">
                  No history yet
                </p>
              ) : (
                hist.map((entry, idx) => (
                  <button
                    key={`${entry.e}_${idx}`}
                    type="button"
                    onClick={() => {
                      setEx(entry.r);
                      setFresh(false);
                      setTab("calc");
                      setHistoryOpen(false);
                    }}
                    className="w-full py-3 text-right hover:bg-[#f2f2f7] px-2 rounded-xl transition-colors cursor-pointer"
                  >
                    <small className="block text-xs text-[#6E6E73] tabular-nums">
                      {entry.e}
                    </small>
                    <b className="text-xl font-medium text-[#1c1c1e] tabular-nums">
                      = {entry.r}
                    </b>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[#1c1c1e] text-white text-xs font-semibold shadow-lg inline-flex items-center gap-1.5">
          <Copy size={12} />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
