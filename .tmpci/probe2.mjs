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
await send("Performance.enable");
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
const metrics = async () => {
  const m = await send("Performance.getMetrics");
  return Object.fromEntries(m.metrics.map((x) => [x.name, x.value]));
};
const css = (text) =>
  ev(`(() => {
    let s = document.getElementById("probe");
    if (!s) { s = document.createElement("style"); s.id = "probe"; document.head.appendChild(s); }
    s.textContent = ${JSON.stringify(text)};
    return true;
  })()`);
const wheel = (d) =>
  ev(
    `document.querySelector(".jog-dial").dispatchEvent(new WheelEvent("wheel", { deltaY: ${d}, bubbles: true, cancelable: true }))`,
  );

await ev(`document.querySelector(".press-start")?.click()`);
await sleep(900);

const transitions = async (label, steps = 6) => {
  let task = 0;
  let style = 0;
  let layout = 0;
  for (let i = 0; i < steps; i += 1) {
    const a = await metrics();
    await wheel(120);
    await sleep(900);
    const b = await metrics();
    task += b.TaskDuration - a.TaskDuration;
    style += b.RecalcStyleDuration - a.RecalcStyleDuration;
    layout += b.LayoutDuration - a.LayoutDuration;
  }
  console.log(
    label.padEnd(24),
    JSON.stringify({
      task: +((task * 1000) / steps).toFixed(0),
      style: +((style * 1000) / steps).toFixed(0),
      layout: +((layout * 1000) / steps).toFixed(0),
    }),
  );
};

const idle = async (label) => {
  const a = await metrics();
  await sleep(2000);
  const b = await metrics();
  console.log(
    label.padEnd(24),
    JSON.stringify({
      task: +((b.TaskDuration - a.TaskDuration) * 500).toFixed(0),
      style: +((b.RecalcStyleDuration - a.RecalcStyleDuration) * 500).toFixed(0),
    }),
  );
};

await transitions("baseline");
await idle("baseline");

await css(".emoji-layer { filter: none !important; }");
await transitions("no layer filter");
await idle("no layer filter");

await css(`
  .emoji-layer { filter: none !important; }
  .emoji-backdrop::after {
    content: ""; position: absolute; inset: 0;
    background: color-mix(in oklab, var(--screen-field) 22%, transparent);
    pointer-events: none;
  }`);
await transitions("no filter + tint");
await idle("no filter + tint");

await css(`
  .emoji-layer { filter: none !important; }
  .emoji-drift { transform: none !important; }`);
await transitions("no filter, no drift");

await css(`
  .emoji-layer { filter: none !important; }
  .emoji-tile { animation: none !important; }`);
await transitions("no filter, tiles static");

await css(`
  .emoji-layer { filter: none !important; }
  .emoji-tile { will-change: transform; animation-name: none !important; }`);
await transitions("no filter, no anims");

await css("");
await transitions("restore baseline");
ws.close();
