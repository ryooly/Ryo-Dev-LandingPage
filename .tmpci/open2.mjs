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
await sleep(3400);

const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.exceptionDetails ? { err: r.exceptionDetails.text } : r.result.value;
};

await ev(`window.__f = [];
window.__rec = false;
const loop = (t) => { if (window.__rec) window.__f.push(t); requestAnimationFrame(loop); };
requestAnimationFrame(loop);
true`);
await ev(`document.querySelector(".press-start")?.click()`);
await sleep(1200);

const press = (n) =>
  ev(`(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith(${JSON.stringify(n)}));
    if (b) b.click(); return !!b;
  })()`);
const esc = async () => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await sleep(700);
};
const css = (text) =>
  ev(`(() => {
    let s = document.getElementById("probe");
    if (!s) { s = document.createElement("style"); s.id = "probe"; document.head.appendChild(s); }
    s.textContent = ${JSON.stringify(text)};
    return true;
  })()`);
const wheel = () =>
  ev(
    `document.querySelector(".jog-dial").dispatchEvent(new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true }))`,
  );

const maxFrameDelta = async (action, ms = 1000) => {
  await ev(`window.__f = []; window.__rec = true; true`);
  await action();
  await sleep(ms);
  return ev(`(() => {
    window.__rec = false;
    const f = window.__f;
    let worst = 0;
    let over50 = 0;
    for (let i = 1; i < f.length; i += 1) {
      const d = f[i] - f[i - 1];
      if (d > worst) worst = d;
      if (d > 50) over50 += 1;
    }
    return { worst: Math.round(worst), over50, frames: f.length };
  })()`);
};

const run = async (label, kind, rounds = 5) => {
  const worsts = [];
  let drops = 0;
  for (let i = 0; i < rounds; i += 1) {
    const r =
      kind === "open"
        ? await maxFrameDelta(() => press("SKILLS"), 1000)
        : await maxFrameDelta(wheel, 1000);
    worsts.push(r.worst);
    drops += r.over50;
    if (kind === "open") await esc();
    else await sleep(500);
  }
  worsts.sort((a, b) => a - b);
  console.log(
    label.padEnd(28),
    JSON.stringify({ medianWorst: worsts[Math.floor(worsts.length / 2)], maxWorst: worsts[worsts.length - 1], drops }),
  );
};

await run("open: baseline", "open");
await run("turn: baseline", "turn");

await css(`@keyframes screen-settle {
  0% { opacity: 0; transform: translateY(16px) scale(0.982); }
  100% { opacity: 1; transform: none; }
}`);
await run("open: no brightness", "open");
await run("turn: no brightness", "turn");

await css(`.screen-panel, .screen-content { animation: none !important; }`);
await run("open: no animation", "open");
await run("turn: no animation", "turn");

await css(`.emoji-layer { filter: none !important; }`);
await run("open: no layer filter", "open");
await run("turn: no layer filter", "turn");

await css(`
  .emoji-tile.is-bob, .emoji-tile.is-glitch { animation: none !important; }`);
await run("turn: no tile anims", "turn");

await css("");
await run("open: restore", "open");
ws.close();
