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

console.log(
  "dom       ",
  JSON.stringify(
    await ev(`({
      nodes: document.querySelectorAll("*").length,
      tiles: document.querySelectorAll(".emoji-tile").length,
      running: document.getAnimations().filter((a) => a.playState === "running").length,
      tileAnims: document.getAnimations().filter((a) => {
        const t = a.effect?.target;
        return t instanceof Element && t.classList.contains("emoji-tile");
      }).length,
    })`),
  ),
);

const idle = async (label) => {
  const a = await metrics();
  await sleep(2000);
  const b = await metrics();
  console.log(
    label.padEnd(22),
    JSON.stringify({
      taskMsPerSec: +((b.TaskDuration - a.TaskDuration) * 500).toFixed(1),
      styleMsPerSec: +((b.RecalcStyleDuration - a.RecalcStyleDuration) * 500).toFixed(1),
      layoutMsPerSec: +((b.LayoutDuration - a.LayoutDuration) * 500).toFixed(1),
    }),
  );
};

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
    label.padEnd(22),
    JSON.stringify({
      perStepTaskMs: +((task * 1000) / steps).toFixed(0),
      perStepStyleMs: +((style * 1000) / steps).toFixed(0),
      perStepLayoutMs: +((layout * 1000) / steps).toFixed(0),
    }),
  );
};

await idle("idle baseline");
await transitions("transitions baseline");

await css(".emoji-backdrop { display: none !important; }");
await idle("idle no backdrop");
await transitions("trans no backdrop");

await css("");
await css(".emoji-tile { animation: none !important; } .emoji-drift { animation: none !important; }");
await idle("idle tiles frozen");

await css("");
await css(`@keyframes screen-settle {
  0% { opacity: 0; transform: translateY(16px) scale(0.982); }
  46% { opacity: 1; }
  70% { transform: translateY(-2.5px) scale(1.0025); }
  100% { opacity: 1; transform: none; }
}`);
await transitions("trans no brightness");

await css(`@keyframes screen-settle {
  0% { opacity: 0; transform: translateY(16px) scale(0.982); }
  100% { opacity: 1; transform: none; }
}`);
await transitions("trans fade+slide only");

await css("");
ws.close();
