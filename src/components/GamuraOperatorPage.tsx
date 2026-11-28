import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  Bluetooth,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Copy,
  Download,
  Fan,
  Home,
  Laptop,
  Lightbulb,
  Lock,
  Monitor,
  Moon,
  Pause,
  Play,
  Plus,
  Power,
  Radio,
  Settings2,
  SkipBack,
  SkipForward,
  Sliders,
  Smartphone,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  Tv,
  Volume2,
  VolumeX,
  Wifi,
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

interface GamuraOperatorPageProps {
  onBackHome: () => void;
  onBackStore?: () => void;
}

type DeviceType = "tv" | "pc" | "light" | "fan" | "phone";
type LinkType =
  | "demo"
  | "roku"
  | "samsung"
  | "ha"
  | "http"
  | "bluetooth"
  | "pc";

interface DemoDeviceState {
  power: boolean;
  vol: number;
  muted: boolean;
  bright: number;
  color: string;
  speed: number;
  osc: boolean;
  source?: string;
  channel?: number;
  playing?: boolean;
  ringingUntil?: number;
  cursorInfo?: string;
  last?: string;
}

interface OperatorDevice {
  id: string;
  name: string;
  type: DeviceType;
  link: LinkType;
  ip?: string;
  base?: string;
  token?: string;
  entity?: string;
  preset?: "tasmota" | "shelly" | "esp32";
  service?: string;
  char?: string;
  on?: string;
  off?: string;
  bright?: string;
  rgb?: string;
  host?: string;
  state?: DemoDeviceState;
  _bt?: boolean;
}

interface LinkFieldDef {
  key: keyof OperatorDevice;
  label: string;
  placeholder: string;
  optional?: boolean;
  secret?: boolean;
  options?: readonly string[];
}

interface LinkDef {
  name: string;
  short: string;
  types: readonly DeviceType[];
  fields: readonly LinkFieldDef[];
}

interface BtCharacteristicLike {
  writeValueWithoutResponse?: (value: BufferSource) => Promise<void>;
  writeValue: (value: BufferSource) => Promise<void>;
}

interface BtServiceLike {
  getCharacteristic: (uuid: string | number) => Promise<BtCharacteristicLike>;
}

interface BtServerLike {
  connected: boolean;
  connect: () => Promise<BtServerLike>;
  getPrimaryService: (uuid: string | number) => Promise<BtServiceLike>;
}

interface BtDeviceLike {
  gatt?: BtServerLike;
}

interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: {
    requestDevice: (opts: {
      acceptAllDevices: boolean;
      optionalServices?: (string | number)[];
    }) => Promise<BtDeviceLike>;
  };
}

const STORAGE_DEVICES_KEY = "gamura.operator.devices.v1";
const LEGACY_DEVICES_KEY = "gr.devices";
const STORAGE_THEME_KEY = "gamura.operator.theme.v1";
const OPERATOR_ICON_SRC = "/assets/aistudio/icon_5f4bc6ca.svg";

const APPLE_FONT_STYLE: React.CSSProperties = {
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif',
};

const DEVICE_TYPES: Record<
  DeviceType,
  { label: string; emoji: string; accent: string; desc: string }
> = {
  tv: {
    label: "TV",
    emoji: "📺",
    accent: "#0071E3",
    desc: "Apple-style D-Pad, Vol, Channel & Media",
  },
  pc: {
    label: "PC / Laptop",
    emoji: "💻",
    accent: "#5E5CE6",
    desc: "Multi-touch trackpad, keyboard & power",
  },
  light: {
    label: "Light",
    emoji: "💡",
    accent: "#FF9F0A",
    desc: "Dimmer, color studio & smart plugs",
  },
  fan: {
    label: "Fan",
    emoji: "🌀",
    accent: "#30B0C7",
    desc: "3-speed airflow & oscillation control",
  },
  phone: {
    label: "Phone",
    emoji: "📱",
    accent: "#34C759",
    desc: "Find ping chime, volume & media",
  },
};

const LINKS: Record<LinkType, LinkDef> = {
  demo: {
    name: "Demo (simulated)",
    short: "Demo Mode",
    types: ["tv", "pc", "light", "fan", "phone"],
    fields: [],
  },
  roku: {
    name: "WiFi · Roku TV",
    short: "Roku WiFi",
    types: ["tv"],
    fields: [{ key: "ip", label: "TV IP address", placeholder: "192.168.1.20" }],
  },
  samsung: {
    name: "WiFi · Samsung Smart TV",
    short: "Samsung TV",
    types: ["tv"],
    fields: [{ key: "ip", label: "TV IP address", placeholder: "192.168.1.21" }],
  },
  ha: {
    name: "WiFi · Home Assistant (any TV, light, fan, phone)",
    short: "Home Assistant",
    types: ["tv", "light", "fan", "phone"],
    fields: [
      {
        key: "base",
        label: "Home Assistant URL",
        placeholder: "http://homeassistant.local:8123",
      },
      {
        key: "token",
        label: "Long-lived access token",
        placeholder: "eyJ...",
        optional: true,
        secret: true,
      },
      {
        key: "entity",
        label: "Entity ID",
        placeholder: "media_player.living_room_tv",
      },
    ],
  },
  http: {
    name: "WiFi · Smart plug / ESP32 (HTTP)",
    short: "HTTP Smart Device",
    types: ["light", "fan", "tv", "phone"],
    fields: [
      {
        key: "base",
        label: "Device URL",
        placeholder: "http://192.168.1.50",
      },
      {
        key: "preset",
        label: "Firmware",
        placeholder: "tasmota",
        optional: true,
        options: ["tasmota", "shelly", "esp32"],
      },
    ],
  },
  bluetooth: {
    name: "Bluetooth LE (GATT)",
    short: "Bluetooth LE",
    types: ["light", "fan", "tv", "phone"],
    fields: [
      {
        key: "service",
        label: "Service UUID (e.g. 0xffe5)",
        placeholder: "0xffe5",
      },
      {
        key: "char",
        label: "Characteristic UUID",
        placeholder: "0xffe9",
      },
      {
        key: "on",
        label: "ON bytes (hex)",
        placeholder: "7e0704ff00010100ef",
      },
      {
        key: "off",
        label: "OFF bytes (hex)",
        placeholder: "7e07040000000100ef",
      },
      {
        key: "bright",
        label: "Brightness bytes, {v}=0-100 as hex",
        placeholder: "7e0501{v}ffff00ef",
        optional: true,
      },
      {
        key: "rgb",
        label: "Color bytes, {r}{g}{b} hex",
        placeholder: "7e070503{r}{g}{b}10ef",
        optional: true,
      },
    ],
  },
  pc: {
    name: "WiFi / Hotspot / USB tether · PC Companion",
    short: "PC Companion",
    types: ["pc"],
    fields: [
      {
        key: "host",
        label: "Companion address",
        placeholder: "192.168.1.10:8765",
      },
      {
        key: "token",
        label: "Pairing token",
        placeholder: "shown in PC terminal",
        optional: true,
        secret: true,
      },
    ],
  },
};

const ROKU_KEYS: Record<string, string> = {
  power: "Power",
  up: "Up",
  down: "Down",
  left: "Left",
  right: "Right",
  ok: "Select",
  back: "Back",
  home: "Home",
  menu: "Info",
  volup: "VolumeUp",
  voldown: "VolumeDown",
  mute: "VolumeMute",
  chup: "ChannelUp",
  chdown: "ChannelDown",
  play: "Play",
  pause: "Play",
  next: "Fwd",
  prev: "Rev",
  source: "InputHDMI1",
};

const SAMSUNG_KEYS: Record<string, string> = {
  power: "KEY_POWER",
  up: "KEY_UP",
  down: "KEY_DOWN",
  left: "KEY_LEFT",
  right: "KEY_RIGHT",
  ok: "KEY_ENTER",
  back: "KEY_RETURN",
  home: "KEY_HOME",
  menu: "KEY_MENU",
  volup: "KEY_VOLUP",
  voldown: "KEY_VOLDOWN",
  mute: "KEY_MUTE",
  chup: "KEY_CHUP",
  chdown: "KEY_CHDOWN",
  play: "KEY_PLAY",
  pause: "KEY_PAUSE",
  next: "KEY_FF",
  prev: "KEY_REWIND",
  source: "KEY_SOURCE",
};

const LIGHT_SWATCHES = [
  "#FFD9A0",
  "#FFFFFF",
  "#FF4D4D",
  "#4D79FF",
  "#30D158",
  "#BF5AF2",
];

const PC_COMPANION_PACKAGE_JSON = `{
  "name": "gamura-remote-companion",
  "version": "1.0.0",
  "description": "PC companion for GAMURA Operator: mouse, keyboard, media and power control",
  "main": "server.js",
  "scripts": { "start": "node server.js" },
  "dependencies": { "ws": "^8.18.0" },
  "license": "MIT"
}
`;

