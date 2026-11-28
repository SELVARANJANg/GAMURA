# GAMURA Remote

Universal remote as a PWA plus a PC companion.

## Run
1. On the PC: `npm install` then `node server.js` (Windows needs nothing else; Linux needs `xdotool`; macOS needs `cliclick`).
2. Connect phone and PC to the same WiFi, phone hotspot, or USB tether.
3. Open the printed `http://<pc-ip>:8765` on the phone, then Add to Home Screen.
4. In the app: `+` > PC > Companion, enter `<pc-ip>:8765` and the token from the terminal.

## Connections
| Link | Devices | Notes |
|---|---|---|
| Demo | all | simulated, no hardware |
| Roku (WiFi) | Roku TV | ECP, port 8060 |
| Samsung (WiFi) | Tizen TVs 2016+ | accept the prompt on the TV once |
| Home Assistant | TV, light, fan, phone | covers Android TV, LG, Hue, most smart devices |
| HTTP | Tasmota, Shelly, ESP32 | `/cm?cmnd=` or `/relay/0?turn=` or `/<action>?v=` |
| Bluetooth LE | BLE lights/fans | enter your device's GATT UUIDs and byte patterns; Chrome only |
| PC Companion | Windows, Linux, macOS (partial) | mouse, keyboard, media, power |

Hotspot and cable are network paths: join the same hotspot or USB tether, then use the WiFi links with the device IP.

## Limits
- Browsers block `http://` device calls from an `https://` page. Open the app from the companion (`http://`) or a local server.
- Web Bluetooth: Chrome on Android/desktop only, not iOS.
- Phone-to-phone control is not possible through OS security; use Home Assistant or media notifications.
- macOS companion: mouse, click, text, basic keys; no scroll or media keys yet.
