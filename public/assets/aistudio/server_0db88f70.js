'use strict';
// GAMURA Remote PC companion. Run: npm install && node server.js
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
  let name = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
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
    const script = `
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
}`;
    ps = spawn('powershell', ['-NoProfile', '-NonInteractive', '-Command', '-'], { stdio: ['pipe', 'ignore', 'ignore'] });
    ps.stdin.write(script + '\n');
    ps.on('exit', () => { ps = null; });
  }
  ps.stdin.write(line + '\n');
}
const sendKeysEscape = s => s.replace(/[+^%~(){}\[\]]/g, m => `{${m}}`).replace(/\r?\n/g, '{ENTER}');

const win = {
  move: (dx, dy) => winSend(`m|${dx}|${dy}`),
  click: b => { const [d, u] = { left: [2, 4], right: [8, 16], middle: [32, 64] }[b] || [2, 4]; winSend(`c|${d}`); winSend(`c|${u}`); },
  scroll: dy => winSend(`s|${dy * 40}`),
  key: (k, mods) => {
    const m = mods.map(vkOf).filter(Boolean), v = vkOf(k);
    if (!v) return;
    m.forEach(x => winSend(`k|${x}|0`)); winSend(`k|${v}|0`); winSend(`k|${v}|2`); m.reverse().forEach(x => winSend(`k|${x}|2`));
  },
  text: t => winSend(`t|${Buffer.from(sendKeysEscape(t), 'utf8').toString('base64')}`),
  media: a => { const v = MEDIA_VK[a]; if (v) { winSend(`k|${v}|0`); winSend(`k|${v}|2`); } },
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
  move: (dx, dy) => cc(`m:${dx >= 0 ? '+' : ''}${dx},${dy >= 0 ? '+' : ''}${dy}`),
  click: b => cc(b === 'right' ? 'rc:.' : 'c:.'),
  scroll: () => {},
  key: (k, mods) => {
    const using = mods.map(m => MMOD[m]).filter(Boolean).join(', ');
    const tail = using ? ` using {${using}}` : '';
    osa(MKEY[k] !== undefined ? `tell application "System Events" to key code ${MKEY[k]}${tail}` : `tell application "System Events" to keystroke "${k.replace(/["\\]/g, '')}"${tail}`);
  },
  text: t => osa(`tell application "System Events" to keystroke "${t.replace(/["\\]/g, '')}"`),
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
  console.log('\nGAMURA Remote companion running\n');
  ips.forEach(ip => console.log(`  Open on phone:  http://${ip}:${PORT}`));
  console.log(`\n  Pairing token:  ${TOKEN}`);
  console.log('  In the app: add device > PC > Companion, enter address and token.\n');
});