const PC_COMPANION_SERVER_JS = `'use strict';
// GAMURA Operator PC companion. Run: npm install && node server.js
// Windows: no extra tools. Linux: install xdotool. macOS: install cliclick (mouse/click) - keys limited.
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { spawn, execFile } = require('child_process');
const { WebSocketServer } = require('ws');

const PORT = +process.env.PORT || 8765;
const TOKEN = process.env.GAMURA_TOKEN || crypto.randomBytes(3).toString('hex');
const P = process.platform;

const MIME = { '.html': 'text/html', '.json': 'application/json', '.js': 'text/javascript', '.svg': 'image/svg+xml' };
const FILES = ['index.html', 'manifest.json', 'sw.js', 'icon.svg'];

const server = http.createServer((req, res) => {
  let name = decodeURIComponent(req.url.split('?')[0]).replace(/^\\/+/, '') || 'index.html';
  if (!FILES.includes(name)) { res.writeHead(404); return res.end('Not found'); }
  fs.readFile(path.join(__dirname, name), (e, buf) => {
    if (e) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(name)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
});

/* ---------- Windows backend: one persistent PowerShell ---------- */
const VK = { esc: 27, tab: 9, enter: 13, backspace: 8, up: 38, down: 40, left: 37, right: 39, delete: 46, home: 36, end: 35, space: 32, ctrl: 17, alt: 18, shift: 16, win: 91 };
const MEDIA_VK = { play: 179, next: 176, prev: 177, mute: 173, 'vol-': 174, 'vol+': 175 };
const vkOf = k => VK[k] || (k.length === 1 ? k.toUpperCase().charCodeAt(0) : 0);

let ps = null;
function winSend(line) {
  if (!ps) {
    const script = \`
Add-Type @"
using System;using System.Runtime.InteropServices;
public class W{
[DllImport("user32.dll")]public static extern void mouse_event(int f,int dx,int dy,int d,int e);
[DllImport("user32.dll")]public static extern void keybd_event(byte k,byte s,int f,int e);}
"@
Add-Type -AssemblyName System.Windows.Forms
while(($l=[Console]::In.ReadLine()) -ne $null){
 $p=$l.Split("|")
 switch($p[0]){
  "m"{[W]::mouse_event(1,[int]$p[1],[int]$p[2],0,0)}
  "c"{[W]::mouse_event([int]$p[1],0,0,0,0)}
  "s"{[W]::mouse_event(0x800,0,0,[int]$p[1],0)}
  "k"{[W]::keybd_event([byte][int]$p[1],0,[int]$p[2],0)}
  "t"{[System.Windows.Forms.SendKeys]::SendWait([Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($p[1])))}
 }
}\`;
    ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', '-'], { stdio: ['pipe', 'ignore', 'ignore'] });
    ps.stdin.write(script + '\\n');
    ps.on('exit', () => { ps = null; });
  }
  ps.stdin.write(line + '\\n');
}
const sendKeysEscape = s => s.replace(/[+^%~(){}\\[\\]]/g, m => \`{\${m}}\`).replace(/\\r?\\n/g, '{ENTER}');

const win = {
  move: (dx, dy) => winSend(\`m|\${dx}|\${dy}\`),
  click: b => { const [d, u] = { left: [2, 4], right: [8, 16], middle: [32, 64] }[b] || [2, 4]; winSend(\`c|\${d}\`); winSend(\`c|\${u}\`); },
  scroll: dy => winSend(\`s|\${dy * 40}\`),
  key: (k, mods) => {
    const m = mods.map(vkOf).filter(Boolean), v = vkOf(k);
    if (!v) return;
    m.forEach(x => winSend(\`k|\${x}|0\`)); winSend(\`k|\${v}|0\`); winSend(\`k|\${v}|2\`); m.reverse().forEach(x => winSend(\`k|\${x}|2\`));
  },
  text: t => winSend(\`t|\${Buffer.from(sendKeysEscape(t), 'utf8').toString('base64')}\`),
  media: a => { const v = MEDIA_VK[a]; if (v) { winSend(\`k|\${v}|0\`); winSend(\`k|\${v}|2\`); } },
  sys: a => {
    const C = { lock: ['rundll32.exe', ['user32.dll,LockWorkStation']], sleep: ['rundll32.exe', ['powrprof.dll,SetSuspendState', '0,1,0']], restart: ['shutdown', ['/r', '/t', '5']], shutdown: ['shutdown', ['/s', '/t', '5']] }[a];
    if (C) execFile(C[0], C[1], () => {});
  }
};

/* ---------- Linux backend: xdotool ---------- */
const xd = (...a) => execFile('xdotool', a.map(String), () => {});
const XKEY = { esc: 'Escape', tab: 'Tab', enter: 'Return', backspace: 'BackSpace', up: 'Up', down: 'Down', left: 'Left', right: 'Right', delete: 'Delete', home: 'Home', end: 'End', space: 'space', ctrl: 'ctrl', alt: 'alt', shift: 'shift', win: 'super' };
const XMEDIA = { play: 'XF86AudioPlay', next: 'XF86AudioNext', prev: 'XF86AudioPrev', mute: 'XF86AudioMute', 'vol-': 'XF86AudioLowerVolume', 'vol+': 'XF86AudioRaiseVolume' };
const linux = {
  move: (dx, dy) => xd('mousemove_relative', '--', dx, dy),
  click: b => xd('click', { left: 1, middle: 2, right: 3 }[b] || 1),
  scroll: dy => xd('click', '--repeat', Math.min(10, Math.abs(dy)), dy > 0 ? 4 : 5),
  key: (k, mods) => xd('key', [...mods, k].map(x => XKEY[x] || x).join('+')),
  text: t => xd('type', '--delay', 0, '--', t),
  media: a => XMEDIA[a] && xd('key', XMEDIA[a]),
  sys: a => { const C = { lock: ['loginctl', ['lock-session']], sleep: ['systemctl', ['suspend']], restart: ['systemctl', ['reboot']], shutdown: ['systemctl', ['poweroff']] }[a]; if (C) execFile(C[0], C[1], () => {}); }
};

/* ---------- macOS backend: cliclick + osascript ---------- */
const osa = s => execFile('osascript', ['-e', s], () => {});
const cc = (...a) => execFile('cliclick', a, () => {});
const MKEY = { esc: 53, tab: 48, enter: 36, backspace: 51, up: 126, down: 125, left: 123, right: 124, delete: 117, home: 115, end: 119, space: 49 };
const MMOD = { ctrl: 'control down', alt: 'option down', shift: 'shift down', win: 'command down' };
const mac = {
  move: (dx, dy) => cc(\`m:\${dx >= 0 ? '+' : ''}\${dx},\${dy >= 0 ? '+' : ''}\${dy}\`),
  click: b => cc(b === 'right' ? 'rc:.' : 'c:.'),
  scroll: () => {},
  key: (k, mods) => {
    const using = mods.map(m => MMOD[m]).filter(Boolean).join(', ');
    const tail = using ? \` using {\${using}}\` : '';
    osa(MKEY[k] !== undefined ? \`tell application "System Events" to key code \${MKEY[k]}\${tail}\` : \`tell application "System Events" to keystroke "\${k.replace(/["\\\\]/g, '')}"\${tail}\`);
  },
  text: t => osa(\`tell application "System Events" to keystroke "\${t.replace(/["\\\\]/g, '')}"\`),
  media: () => {},
  sys: a => { const S = { lock: 'tell application "System Events" to keystroke "q" using {control down, command down}', sleep: 'tell application "System Events" to sleep' }[a]; if (S) osa(S); }
};

const be = P === 'win32' ? win : P === 'darwin' ? mac : linux;

/* ---------- WebSocket ---------- */
const wss = new WebSocketServer({ server });
wss.on('connection', ws => {
  let ok = false;
  const timer = setTimeout(() => { if (!ok) ws.close(); }, 5000);
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!ok) {
      if (m.t === 'auth' && m.token === TOKEN) { ok = true; clearTimeout(timer); ws.send(JSON.stringify({ t: 'ready', os: P })); }
      else ws.close();
      return;
    }
    try {
      switch (m.t) {
        case 'move': be.move(Math.trunc(m.dx) || 0, Math.trunc(m.dy) || 0); break;
        case 'scroll': be.scroll(Math.trunc(m.dy2) || 0); break;
        case 'click': be.click(m.b); break;
        case 'key': be.key(String(m.k), Array.isArray(m.mods) ? m.mods.map(String) : []); break;
        case 'text': be.text(String(m.v).slice(0, 500)); break;
        case 'media': be.media(String(m.a)); break;
        case 'sys': be.sys(String(m.a)); break;
      }
    } catch (e) { console.error(e.message); }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\\nGAMURA Operator companion running\\n');
  ips.forEach(ip => console.log(\`  Open on phone:  http://\${ip}:\${PORT}\`));
  console.log(\`\\n  Pairing token:  \${TOKEN}\`);
  console.log('  In the app: add device > PC > Companion, enter address and token.\\n');
});
`;

const makeUid = () => Math.random().toString(36).slice(2, 9);

const createDefaultDemoState = (): DemoDeviceState => ({
  power: false,
  vol: 24,
  muted: false,
  bright: 82,
  color: "#FFD9A0",
  speed: 2,
  osc: false,
  source: "HDMI 1",
  channel: 12,
  playing: false,
  cursorInfo: "Ready",
  last: "Ready",
});

function loadInitialDevices(): OperatorDevice[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      localStorage.getItem(STORAGE_DEVICES_KEY) ||
      localStorage.getItem(LEGACY_DEVICES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore corrupted storage
  }
  // Pre-seed a helpful set of demo devices on first visit so it works immediately out of the box
  return [
    {
      id: "demo-tv",
      name: "Living Room Apple TV",
      type: "tv",
      link: "demo",
      state: { ...createDefaultDemoState(), power: true, source: "HDMI 1 · 4K HDR" },
    },
    {
      id: "demo-pc",
      name: "Mac / Windows Studio PC",
      type: "pc",
      link: "demo",
      state: { ...createDefaultDemoState(), power: true, cursorInfo: "Trackpad Ready" },
    },
    {
      id: "demo-light",
      name: "Studio Key Light",
      type: "light",
      link: "demo",
      state: { ...createDefaultDemoState(), power: true, bright: 84, color: "#FFD9A0" },
    },
    {
      id: "demo-fan",
      name: "Desk Breeze Fan",
      type: "fan",
      link: "demo",
      state: { ...createDefaultDemoState(), power: true, speed: 2, osc: true },
    },
    {
      id: "demo-phone",
      name: "Pocket Phone",
      type: "phone",
      link: "demo",
      state: { ...createDefaultDemoState(), power: true, vol: 65 },
    },
  ];
}

function playSonarPing() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    [880, 1174.66].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.18, now + idx * 0.14 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.14 + 0.36);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.38);
    });
    setTimeout(() => {
      ctx.close().catch(() => {});
    }, 900);
  } catch {
    // ignore audio block
  }
}

