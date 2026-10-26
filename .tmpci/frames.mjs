const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9224;

const targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const page = targets.find((t) => t.type === "page");
const ws = new WebSocket(page.webSocketDebuggerUrl);
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);
  const p = pending.get(msg.id);
  if (!p) return;
  pending.delete(msg.id);
  msg.error ? p.rej(new Error(JSON.stringify(msg.error))) : p.res(msg.result);
});
const send = (method, params) =>
  new Promise((res, rej) => {
    const id = ++seq;
    pending.set(id, { res, rej });
    ws.send(JSON.stringify({ id, method, params }));
  });
await new Promise((r) => ws.addEventListener("open", r));
await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "http://localhost:8080/" });
await sleep(3200);

const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.exceptionDetails ? { err: r.exceptionDetails.text } : r.result.value;
};

await ev(`window.__frames = []; window.__long = [];
window.__rec = false;
new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(Math.round(e.duration)); })
  .observe({ entryTypes: ["longtask"] });
const loop = (t) => {
  if (window.__rec) window.__frames.push(t);
  requestAnimationFrame(loop);
};
requestAnimationFrame(loop);
true`);

await ev(`document.querySelector(".press-start")?.click()`);
await sleep(1000);

const sample = async (label, action, ms = 1300) => {
  await ev(`window.__frames = []; window.__long = []; window.__rec = true; true`);
  if (action) await action();
  await sleep(ms);
  const out = await ev(`(() => {
    window.__rec = false;
    const f = window.__frames;
    const d = [];
    for (let i = 1; i < f.length; i += 1) d.push(f[i] - f[i - 1]);
    d.sort((a, b) => a - b);
    const pick = (p) => (d.length ? +d[Math.min(d.length - 1, Math.floor(d.length * p))].toFixed(1) : null);
    const long = window.__long;
    return {
      frames: f.length,
      fps: +(f.length / ${ms / 1000}).toFixed(1),
      p50: pick(0.5),
      p90: pick(0.9),
      p99: pick(0.99),
      max: d.length ? +d[d.length - 1].toFixed(1) : null,
      over25: d.filter((x) => x > 25).length,
      long: long.length,
      longMs: long.reduce((a, b) => a + b, 0),
    };
  })()`);
  console.log(label.padEnd(26), JSON.stringify(out));
};

const wheel = () =>
  ev(
    `document.querySelector(".jog-dial").dispatchEvent(new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true }))`,
  );
const press = (n) =>
  ev(`(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith(${JSON.stringify(n)}));
    b?.click(); return !!b;
  })()`);
const esc = async () => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
};
const css = (text) =>
  ev(`(() => {
    let s = document.getElementById("probe");
    if (!s) { s = document.createElement("style"); s.id = "probe"; document.head.appendChild(s); }
    s.textContent = ${JSON.stringify(text)};
    return true;
  })()`);

await sleep(500);
await sample("idle", null, 2000);
await sample("dial turn", wheel, 1400);
await sample("dial turn 2", wheel, 1400);
await sample("open PROJECT", () => press("PROJECT"), 1500);
await esc();
await sleep(500);
await sample("open SKILLS", () => press("SKILLS"), 1500);
await esc();
await sleep(500);
await sample("open ABOUT ME", () => press("ABOUT ME"), 1500);
await esc();
await sleep(400);
await sample("theme toggle", () => press("SOUND"), 1500);

await css(".emoji-backdrop { display: none !important; }");
await sleep(300);
await sample("dial turn no backdrop", wheel, 1400);
await sample("open SKILLS no backdrop", () => press("SKILLS"), 1500);
await esc();
await css("");
ws.close();
