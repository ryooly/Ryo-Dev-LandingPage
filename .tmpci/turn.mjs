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

const maxFrameDelta = async (ms = 1000) => {
  await ev(`window.__f = []; window.__rec = true; true`);
  await wheel();
  await sleep(ms);
  return ev(`(() => {
    window.__rec = false;
    const f = window.__f;
    let worst = 0, over50 = 0;
    for (let i = 1; i < f.length; i += 1) {
      const d = f[i] - f[i - 1];
      if (d > worst) worst = d;
      if (d > 45) over50 += 1;
    }
    return { worst: Math.round(worst), over50 };
  })()`);
};

const run = async (label, rounds = 8) => {
  const worsts = [];
  let drops = 0;
  for (let i = 0; i < rounds; i += 1) {
    const r = await maxFrameDelta();
    worsts.push(r.worst);
    drops += r.over50;
    await sleep(600);
  }
  worsts.sort((a, b) => a - b);
  console.log(
    label.padEnd(26),
    JSON.stringify({
      median: worsts[Math.floor(worsts.length / 2)],
      p90: worsts[Math.floor(worsts.length * 0.9)],
      max: worsts[worsts.length - 1],
      drops,
    }),
  );
};

await run("A blend overlay (now)");
await css(`.screen-content::after { display: none !important; }`);
await run("B no overlay");
await css(`.screen-content::after {
  display: block !important;
  mix-blend-mode: normal !important;
}`);
await run("C overlay, no blend");
await css(`.screen-content::after {
  display: block !important;
  mix-blend-mode: plus-lighter !important;
  will-change: auto !important;
}`);
await run("D blend, no will-change");
await css("");
await run("E back to A");
ws.close();