export default function GamuraOperatorPage({
  onBackHome,
  onBackStore,
}: GamuraOperatorPageProps) {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_THEME_KEY) === "dark";
  });

  const [devices, setDevices] = useState<OperatorDevice[]>(loadInitialDevices);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const initial = loadInitialDevices();
    return initial[0]?.id ?? null;
  });
  const [mobileScreen, setMobileScreen] = useState<
    "devices" | "remote" | "add"
  >("devices");
  const [isAddingDesktop, setIsAddingDesktop] = useState<boolean>(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmSysAction, setConfirmSysAction] = useState<
    "restart" | "shutdown" | null
  >(null);
  const [companionModalOpen, setCompanionModalOpen] = useState<boolean>(false);
  const [copiedCmd, setCopiedCmd] = useState<boolean>(false);

  // Add Device form state
  const [formName, setFormName] = useState<string>("");
  const [formType, setFormType] = useState<DeviceType>("tv");
  const [formLink, setFormLink] = useState<LinkType>("demo");
  const [formFields, setFormFields] = useState<Record<string, string>>({
    preset: "tasmota",
  });

  // PC Text input state
  const [pcText, setPcText] = useState<string>("");

  // Toast feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  // Hardware sockets & Bluetooth connections
  const socksRef = useRef<
    Record<string, { ws: WebSocket; promise: Promise<WebSocket> }>
  >({});
  const btMapRef = useRef<
    Record<string, { dev: BtDeviceLike; char: BtCharacteristicLike }>
  >({});
  const [btConnectedIds, setBtConnectedIds] = useState<Record<string, boolean>>(
    {},
  );
  const [wsConnectedIds, setWsConnectedIds] = useState<Record<string, boolean>>(
    {},
  );

  // Multi-touch trackpad tracking
  const padRef = useRef<HTMLDivElement | null>(null);
  const ptrsRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const movedRef = useRef<number>(0);
  const t0Ref = useRef<number>(0);
  const maxPtrsRef = useRef<number>(0);
  const accRef = useRef<{ x: number; y: number; scrollY: number }>({
    x: 0,
    y: 0,
    scrollY: 0,
  });
  const rafRef = useRef<number>(0);
  const [padCursorPulse, setPadCursorPulse] = useState<{
    x: number;
    y: number;
    label: string;
  } | null>(null);

  // Hold-to-repeat timer
  const repeatTimeoutRef = useRef<number | null>(null);
  const repeatIntervalRef = useRef<number | null>(null);

  // Universe Store status
  const [installedInUniverse, setInstalledInUniverse] = useState<boolean>(
    () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      return apps.some((a) => a.id === "gamura-operator");
    },
  );

  useEffect(() => {
    const sync = () => {
      const apps = readStoreJson<StoreAppItem[]>(UNIVERSE_APPS_KEY, []);
      setInstalledInUniverse(apps.some((a) => a.id === "gamura-operator"));
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
      localStorage.setItem(STORAGE_DEVICES_KEY, JSON.stringify(devices));
    } catch {
      // ignore
    }
  }, [devices]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (repeatTimeoutRef.current) window.clearTimeout(repeatTimeoutRef.current);
      if (repeatIntervalRef.current)
        window.clearInterval(repeatIntervalRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      Object.values(socksRef.current).forEach((entry) => {
        try {
          entry.ws.close();
        } catch {
          // ignore
        }
      });
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMsg(null);
    }, 2400);
  }, []);

  const buzz = useCallback(() => {
    try {
      if (navigator.vibrate) navigator.vibrate(12);
    } catch {
      // ignore
    }
  }, []);

  const activeDevice = useMemo(
    () => devices.find((d) => d.id === selectedId) || devices[0] || null,
    [devices, selectedId],
  );

  const toggleUniverseInstall = () => {
    const storeItem = BUILTIN_STORE_APPS.find(
      (a) => a.id === "gamura-operator",
    );
    if (!storeItem) return;
    if (installedInUniverse) {
      removeAppFromUniverse("gamura-operator");
      showToast("Removed from Universe Apps");
    } else {
      addAppToUniverse(storeItem);
      showToast("Added to Universe Apps");
    }
  };

  const openWS = useCallback(
    (
      key: string,
      url: string,
      deviceId: string,
      onOpen?: (ws: WebSocket) => void,
      ready?: (ev: MessageEvent, ws: WebSocket) => boolean | void,
    ): Promise<WebSocket> => {
      const old = socksRef.current[key];
      if (old && old.ws.readyState <= 1 && old.ws.url === url) {
        return old.promise;
      }
      let ws: WebSocket;
      try {
        ws = new WebSocket(url);
      } catch (err) {
        return Promise.reject(err);
      }
      const promise = new Promise<WebSocket>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
          reject(new Error("Connection timeout"));
          try {
            ws.close();
          } catch {
            // ignore
          }
        }, 8000);

        ws.onopen = () => {
          onOpen?.(ws);
          setWsConnectedIds((prev) => ({ ...prev, [deviceId]: true }));
          if (!ready) {
            window.clearTimeout(timeoutId);
            resolve(ws);
          }
        };

        ws.onmessage = (ev) => {
          if (ready) {
            const ok = ready(ev, ws);
            if (ok) {
              window.clearTimeout(timeoutId);
              resolve(ws);
            }
          }
        };

        ws.onerror = () => {
          window.clearTimeout(timeoutId);
          setWsConnectedIds((prev) => ({ ...prev, [deviceId]: false }));
          reject(new Error("WebSocket connection failed"));
        };

        ws.onclose = () => {
          delete socksRef.current[key];
          setWsConnectedIds((prev) => ({ ...prev, [deviceId]: false }));
        };
      });

      socksRef.current[key] = { ws, promise };
      return promise;
    },
    [],
  );

  const parseUuid = (s?: string): string | number => {
    const val = (s || "").trim();
    return /^0x/i.test(val) ? parseInt(val, 16) : val.toLowerCase();
  };

  const getBtChar = useCallback(
    async (d: OperatorDevice): Promise<BtCharacteristicLike> => {
      const existing = btMapRef.current[d.id];
      if (existing && existing.dev.gatt?.connected) {
        return existing.char;
      }
      const nav = navigator as NavigatorWithBluetooth;
      if (!nav.bluetooth) {
        throw new Error(
          "Web Bluetooth requires Chrome on Android or Desktop",
        );
      }
      const serviceUuid = parseUuid(d.service);
      const charUuid = parseUuid(d.char);
      const dev =
        existing?.dev ||
        (await nav.bluetooth.requestDevice({
          acceptAllDevices: true,
          optionalServices: [serviceUuid],
        }));
      if (!dev.gatt) throw new Error("Bluetooth GATT unavailable");
      const server = await dev.gatt.connect();
      const service = await server.getPrimaryService(serviceUuid);
      const char = await service.getCharacteristic(charUuid);
      btMapRef.current[d.id] = { dev, char };
      setBtConnectedIds((prev) => ({ ...prev, [d.id]: true }));
      return char;
    },
    [],
  );

  const updateDeviceState = useCallback(
    (deviceId: string, updater: (prev: OperatorDevice) => OperatorDevice) => {
      setDevices((prev) =>
        prev.map((d) => (d.id === deviceId ? updater(d) : d)),
      );
    },
    [],
  );

  const applyDemoCommand = useCallback(
    (
      d: OperatorDevice,
      action: string | Record<string, unknown>,
      value?: string | number,
    ) => {
      const sources = ["HDMI 1 · 4K HDR", "HDMI 2 · Apple TV", "AirPlay", "Apps"];
      updateDeviceState(d.id, (curr) => {
        const s: DemoDeviceState = {
          ...createDefaultDemoState(),
          ...(curr.state || {}),
        };
        if (typeof action === "object") {
          const t = String(action.t || "");
          if (t === "move") {
            s.cursorInfo = `Cursor Δ(${action.dx}, ${action.dy})`;
            s.last = `move (${action.dx},${action.dy})`;
          } else if (t === "scroll") {
            s.cursorInfo = `Scroll ${Number(action.dy2 || 0) > 0 ? "Up" : "Down"}`;
            s.last = `scroll ${action.dy2}`;
          } else if (t === "click") {
            s.cursorInfo = `Click · ${String(action.b || "left").toUpperCase()}`;
            s.last = `click ${action.b}`;
          } else if (t === "key") {
            const mods = Array.isArray(action.mods) && action.mods.length
              ? `${action.mods.join("+")}+`
              : "";
            s.cursorInfo = `Key · ${mods}${action.k}`;
            s.last = `key ${mods}${action.k}`;
          } else if (t === "text") {
            s.cursorInfo = `Typed "${String(action.v || "").slice(0, 22)}"`;
            s.last = `text "${action.v}"`;
          } else if (t === "media") {
            if (action.a === "play") s.playing = !s.playing;
            if (action.a === "mute") s.muted = !s.muted;
            if (action.a === "vol+") s.vol = Math.min(100, s.vol + 4);
            if (action.a === "vol-") s.vol = Math.max(0, s.vol - 4);
            s.cursorInfo = `Media · ${action.a}`;
            s.last = `media ${action.a}`;
          } else if (t === "sys") {
            if (action.a === "lock" || action.a === "sleep" || action.a === "shutdown") {
              s.power = false;
            }
            s.cursorInfo = `System · ${String(action.a).toUpperCase()}`;
            s.last = `sys ${action.a}`;
          }
          return { ...curr, state: s };
        }

        switch (action) {
          case "power":
          case "toggle":
            s.power = !s.power;
            break;
          case "on":
            s.power = true;
            break;
          case "off":
            s.power = false;
            break;
          case "volup":
            s.vol = Math.min(100, s.vol + 2);
            s.muted = false;
            break;
          case "voldown":
            s.vol = Math.max(0, s.vol - 2);
            break;
          case "mute":
            s.muted = !s.muted;
            break;
          case "chup":
            s.channel = (s.channel || 1) + 1;
            s.power = true;
            break;
          case "chdown":
            s.channel = Math.max(1, (s.channel || 1) - 1);
            s.power = true;
            break;
          case "source": {
            const idx = sources.indexOf(s.source || sources[0]);
            s.source = sources[(idx + 1) % sources.length];
            s.power = true;
            break;
          }
          case "play":
            s.playing = true;
            s.power = true;
            break;
          case "pause":
            s.playing = false;
            break;
          case "brightness":
            s.bright = Math.max(1, Math.min(100, Number(value) || 80));
            s.power = true;
            break;
          case "color":
            s.color = String(value || "#FFD9A0");
            s.power = true;
            break;
          case "speed":
            s.speed = Number(value) || 1;
            s.power = true;
            break;
          case "osc":
            s.osc = !s.osc;
            break;
          case "find":
            s.ringingUntil = Date.now() + 2600;
            playSonarPing();
            break;
        }
        s.last = action + (value !== undefined ? ` ${value}` : "");
        return { ...curr, state: s };
      });
    },
    [updateDeviceState],
  );

  const runAction = useCallback(
    async (
      action: string | Record<string, unknown>,
      value?: string | number,
      targetDevice?: OperatorDevice,
    ) => {
      const d = targetDevice || activeDevice;
      if (!d) return;
      buzz();
      try {
        if (d.link === "demo") {
          applyDemoCommand(d, action, value);
          return;
        }

        if (d.link === "roku") {
          const actName = typeof action === "string" ? action : "";
          const key = ROKU_KEYS[actName];
          if (!key) throw new Error("Not supported on Roku TV");
          await fetch(`http://${d.ip}:8060/keypress/${key}`, {
            method: "POST",
            mode: "no-cors",
          });
          return;
        }

        if (d.link === "samsung") {
          const actName = typeof action === "string" ? action : "";
          const key = SAMSUNG_KEYS[actName];
          if (!key) throw new Error("Not supported on Samsung TV");
          const url = `wss://${d.ip}:8002/api/v2/channels/samsung.remote.control?name=${btoa(
            "GAMURA Operator",
          )}${d.token ? `&token=${d.token}` : ""}`;
          const ws = await openWS(
            `s_${d.id}`,
            url,
            d.id,
            undefined,
            (ev) => {
              try {
                const m = JSON.parse(String(ev.data));
                if (m.event === "ms.channel.connect") {
                  if (m.data?.token) {
                    updateDeviceState(d.id, (prev) => ({
                      ...prev,
                      token: m.data.token,
                    }));
                  }
                  return true;
                }
              } catch {
                // ignore non-JSON
              }
              return false;
            },
          );
          ws.send(
            JSON.stringify({
              method: "ms.remote.control",
              params: {
                Cmd: "Click",
                DataOfCmd: key,
                Option: "false",
                TypeOfRemote: "SendRemoteKey",
              },
            }),
          );
          return;
        }

        if (d.link === "ha") {
          const actName = typeof action === "string" ? action : "";
          const entity = d.entity || "";
          const dom = entity.split(".")[0];
          const svcMap: Record<string, string> = {
            power: "toggle",
            on: "turn_on",
            off: "turn_off",
            toggle: "toggle",
            volup: "volume_up",
            voldown: "volume_down",
            play: "media_play_pause",
            pause: "media_play_pause",
            next: "media_next_track",
            prev: "media_previous_track",
          };
          let svc = svcMap[actName];
          const data: Record<string, unknown> = { entity_id: entity };
          if (actName === "mute") {
            svc = "volume_mute";
            data.is_volume_muted = true;
          } else if (actName === "brightness") {
            svc = "turn_on";
            data.brightness_pct = Number(value);
          } else if (actName === "color" && typeof value === "string") {
            svc = "turn_on";
            data.rgb_color = [1, 3, 5].map((i) =>
              parseInt(value.slice(i, i + 2), 16),
            );
          } else if (actName === "speed") {
            svc = "set_percentage";
            data.percentage = Math.round((Number(value) * 100) / 3);
          } else if (actName === "osc") {
            svc = "oscillate";
            data.oscillating = true;
          }
          if (!svc) throw new Error("Not supported by Home Assistant link");
          const base = (d.base || "").replace(/\/$/, "");
          const res = await fetch(`${base}/api/services/${dom}/${svc}`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${d.token || ""}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
          });
          if (!res.ok) throw new Error(`Home Assistant HTTP ${res.status}`);
          return;
        }

        if (d.link === "http") {
          const actName = typeof action === "string" ? action : "";
          const base = (d.base || "").replace(/\/$/, "");
          let targetUrl: string | undefined;
          if (d.preset === "tasmota") {
            const pMap: Record<string, string> = {
              power: "Power%20Toggle",
              toggle: "Power%20Toggle",
              on: "Power%20On",
              off: "Power%20Off",
            };
            const cmd =
              actName === "brightness"
                ? `Dimmer%20${value}`
                : actName === "color"
                  ? `Color%20${String(value || "").slice(1)}`
                  : actName === "speed"
                    ? `FanSpeed%20${value}`
                    : pMap[actName];
            if (cmd) targetUrl = `${base}/cm?cmnd=${cmd}`;
          } else if (d.preset === "shelly") {
            const pMap: Record<string, string> = {
              power: "toggle",
              toggle: "toggle",
              on: "on",
              off: "off",
            };
            if (actName === "brightness") {
              targetUrl = `${base}/light/0?turn=on&brightness=${value}`;
            } else if (pMap[actName]) {
              targetUrl = `${base}/relay/0?turn=${pMap[actName]}`;
            }
          } else {
            targetUrl = `${base}/${actName}${
              value !== undefined ? `?v=${encodeURIComponent(String(value))}` : ""
            }`;
          }
          if (!targetUrl) throw new Error("Not supported on HTTP firmware");
          await fetch(targetUrl, { mode: "no-cors" });
          return;
        }

        if (d.link === "bluetooth") {
          const actName = typeof action === "string" ? action : "";
          const char = await getBtChar(d);
          const hexToBytes = (s: string) =>
            new Uint8Array(
              (s.replace(/\s/g, "").match(/../g) || []).map((x) =>
                parseInt(x, 16),
              ),
            );
          let payload: string | undefined;
          if (actName === "on") payload = d.on;
          else if (actName === "off") payload = d.off;
          else if (actName === "power" || actName === "toggle") {
            const nextBt = !d._bt;
            updateDeviceState(d.id, (prev) => ({ ...prev, _bt: nextBt }));
            payload = nextBt ? d.on : d.off;
          } else if (actName === "brightness" && d.bright) {
            payload = d.bright.replace(
              "{v}",
              Number(value).toString(16).padStart(2, "0"),
            );
          } else if (
            actName === "color" &&
            d.rgb &&
            typeof value === "string"
          ) {
            payload = d.rgb
              .replace("{r}", value.slice(1, 3))
              .replace("{g}", value.slice(3, 5))
              .replace("{b}", value.slice(5, 7));
          }
          if (!payload) throw new Error("Not supported on this Bluetooth device");
          const bytes = hexToBytes(payload);
          if (char.writeValueWithoutResponse) {
            await char.writeValueWithoutResponse(bytes);
          } else {
            await char.writeValue(bytes);
          }
          return;
        }

        if (d.link === "pc") {
          const url = `ws://${d.host}`;
          const ws = await openWS(`p_${d.id}`, url, d.id, (socket) => {
            socket.send(
              JSON.stringify({ t: "auth", token: d.token || "" }),
            );
          });
          const frame =
            typeof action === "object" ? action : { t: action, v: value };
          ws.send(JSON.stringify(frame));
        }
      } catch (err: unknown) {
        const msg =
          err instanceof Error && err.message ? err.message : "Command failed";
        showToast(msg);
      }
    },
    [
      activeDevice,
      applyDemoCommand,
      buzz,
      getBtChar,
      openWS,
      showToast,
      updateDeviceState,
    ],
  );

  const startHoldRepeat = (action: string) => {
    if (repeatTimeoutRef.current) window.clearTimeout(repeatTimeoutRef.current);
    if (repeatIntervalRef.current)
      window.clearInterval(repeatIntervalRef.current);
    repeatTimeoutRef.current = window.setTimeout(() => {
      repeatIntervalRef.current = window.setInterval(() => {
        void runAction(action);
      }, 150);
    }, 440);
  };

  const stopHoldRepeat = () => {
    if (repeatTimeoutRef.current) {
      window.clearTimeout(repeatTimeoutRef.current);
      repeatTimeoutRef.current = null;
    }
    if (repeatIntervalRef.current) {
      window.clearInterval(repeatIntervalRef.current);
      repeatIntervalRef.current = null;
    }
  };

  // Multi-touch trackpad handlers matching reference behavior
  const flushTrackpad = useCallback(() => {
    rafRef.current = 0;
    const acc = accRef.current;
    if (acc.scrollY) {
      const dy2 = Math.round(acc.scrollY);
      if (dy2) {
        void runAction({ t: "scroll", dx: 0, dy: dy2, dy2 });
        acc.scrollY -= dy2;
      }
    } else if (acc.x || acc.y) {
      const dx = Math.round(acc.x);
      const dy = Math.round(acc.y);
      if (dx || dy) {
        void runAction({ t: "move", dx, dy, dy2: dy });
        acc.x -= dx;
        acc.y -= dy;
      }
    }
  }, [runAction]);

  const handlePadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    ptrsRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrsRef.current.size === 1) {
      movedRef.current = 0;
      t0Ref.current = Date.now();
      maxPtrsRef.current = 1;
    } else {
      maxPtrsRef.current = Math.max(maxPtrsRef.current, ptrsRef.current.size);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPadCursorPulse({
      x: Math.max(12, Math.min(rect.width - 12, e.clientX - rect.left)),
      y: Math.max(12, Math.min(rect.height - 12, e.clientY - rect.top)),
      label: ptrsRef.current.size >= 2 ? "2-Finger Scroll" : "Moving",
    });
  };

  const handlePadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = ptrsRef.current.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    p.x = e.clientX;
    p.y = e.clientY;
    movedRef.current += Math.abs(dx) + Math.abs(dy);

    if (ptrsRef.current.size >= 2) {
      if (e.isPrimary) {
        accRef.current.scrollY += -dy * 0.15;
      }
    } else {
      accRef.current.x += dx * 1.6;
      accRef.current.y += dy * 1.6;
    }
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(flushTrackpad);
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setPadCursorPulse({
      x: Math.max(12, Math.min(rect.width - 12, e.clientX - rect.left)),
      y: Math.max(12, Math.min(rect.height - 12, e.clientY - rect.top)),
      label: ptrsRef.current.size >= 2 ? "Scrolling" : "Cursor",
    });
  };

  const handlePadPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!ptrsRef.current.has(e.pointerId)) return;
    ptrsRef.current.delete(e.pointerId);
    if (
      ptrsRef.current.size === 0 &&
      movedRef.current < 8 &&
      Date.now() - t0Ref.current < 260
    ) {
      const btn = maxPtrsRef.current >= 2 ? "right" : "left";
      void runAction({ t: "click", b: btn });
    }
    if (ptrsRef.current.size === 0) {
      window.setTimeout(() => setPadCursorPulse(null), 220);
    }
  };

  const openAddScreen = () => {
    setFormName("");
    setFormType("tv");
    setFormLink("demo");
    setFormFields({ preset: "tasmota" });
    setIsAddingDesktop(true);
    setMobileScreen("add");
  };

  const handleFormTypeChange = (nextType: DeviceType) => {
    setFormType(nextType);
    const validLinks = Object.entries(LINKS)
      .filter(([, def]) => def.types.includes(nextType))
      .map(([k]) => k as LinkType);
    if (!validLinks.includes(formLink)) {
      setFormLink(validLinks[0] || "demo");
    }
  };

  const handleSaveNewDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const linkDef = LINKS[formLink];
    const missing = linkDef.fields.find(
      (f) => !f.optional && !(formFields[f.key] || "").trim(),
    );
    if (missing) {
      showToast(`Please enter ${missing.label}`);
      return;
    }
    const created: OperatorDevice = {
      id: makeUid(),
      name: formName.trim() || DEVICE_TYPES[formType].label,
      type: formType,
      link: formLink,
      ...(formLink === "demo" ? { state: createDefaultDemoState() } : {}),
    };
    linkDef.fields.forEach((f) => {
      const val = (formFields[f.key] || "").trim();
      if (val) {
        (created as unknown as Record<string, string>)[f.key] = val;
      } else if (f.key === "preset") {
        created.preset = "tasmota";
      }
    });
    setDevices((prev) => [...prev, created]);
    setSelectedId(created.id);
    setIsAddingDesktop(false);
    setMobileScreen("remote");
    showToast(`${created.name} added`);
  };

  const handleAddDemoSuite = () => {
    const suite: OperatorDevice[] = (
      ["tv", "pc", "light", "fan", "phone"] as DeviceType[]
    ).map((t) => ({
      id: makeUid(),
      name: `Demo ${DEVICE_TYPES[t].label}`,
      type: t,
      link: "demo",
      state: { ...createDefaultDemoState(), power: true },
    }));
    setDevices((prev) => [...prev, ...suite]);
    setSelectedId(suite[0].id);
    setIsAddingDesktop(false);
    setMobileScreen("remote");
    showToast("Demo device suite added");
  };

  const handleDeleteDevice = (id: string) => {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      window.setTimeout(() => {
        setConfirmDeleteId((curr) => (curr === id ? null : curr));
      }, 2600);
      return;
    }
    setConfirmDeleteId(null);
    setDevices((prev) => {
      const next = prev.filter((d) => d.id !== id);
      if (selectedId === id) {
        setSelectedId(next[0]?.id ?? null);
        if (mobileScreen === "remote") setMobileScreen("devices");
      }
      return next;
    });
    showToast("Device removed");
  };

  const downloadFile = (filename: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast(`Downloaded ${filename}`);
  };

  const theme = darkMode
    ? {
        bg: "bg-[#000000] text-[#F5F5F7]",
        header: "bg-[#1C1C1E]/85 border-white/[0.1]",
        card: "bg-[#1C1C1E] border-white/[0.1]",
        subCard: "bg-[#2C2C2E] border-white/[0.08]",
        keyBtn:
          "bg-[#2C2C2E] hover:bg-[#3A3A3C] active:bg-[#5E5CE6] active:text-white border-white/[0.08] text-[#F5F5F7]",
        primaryBtn:
          "bg-[#0A84FF] hover:bg-[#0070DF] text-white border-transparent",
        dangerBtn:
          "bg-[#3A191E] hover:bg-[#522129] text-[#FF6961] border-[#6B2A37]",
        muted: "text-[#98989D]",
        input:
          "bg-[#2C2C2E] border-white/[0.12] text-white placeholder:text-[#8E8E93] focus:border-[#0A84FF]",
        activeRow: "bg-[#0A84FF]/15 border-[#0A84FF]/50",
        pill: "bg-[#2C2C2E] text-[#F5F5F7]",
      }
    : {
        bg: "bg-[#F5F5F7] text-[#1D1D1F]",
        header: "bg-white/85 border-black/[0.08]",
        card: "bg-white border-black/[0.07] shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        subCard: "bg-[#F5F5F7] border-black/[0.06]",
        keyBtn:
          "bg-[#F5F5F7] hover:bg-[#E8E8ED] active:bg-[#0071E3] active:text-white border-black/[0.07] text-[#1D1D1F]",
        primaryBtn:
          "bg-[#0071E3] hover:bg-[#0062C4] text-white border-transparent",
        dangerBtn:
          "bg-[#FFF1F0] hover:bg-[#FFE1DF] text-[#D70015] border-[#FFCCC7]",
        muted: "text-[#6E6E73]",
        input:
          "bg-[#F5F5F7] border-black/[0.08] text-[#1D1D1F] placeholder:text-[#86868B] focus:bg-white focus:border-[#0071E3]",
        activeRow: "bg-[#0071E3]/[0.08] border-[#0071E3]/45",
        pill: "bg-[#F5F5F7] text-[#1D1D1F]",
      };

  const renderDeviceGlyph = (type: DeviceType, size = 20) => {
    switch (type) {
      case "tv":
        return <Tv size={size} />;
      case "pc":
        return <Laptop size={size} />;
      case "light":
        return <Lightbulb size={size} />;
      case "fan":
        return <Fan size={size} />;
      case "phone":
        return <Smartphone size={size} />;
    }
  };

  const renderAddDeviceForm = () => {
    const selectedLink = LINKS[formLink];
    const validLinks = (Object.keys(LINKS) as LinkType[]).filter((k) =>
      LINKS[k].types.includes(formType),
    );
    return (
      <div className={`rounded-[26px] border p-5 sm:p-6 ${theme.card}`}>
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#0071E3]">
              New Hardware Pairing
            </span>
            <h2 className="text-xl font-bold tracking-tight">Add Device</h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsAddingDesktop(false);
              setMobileScreen(devices.length ? "devices" : "devices");
            }}
            aria-label="Cancel add device"
            className={`w-9 h-9 rounded-full flex items-center justify-center border cursor-pointer transition-colors ${theme.keyBtn}`}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSaveNewDevice} className="space-y-4 mt-4">
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold ${theme.muted}`}>
              Device Name
            </label>
            <input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={`e.g. Living room ${DEVICE_TYPES[formType].label}`}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none transition-colors ${theme.input}`}
            />
          </div>

          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold ${theme.muted}`}>
              Device Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(DEVICE_TYPES) as DeviceType[]).map((t) => {
                const active = formType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleFormTypeChange(t)}
                    className={`min-h-[54px] px-2.5 py-2 rounded-2xl border flex flex-col items-center justify-center gap-1 text-xs font-semibold cursor-pointer transition-all ${
                      active
                        ? "bg-[#0071E3] text-white border-[#0071E3] shadow-sm"
                        : theme.keyBtn
                    }`}
                  >
                    {renderDeviceGlyph(t, 18)}
                    <span className="truncate max-w-full">
                      {DEVICE_TYPES[t].label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold ${theme.muted}`}>
              Connection Adapter
            </label>
            <select
              value={formLink}
              onChange={(e) => setFormLink(e.target.value as LinkType)}
              aria-label="Connection adapter"
              className={`w-full px-3.5 py-2.5 rounded-xl border text-sm outline-none cursor-pointer ${theme.input}`}
            >
              {validLinks.map((k) => (
                <option key={k} value={k}>
                  {LINKS[k].name}
                </option>
              ))}
            </select>
          </div>

          {selectedLink.fields.length > 0 && (
            <div className={`rounded-2xl border p-4 space-y-3 ${theme.subCard}`}>
              {selectedLink.fields.map((f) => (
                <div key={String(f.key)} className="space-y-1">
                  <label
                    className={`block text-xs font-semibold ${theme.muted}`}
                  >
                    {f.label}
                  </label>
                  {f.options ? (
                    <select
                      value={formFields[String(f.key)] || f.options[0]}
                      onChange={(e) =>
                        setFormFields((prev) => ({
                          ...prev,
                          [String(f.key)]: e.target.value,
                        }))
                      }
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none cursor-pointer ${theme.input}`}
                    >
                      {f.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={f.secret ? "password" : "text"}
                      value={formFields[String(f.key)] || ""}
                      onChange={(e) =>
                        setFormFields((prev) => ({
                          ...prev,
                          [String(f.key)]: e.target.value,
                        }))
                      }
                      placeholder={f.placeholder}
                      className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${theme.input}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {formLink === "pc" && (
            <div
              className={`rounded-2xl border p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs ${theme.subCard}`}
            >
              <span className={theme.muted}>
                Need the companion agent running on Windows, Linux, or Mac?
              </span>
              <button
                type="button"
                onClick={() => setCompanionModalOpen(true)}
                className="px-3 py-1.5 rounded-full bg-[#5E5CE6] text-white font-semibold cursor-pointer hover:opacity-90 whitespace-nowrap"
              >
                Open PC Companion Kit
              </button>
            </div>
          )}

          <p className={`text-xs leading-relaxed ${theme.muted}`}>
            Hotspot &amp; USB tethering are full network paths: connect both
            devices to the same WiFi, phone hotspot, or USB tether, then enter
            the device IP or companion port.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              type="submit"
              className={`min-h-[46px] flex-1 px-5 py-2.5 rounded-full font-semibold text-sm cursor-pointer transition-colors ${theme.primaryBtn}`}
            >
              Save Device
            </button>
            <button
              type="button"
              onClick={handleAddDemoSuite}
              className={`min-h-[46px] px-4 py-2.5 rounded-full border text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${theme.keyBtn}`}
            >
              Add 5 Demo Devices
            </button>
          </div>
        </form>
      </div>
    );
  };

  const renderRemoteConsole = (d: OperatorDevice) => {
    const s = d.state || createDefaultDemoState();
    const isBtConnected = Boolean(btConnectedIds[d.id]);
    const isWsConnected = Boolean(wsConnectedIds[d.id]);
    const isRinging =
      d.type === "phone" && s.ringingUntil && s.ringingUntil > Date.now();

    return (
      <div className="space-y-4">
        {/* Active Device Header Card */}
        <div
          className={`rounded-[26px] border p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 ${theme.card}`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              style={{ backgroundColor: `${DEVICE_TYPES[d.type].accent}1A`, color: DEVICE_TYPES[d.type].accent }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            >
              {renderDeviceGlyph(d.type, 24)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight truncate">
                  {d.name}
                </h2>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    d.link === "demo"
                      ? "bg-[#34C759]/15 text-[#248A3D]"
                      : isBtConnected || isWsConnected
                        ? "bg-[#34C759]/15 text-[#248A3D]"
                        : "bg-[#0071E3]/12 text-[#0071E3]"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {LINKS[d.link].short}
                </span>
              </div>
              <p className={`text-xs truncate ${theme.muted}`}>
                {d.link === "demo"
                  ? `${s.power ? "Powered ON" : "Standby"} · Last action: ${s.last || "Ready"}`
                  : d.host || d.ip || d.base || d.service || LINKS[d.link].name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {d.link === "bluetooth" && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    await getBtChar(d);
                    showToast("Bluetooth GATT connected");
                  } catch (err: unknown) {
                    showToast(
                      err instanceof Error ? err.message : "Bluetooth failed",
                    );
                  }
                }}
                className={`min-h-[40px] px-3.5 py-2 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                  isBtConnected
                    ? "bg-[#34C759] text-white"
                    : theme.primaryBtn
                }`}
              >
                <Bluetooth size={14} />
                <span>{isBtConnected ? "BT Paired" : "Connect BT"}</span>
              </button>
            )}

            {d.type === "pc" && (
              <button
                type="button"
                onClick={() => setCompanionModalOpen(true)}
                className={`min-h-[40px] px-3.5 py-2 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors ${theme.keyBtn}`}
              >
                <Terminal size={14} />
                <span>Companion Kit</span>
              </button>
            )}
          </div>
        </div>

        {/* TV REMOTE CONTROLLER (Apple TV Remote style) */}
        {d.type === "tv" && (
          <div className={`rounded-[28px] border p-5 sm:p-6 space-y-5 ${theme.card}`}>
            {d.link === "demo" && (
              <div
                className={`rounded-2xl border p-3.5 flex flex-wrap items-center justify-between gap-3 ${theme.subCard}`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      s.power ? "bg-[#34C759]" : "bg-[#8E8E93]"
                    }`}
                  />
                  <div className="text-xs">
                    <span className="font-semibold">
                      {s.power ? "TV Display Active" : "TV Standby"}
                    </span>
                    <span className={`ml-2 ${theme.muted}`}>
                      {s.source || "HDMI 1"} · CH {s.channel || 12} ·{" "}
                      {s.playing ? "Playing" : "Paused"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold tabular-nums">
                  {s.muted ? (
                    <span className="text-[#FF3B30] inline-flex items-center gap-1">
                      <VolumeX size={13} /> Muted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Volume2 size={13} className="text-[#0071E3]" />
                      Vol {s.vol}%
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Top Power / Source / Mute */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => void runAction("power")}
                className={`min-h-[50px] rounded-2xl border font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 ${
                  s.power && d.link === "demo" ? theme.dangerBtn : theme.keyBtn
                }`}
              >
                <Power size={16} />
                <span>Power</span>
              </button>
              <button
                type="button"
                onClick={() => void runAction("source")}
                className={`min-h-[50px] rounded-2xl border font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
              >
                <Monitor size={16} />
                <span>Source</span>
              </button>
              <button
                type="button"
                onClick={() => void runAction("mute")}
                className={`min-h-[50px] rounded-2xl border font-semibold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-95 ${
                  s.muted && d.link === "demo"
                    ? "bg-[#FF9F0A] text-white border-transparent"
                    : theme.keyBtn
                }`}
              >
                <VolumeX size={16} />
                <span>Mute</span>
              </button>
            </div>

            {/* Apple TV Circular Clickpad Ring */}
            <div className="flex justify-center py-2">
              <div
                className={`relative w-60 h-60 rounded-full border p-3 grid grid-cols-3 grid-rows-3 place-items-center shadow-inner ${theme.subCard}`}
              >
                <span />
                <button
                  type="button"
                  aria-label="Up"
                  onClick={() => void runAction("up")}
                  className={`w-16 h-16 rounded-full border flex items-center justify-center cursor-pointer transition-transform active:scale-90 ${theme.keyBtn}`}
                >
                  <ChevronUp size={24} />
                </button>
                <span />

                <button
                  type="button"
                  aria-label="Left"
                  onClick={() => void runAction("left")}
                  className={`w-16 h-16 rounded-full border flex items-center justify-center cursor-pointer transition-transform active:scale-90 ${theme.keyBtn}`}
                >
                  <ChevronLeft size={24} />
                </button>
                <button
                  type="button"
                  aria-label="Select OK"
                  onClick={() => void runAction("ok")}
                  className={`w-20 h-20 rounded-full font-bold text-sm shadow-md flex items-center justify-center cursor-pointer transition-transform active:scale-90 ${theme.primaryBtn}`}
                >
                  OK
                </button>
                <button
                  type="button"
                  aria-label="Right"
                  onClick={() => void runAction("right")}
                  className={`w-16 h-16 rounded-full border flex items-center justify-center cursor-pointer transition-transform active:scale-90 ${theme.keyBtn}`}
                >
                  <ChevronRight size={24} />
                </button>

                <span />
                <button
                  type="button"
                  aria-label="Down"
                  onClick={() => void runAction("down")}
                  className={`w-16 h-16 rounded-full border flex items-center justify-center cursor-pointer transition-transform active:scale-90 ${theme.keyBtn}`}
                >
                  <ChevronDown size={24} />
                </button>
                <span />
              </div>
            </div>

            {/* Back / Home / Menu */}
            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              {[
                { id: "back", label: "Back" },
                { id: "home", label: "Home" },
                { id: "menu", label: "Menu" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => void runAction(btn.id)}
                  className={`min-h-[48px] rounded-2xl border text-xs font-semibold cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Volume + Channel Rockers */}
            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <div className={`rounded-2xl border p-1.5 grid gap-1.5 ${theme.subCard}`}>
                <button
                  type="button"
                  onClick={() => void runAction("volup")}
                  onPointerDown={() => startHoldRepeat("volup")}
                  onPointerUp={stopHoldRepeat}
                  onPointerLeave={stopHoldRepeat}
                  onPointerCancel={stopHoldRepeat}
                  className={`min-h-[48px] rounded-xl border text-xs font-bold cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
                >
                  Vol +
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("voldown")}
                  onPointerDown={() => startHoldRepeat("voldown")}
                  onPointerUp={stopHoldRepeat}
                  onPointerLeave={stopHoldRepeat}
                  onPointerCancel={stopHoldRepeat}
                  className={`min-h-[48px] rounded-xl border text-xs font-bold cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
                >
                  Vol −
                </button>
              </div>
              <div className={`rounded-2xl border p-1.5 grid gap-1.5 ${theme.subCard}`}>
                <button
                  type="button"
                  onClick={() => void runAction("chup")}
                  className={`min-h-[48px] rounded-xl border text-xs font-bold cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
                >
                  CH +
                </button>
                <button
                  type="button"
                  onClick={() => void runAction("chdown")}
                  className={`min-h-[48px] rounded-xl border text-xs font-bold cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
                >
                  CH −
                </button>
              </div>
            </div>

            {/* Media Controls */}
            <div className="grid grid-cols-4 gap-2.5 max-w-md mx-auto">
              <button
                type="button"
                aria-label="Previous"
                onClick={() => void runAction("prev")}
                className={`min-h-[48px] rounded-2xl border flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
              >
                <SkipBack size={18} />
              </button>
              <button
                type="button"
                aria-label="Play"
                onClick={() => void runAction("play")}
                className={`min-h-[48px] rounded-2xl border flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
              >
                <Play size={18} />
              </button>
              <button
                type="button"
                aria-label="Pause"
                onClick={() => void runAction("pause")}
                className={`min-h-[48px] rounded-2xl border flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
              >
                <Pause size={18} />
              </button>
              <button
                type="button"
                aria-label="Next"
                onClick={() => void runAction("next")}
                className={`min-h-[48px] rounded-2xl border flex items-center justify-center cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
              >
                <SkipForward size={18} />
              </button>
            </div>
          </div>
        )}

        {/* PC / LAPTOP TRACKPAD + KEYBOARD CONTROLLER */}
        {d.type === "pc" && (
          <div className="space-y-4">
            {d.link === "demo" && (
              <div
                className={`rounded-2xl border px-4 py-3 flex flex-wrap items-center justify-between gap-2 ${theme.card}`}
              >
                <span className="text-xs font-semibold inline-flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      s.power ? "bg-[#34C759]" : "bg-[#FF9F0A]"
                    }`}
                  />
                  {s.cursorInfo || "Trackpad Ready"}
                </span>
                <span className={`text-xs tabular-nums ${theme.muted}`}>
                  Vol {s.muted ? "Muted" : `${s.vol}%`} ·{" "}
                  {s.playing ? "Playing" : "Idle"}
                </span>
              </div>
            )}

            {/* Trackpad Glass Surface */}
            <div className={`rounded-[28px] border p-4 sm:p-5 space-y-3 ${theme.card}`}>
              <div
                ref={padRef}
                onPointerDown={handlePadPointerDown}
                onPointerMove={handlePadPointerMove}
                onPointerUp={handlePadPointerUp}
                onPointerCancel={handlePadPointerUp}
                style={{ touchAction: "none" }}
                className={`relative h-64 sm:h-72 rounded-[22px] border flex flex-col items-center justify-center select-none overflow-hidden cursor-crosshair ${
                  darkMode
                    ? "bg-gradient-to-b from-[#252528] to-[#1C1C1E] border-white/[0.1]"
                    : "bg-gradient-to-b from-[#F8F8FA] to-[#ECECF0] border-black/[0.08]"
                }`}
              >
                <div className="text-center pointer-events-none px-4 space-y-1">
                  <div className="text-sm font-semibold">
                    Apple Multi-Touch Trackpad
                  </div>
                  <div className={`text-xs ${theme.muted}`}>
                    1 finger drag to move · Tap = left click · 2-finger tap = right click · 2-finger drag = scroll
                  </div>
                </div>
                {padCursorPulse && (
                  <div
                    style={{
                      left: padCursorPulse.x,
                      top: padCursorPulse.y,
                      transform: "translate(-50%, -50%)",
                    }}
                    className="pointer-events-none absolute flex flex-col items-center"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#5E5CE6]/25 border border-[#5E5CE6] animate-ping" />
                    <span className="mt-1 px-2 py-0.5 rounded-full bg-[#5E5CE6] text-white text-[10px] font-semibold whitespace-nowrap">
                      {padCursorPulse.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { b: "left", label: "Left Click" },
                  { b: "middle", label: "Middle" },
                  { b: "right", label: "Right Click" },
                ].map((btn) => (
                  <button
                    key={btn.b}
                    type="button"
                    onClick={() => void runAction({ t: "click", b: btn.b })}
                    className={`min-h-[46px] rounded-2xl border text-xs font-semibold cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Type + Keyboard + Shortcuts + Media + Power */}
            <div className={`rounded-[28px] border p-4 sm:p-5 space-y-4 ${theme.card}`}>
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${theme.muted}`}>
                  Type Text on PC
                </label>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!pcText) return;
                    void runAction({ t: "text", v: pcText });
                    setPcText("");
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={pcText}
                    onChange={(e) => setPcText(e.target.value)}
                    placeholder="Type text to send to active PC window…"
                    className={`flex-1 min-w-0 px-3.5 py-2.5 rounded-xl border text-sm outline-none ${theme.input}`}
                  />
                  <button
                    type="submit"
                    className={`min-h-[44px] px-5 rounded-xl font-semibold text-xs cursor-pointer transition-colors shrink-0 ${theme.primaryBtn}`}
                  >
                    Send
                  </button>
                </form>
              </div>

              {/* Navigation & Editing Keycaps */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { k: "esc", label: "Esc" },
                  { k: "tab", label: "Tab" },
                  { k: "enter", label: "Enter ⏎" },
                  { k: "backspace", label: "⌫" },
                  { k: "up", label: "↑" },
                  { k: "down", label: "↓" },
                  { k: "left", label: "←" },
                  { k: "right", label: "→" },
                  { k: "delete", label: "Del" },
                  { k: "home", label: "Home" },
                  { k: "end", label: "End" },
                  { k: "space", label: "Space ␣" },
                ].map((item) => (
                  <button
                    key={item.k}
                    type="button"
                    onClick={() =>
                      void runAction({ t: "key", k: item.k, mods: [] })
                    }
                    className={`min-h-[44px] rounded-xl border text-xs font-semibold cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Shortcuts Row */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { combo: "ctrl,c", label: "Copy" },
                  { combo: "ctrl,v", label: "Paste" },
                  { combo: "alt,tab", label: "Alt-Tab" },
                  { combo: "win", label: "Win / ⌘" },
                ].map((sc) => (
                  <button
                    key={sc.combo}
                    type="button"
                    onClick={() => {
                      const parts = sc.combo.split(",");
                      const k = parts.pop() || "";
                      void runAction({ t: "key", k, mods: parts });
                    }}
                    className={`min-h-[44px] rounded-xl border text-xs font-semibold cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>

              {/* Media Row */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { m: "prev", label: "⏮ Prev" },
                  { m: "play", label: "⏯ Play" },
                  { m: "next", label: "⏭ Next" },
                  { m: "mute", label: "🔇 Mute" },
                  { m: "vol-", label: "Vol −" },
                  { m: "vol+", label: "Vol +" },
                ].map((md) => (
                  <button
                    key={md.m}
                    type="button"
                    onClick={() => void runAction({ t: "media", a: md.m })}
                    className={`min-h-[44px] rounded-xl border text-xs font-semibold cursor-pointer transition-transform active:scale-95 ${theme.keyBtn}`}
                  >
                    {md.label}
                  </button>
                ))}
              </div>

              {/* System Power Controls (2-tap inline confirmation for Restart/Off) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void runAction({ t: "sys", a: "lock" })}
                  className={`min-h-[46px] rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${theme.keyBtn}`}
                >
                  <Lock size={14} />
                  <span>Lock</span>
                </button>
                <button
                  type="button"
                  onClick={() => void runAction({ t: "sys", a: "sleep" })}
                  className={`min-h-[46px] rounded-xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${theme.keyBtn}`}
                >
                  <Moon size={14} />
                  <span>Sleep</span>
                </button>
                {(["restart", "shutdown"] as const).map((sysAct) => {
                  const armed = confirmSysAction === sysAct;
                  return (
                    <button
                      key={sysAct}
                      type="button"
                      onClick={() => {
                        if (!armed) {
                          setConfirmSysAction(sysAct);
                          window.setTimeout(() => {
                            setConfirmSysAction((curr) =>
                              curr === sysAct ? null : curr,
                            );
                          }, 2800);
                          return;
                        }
                        setConfirmSysAction(null);
                        void runAction({ t: "sys", a: sysAct });
                      }}
                      className={`min-h-[46px] rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                        armed
                          ? "bg-[#FF3B30] text-white border-[#FF3B30]"
                          : theme.dangerBtn
                      }`}
                    >
                      {armed
                        ? `Tap to ${sysAct}`
                        : sysAct === "restart"
                          ? "Restart"
                          : "Shut Down"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* SMART LIGHT CONTROLLER */}
        {d.type === "light" && (
          <div className={`rounded-[28px] border p-5 sm:p-7 space-y-5 ${theme.card}`}>
            <div className="flex flex-col items-center py-2 space-y-3">
              <div
                style={{
                  background: s.power ? s.color : darkMode ? "#111114" : "#E5E5EA",
                  boxShadow: s.power
                    ? `0 0 ${24 + Math.round(s.bright * 0.45)}px ${s.color}`
                    : "none",
                  opacity: s.power ? 0.35 + s.bright / 150 : 1,
                }}
                className="w-28 h-28 rounded-full border-2 border-black/10 dark:border-white/15 flex items-center justify-center transition-all duration-300"
              >
                <Lightbulb
                  size={40}
                  className={
                    s.power ? "text-[#1D1D1F]/80" : "text-[#8E8E93]"
                  }
                />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">
                  {s.power ? `Illuminated · ${s.bright}%` : "Light Off"}
                </div>
                <div className={`text-xs uppercase tabular-nums ${theme.muted}`}>
                  Color {s.color}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => void runAction("on")}
                className={`min-h-[48px] rounded-2xl text-xs font-semibold cursor-pointer ${theme.primaryBtn}`}
              >
                Turn On
              </button>
              <button
                type="button"
                onClick={() => void runAction("off")}
                className={`min-h-[48px] rounded-2xl border text-xs font-semibold cursor-pointer ${theme.keyBtn}`}
              >
                Turn Off
              </button>
              <button
                type="button"
                onClick={() => void runAction("toggle")}
                className={`min-h-[48px] rounded-2xl border text-xs font-semibold cursor-pointer ${theme.keyBtn}`}
              >
                Toggle
              </button>
            </div>

            <div className="max-w-md mx-auto space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className={theme.muted}>Brightness</span>
                  <span className="tabular-nums">{s.bright}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={s.bright}
                  aria-label="Light brightness"
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    applyDemoCommand(d, "brightness", next);
                    if (d.link !== "demo") void runAction("brightness", next);
                  }}
                  className="w-full accent-[#FF9F0A] cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                  <span className={theme.muted}>Color Studio</span>
                  <span className="tabular-nums uppercase">{s.color}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={s.color}
                    aria-label="Pick light color"
                    onChange={(e) => {
                      const nextCol = e.target.value;
                      applyDemoCommand(d, "color", nextCol);
                      if (d.link !== "demo") void runAction("color", nextCol);
                    }}
                    className="w-12 h-11 rounded-xl border border-black/10 dark:border-white/15 cursor-pointer bg-transparent shrink-0"
                  />
                  <div className="flex-1 grid grid-cols-6 gap-2">
                    {LIGHT_SWATCHES.map((col) => (
                      <button
                        key={col}
                        type="button"
                        aria-label={`Set light color ${col}`}
                        onClick={() => {
                          applyDemoCommand(d, "color", col);
                          if (d.link !== "demo") void runAction("color", col);
                        }}
                        style={{ backgroundColor: col }}
                        className={`h-11 rounded-xl border-2 cursor-pointer transition-transform active:scale-95 ${
                          s.color.toLowerCase() === col.toLowerCase()
                            ? "border-[#0071E3] scale-105"
                            : "border-black/10"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SMART FAN CONTROLLER */}
        {d.type === "fan" && (
          <div className={`rounded-[28px] border p-5 sm:p-7 space-y-5 ${theme.card}`}>
            <div className="flex flex-col items-center py-2 space-y-3">
              <div
                style={{
                  animation: s.power
                    ? `spin ${s.speed === 3 ? "0.45s" : s.speed === 2 ? "0.85s" : "1.5s"} linear infinite`
                    : "none",
                }}
                className={`w-28 h-28 rounded-full border-2 flex items-center justify-center transition-colors ${
                  s.power
                    ? "bg-[#30B0C7]/15 border-[#30B0C7] text-[#30B0C7]"
                    : theme.subCard
                }`}
              >
                <Fan size={52} />
              </div>
              <div className="text-center">
                <div className="text-sm font-bold">
                  {s.power ? `Running · Speed ${s.speed}` : "Fan Off"}
                </div>
                <div className={`text-xs ${theme.muted}`}>
                  Oscillation: {s.osc ? "Sweeping" : "Fixed"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => void runAction("on")}
                className={`min-h-[48px] rounded-2xl text-xs font-semibold cursor-pointer ${theme.primaryBtn}`}
              >
                On
              </button>
              <button
                type="button"
                onClick={() => void runAction("off")}
                className={`min-h-[48px] rounded-2xl border text-xs font-semibold cursor-pointer ${theme.keyBtn}`}
              >
                Off
              </button>
              <button
                type="button"
                onClick={() => void runAction("osc")}
                className={`min-h-[48px] rounded-2xl border text-xs font-semibold cursor-pointer ${
                  s.osc && d.link === "demo"
                    ? "bg-[#30B0C7] text-white border-[#30B0C7]"
                    : theme.keyBtn
                }`}
              >
                Oscillate
              </button>
            </div>

            <div className="max-w-md mx-auto space-y-1.5">
              <div className={`text-xs font-semibold ${theme.muted}`}>
                Airflow Speed
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {[1, 2, 3].map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => void runAction("speed", sp)}
                    className={`min-h-[48px] rounded-2xl border text-sm font-bold cursor-pointer transition-colors ${
                      s.power && s.speed === sp && d.link === "demo"
                        ? "bg-[#30B0C7] text-white border-[#30B0C7]"
                        : theme.keyBtn
                    }`}
                  >
                    Speed {sp}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PHONE REMOTE CONTROLLER */}
        {d.type === "phone" && (
          <div className={`rounded-[28px] border p-5 sm:p-6 space-y-5 ${theme.card}`}>
            {d.link === "demo" && (
              <div
                className={`rounded-2xl border p-4 flex items-center justify-between gap-3 ${theme.subCard}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isRinging
                        ? "bg-[#34C759] text-white animate-bounce"
                        : "bg-[#34C759]/15 text-[#34C759]"
                    }`}
                  >
                    <Radio size={18} />
                  </div>
                  <div className="text-xs">
                    <div className="font-bold">
                      {isRinging
                        ? "Pinging Device Ringtone…"
                        : s.power
                          ? "Phone Connected"
                          : "Screen Locked"}
                    </div>
                    <div className={theme.muted}>
                      Volume: {s.muted ? "Muted" : `${s.vol}%`} ·{" "}
                      {s.playing ? "Playing Media" : "Paused"}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => void runAction("power")}
                className={`min-h-[50px] rounded-2xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${theme.dangerBtn}`}
              >
                <Power size={15} />
                <span>Lock / Power</span>
              </button>
              <button
                type="button"
                onClick={() => void runAction("mute")}
                className={`min-h-[50px] rounded-2xl border text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${theme.keyBtn}`}
              >
                <VolumeX size={15} />
                <span>Mute</span>
              </button>
              <button
                type="button"
                onClick={() => void runAction("find")}
                className={`min-h-[50px] rounded-2xl text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer ${theme.primaryBtn}`}
              >
                <Sparkles size={15} />
                <span>Find Ping</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
              <button
                type="button"
                aria-label="Previous track"
                onClick={() => void runAction("prev")}
                className={`min-h-[50px] rounded-2xl border flex items-center justify-center cursor-pointer ${theme.keyBtn}`}
              >
                <SkipBack size={18} />
              </button>
              <button
                type="button"
                aria-label="Play or Pause"
                onClick={() => void runAction("play")}
                className={`min-h-[50px] rounded-2xl border flex items-center justify-center cursor-pointer ${theme.keyBtn}`}
              >
                {s.playing ? <Pause size={18} /> : <Play size={18} />}
              </button>
              <button
                type="button"
                aria-label="Next track"
                onClick={() => void runAction("next")}
                className={`min-h-[50px] rounded-2xl border flex items-center justify-center cursor-pointer ${theme.keyBtn}`}
              >
                <SkipForward size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-md mx-auto">
              <button
                type="button"
                onClick={() => void runAction("volup")}
                onPointerDown={() => startHoldRepeat("volup")}
                onPointerUp={stopHoldRepeat}
                onPointerLeave={stopHoldRepeat}
                onPointerCancel={stopHoldRepeat}
                className={`min-h-[50px] rounded-2xl border text-xs font-bold cursor-pointer ${theme.keyBtn}`}
              >
                Volume +
              </button>
              <button
                type="button"
                onClick={() => void runAction("voldown")}
                onPointerDown={() => startHoldRepeat("voldown")}
                onPointerUp={stopHoldRepeat}
                onPointerLeave={stopHoldRepeat}
                onPointerCancel={stopHoldRepeat}
                className={`min-h-[50px] rounded-2xl border text-xs font-bold cursor-pointer ${theme.keyBtn}`}
              >
                Volume −
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      style={APPLE_FONT_STYLE}
      className={`min-h-screen flex flex-col transition-colors duration-200 pb-20 lg:pb-8 ${theme.bg}`}
    >
      {/* Top Apple Frosted Bar */}
      <header
        className={`sticky top-0 z-30 border-b backdrop-blur-2xl ${theme.header}`}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            {mobileScreen !== "devices" ? (
              <button
                type="button"
                onClick={() => {
                  setMobileScreen("devices");
                  setIsAddingDesktop(false);
                }}
                aria-label="Back to devices"
                className={`lg:hidden w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer shrink-0 ${theme.keyBtn}`}
              >
                <ArrowLeft size={16} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={onBackStore || onBackHome}
              title="Back to Gamura Store"
              className={`min-h-[38px] px-3 py-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${theme.keyBtn}`}
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Store</span>
            </button>

            <button
              type="button"
              onClick={onBackHome}
              title="Gamura Home"
              className={`min-h-[38px] px-3 py-1.5 rounded-full border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap ${theme.keyBtn}`}
            >
              <Home size={14} />
              <span className="hidden md:inline">Home</span>
            </button>

            <div className="flex items-center gap-2.5 min-w-0 pl-1">
              <img
                src={OPERATOR_ICON_SRC}
                alt="GAMURA OPERATOR"
                className="w-8 h-8 rounded-[9px] object-cover shadow-xs shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-sm sm:text-base font-bold tracking-tight truncate">
                  GAMURA OPERATOR
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleUniverseInstall}
              className={`hidden md:inline-flex min-h-[36px] px-3 py-1.5 rounded-full text-xs font-semibold items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap ${
                installedInUniverse
                  ? "bg-[#34C759]/15 text-[#248A3D]"
                  : `border ${theme.keyBtn}`
              }`}
            >
              {installedInUniverse ? <Check size={13} /> : <Plus size={13} />}
              <span>{installedInUniverse ? "In Universe" : "Add to Universe"}</span>
            </button>

            <button
              type="button"
              onClick={() => setCompanionModalOpen(true)}
              className={`hidden sm:inline-flex min-h-[36px] px-3 py-1.5 rounded-full border text-xs font-semibold items-center gap-1.5 cursor-pointer whitespace-nowrap ${theme.keyBtn}`}
            >
              <Terminal size={13} />
              <span>PC Setup</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              aria-label="Toggle Light or Dark Apple Appearance"
              className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer shrink-0 ${theme.keyBtn}`}
            >
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <button
              type="button"
              onClick={openAddScreen}
              aria-label="Add Device"
              className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 ${theme.primaryBtn}`}
            >
              <Plus size={15} />
              <span className="hidden sm:inline">Add Device</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[330px_1fr] gap-5 items-start">
          {/* Sidebar Device List (Always shown on desktop; shown on mobile when screen === 'devices') */}
          <aside
            className={`space-y-3 ${
              mobileScreen === "devices" ? "block" : "hidden lg:block"
            }`}
          >
            <div className={`rounded-[26px] border p-4 space-y-3 ${theme.card}`}>
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-sm font-bold tracking-tight">
                    Paired Devices
                  </h2>
                  <p className={`text-[11px] ${theme.muted}`}>
                    {devices.length}{" "}
                    {devices.length === 1 ? "controller" : "controllers"} ready
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDemoSuite}
                  title="Add simulated demo TV, PC, Light, Fan & Phone"
                  className={`px-2.5 py-1 rounded-full border text-[11px] font-semibold cursor-pointer whitespace-nowrap ${theme.keyBtn}`}
                >
                  + Demo Set
                </button>
              </div>

              {devices.length > 0 ? (
                <div className="space-y-2">
                  {devices.map((d) => {
                    const isSelected = activeDevice?.id === d.id && !isAddingDesktop;
                    const armedDelete = confirmDeleteId === d.id;
                    return (
                      <div
                        key={d.id}
                        onClick={() => {
                          setSelectedId(d.id);
                          setIsAddingDesktop(false);
                          setMobileScreen("remote");
                        }}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(d.id);
                            setIsAddingDesktop(false);
                            setMobileScreen("remote");
                          }
                        }}
                        className={`rounded-2xl border p-3 flex items-center gap-3 cursor-pointer transition-all ${
                          isSelected ? theme.activeRow : theme.subCard
                        }`}
                      >
                        <div
                          style={{
                            backgroundColor: `${DEVICE_TYPES[d.type].accent}1A`,
                            color: DEVICE_TYPES[d.type].accent,
                          }}
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        >
                          {renderDeviceGlyph(d.type, 19)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold truncate">
                            {d.name}
                          </div>
                          <div className={`text-[11px] truncate ${theme.muted}`}>
                            {LINKS[d.link].short}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDevice(d.id);
                          }}
                          aria-label={`Remove ${d.name}`}
                          className={`min-h-[32px] px-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition-colors shrink-0 ${
                            armedDelete
                              ? "bg-[#FF3B30] text-white border-[#FF3B30]"
                              : theme.keyBtn
                          }`}
                        >
                          {armedDelete ? "Confirm" : <Trash2 size={14} />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center space-y-3">
                  <div
                    className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center ${theme.subCard}`}
                  >
                    <Sliders size={22} className="text-[#0071E3]" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold">No Devices Added</div>
                    <p className={`text-xs ${theme.muted}`}>
                      Add a Roku, Samsung TV, Home Assistant, PC Companion, or
                      try the 5 Demo Devices.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDemoSuite}
                    className={`px-4 py-2 rounded-full text-xs font-semibold cursor-pointer ${theme.primaryBtn}`}
                  >
                    Add Demo Devices
                  </button>
                </div>
              )}
            </div>

            {/* Hardware Network Guide Card */}
            <div className={`rounded-[22px] border p-4 space-y-2 text-xs ${theme.card}`}>
              <div className="font-bold flex items-center gap-1.5">
                <Wifi size={14} className="text-[#0071E3]" />
                <span>Supported Protocols</span>
              </div>
              <p className={`leading-relaxed ${theme.muted}`}>
                Roku ECP (8060), Samsung Tizen WS (8002), Home Assistant REST,
                Tasmota / Shelly / ESP32 HTTP, Web Bluetooth GATT, and PC
                Companion WS (8765).
              </p>
            </div>
          </aside>

          {/* Right Workspace: Add Form OR Active Remote Console */}
          <section
            className={
              mobileScreen !== "devices" ? "block" : "hidden lg:block"
            }
          >
            {isAddingDesktop || mobileScreen === "add" ? (
              renderAddDeviceForm()
            ) : activeDevice ? (
              renderRemoteConsole(activeDevice)
            ) : (
              <div
                className={`rounded-[28px] border p-10 text-center space-y-3 ${theme.card}`}
              >
                <div className="text-base font-bold">
                  Select or Add a Device
                </div>
                <p className={`text-xs max-w-md mx-auto ${theme.muted}`}>
                  Pick any hardware controller from the left list or tap Add
                  Device to pair a smart TV, PC, light, fan, or phone.
                </p>
                <button
                  type="button"
                  onClick={openAddScreen}
                  className={`px-5 py-2.5 rounded-full text-xs font-semibold cursor-pointer ${theme.primaryBtn}`}
                >
                  + Pair New Device
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className={`lg:hidden fixed bottom-0 inset-x-0 z-30 border-t backdrop-blur-2xl px-2 py-1.5 grid grid-cols-4 gap-1 ${theme.header}`}
      >
        <button
          type="button"
          onClick={() => setMobileScreen("devices")}
          className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
            mobileScreen === "devices" ? "text-[#0071E3]" : theme.muted
          }`}
        >
          <Settings2 size={17} />
          <span>Devices</span>
        </button>
        <button
          type="button"
          onClick={() => {
            if (activeDevice) setMobileScreen("remote");
            else openAddScreen();
          }}
          className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
            mobileScreen === "remote" ? "text-[#0071E3]" : theme.muted
          }`}
        >
          <Tv size={17} />
          <span>Remote</span>
        </button>
        <button
          type="button"
          onClick={openAddScreen}
          className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${
            mobileScreen === "add" ? "text-[#0071E3]" : theme.muted
          }`}
        >
          <Plus size={17} />
          <span>Add</span>
        </button>
        <button
          type="button"
          onClick={() => setCompanionModalOpen(true)}
          className={`min-h-[46px] rounded-xl flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold cursor-pointer ${theme.muted}`}
        >
          <Terminal size={17} />
          <span>PC Setup</span>
        </button>
      </nav>

      {/* PC Companion Setup & Download Modal */}
      {companionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="PC Companion Setup"
          onClick={() => setCompanionModalOpen(false)}
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-xl rounded-[28px] border p-5 sm:p-6 shadow-2xl space-y-4 ${theme.card}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#5E5CE6]">
                  PC Companion Agent
                </span>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                  Control Windows, Linux &amp; Mac PCs
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCompanionModalOpen(false)}
                aria-label="Close PC companion modal"
                className={`w-9 h-9 rounded-full border flex items-center justify-center cursor-pointer ${theme.keyBtn}`}
              >
                <X size={16} />
              </button>
            </div>

            <div className={`rounded-2xl border p-4 space-y-2.5 text-xs ${theme.subCard}`}>
              <p className="font-semibold">Quick Setup Steps:</p>
              <ol className={`list-decimal pl-4 space-y-1.5 ${theme.muted}`}>
                <li>
                  Download <span className="font-semibold">server.js</span> and{" "}
                  <span className="font-semibold">package.json</span> into a
                  folder on your PC.
                </li>
                <li>
                  Requirements: Windows uses built-in PowerShell (zero installs),
                  Linux needs <code className="font-mono">xdotool</code>, macOS
                  needs <code className="font-mono">cliclick</code>.
                </li>
                <li>
                  Run <code className="font-mono">npm install &amp;&amp; node server.js</code>{" "}
                  to get your IP:8765 and pairing token.
                </li>
                <li>
                  Connect phone &amp; PC to the same WiFi, Hotspot, or USB
                  tether, then choose{" "}
                  <span className="font-semibold">PC / Laptop → PC Companion</span>.
                </li>
              </ol>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={`flex-1 px-3.5 py-2.5 rounded-xl border font-mono text-xs truncate ${theme.subCard}`}
              >
                npm install &amp;&amp; node server.js
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText("npm install && node server.js");
                  setCopiedCmd(true);
                  window.setTimeout(() => setCopiedCmd(false), 1800);
                }}
                className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0 ${theme.keyBtn}`}
              >
                {copiedCmd ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedCmd ? "Copied" : "Copy"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() =>
                  downloadFile(
                    "server.js",
                    PC_COMPANION_SERVER_JS,
                    "text/javascript",
                  )
                }
                className={`min-h-[46px] px-4 rounded-2xl text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${theme.primaryBtn}`}
              >
                <Download size={15} />
                <span>Download server.js</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadFile(
                    "package.json",
                    PC_COMPANION_PACKAGE_JSON,
                    "application/json",
                  )
                }
                className={`min-h-[46px] px-4 rounded-2xl border text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer ${theme.keyBtn}`}
              >
                <Download size={15} />
                <span>Download package.json</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          role="status"
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#1D1D1F] text-white text-xs font-semibold shadow-xl border border-white/10 whitespace-nowrap"
        >
          {toastMsg}
        </div>
      )}
    </div>
  );
}
