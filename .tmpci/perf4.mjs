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
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: "http://localhost:8080/" });
await sleep(3000);

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
const footer = () => ev(`document.querySelector(".screen-footer strong")?.textContent.trim()`);
const wheel = (d) =>
  ev(
    `document.querySelector(".jog-dial").dispatchEvent(new WheelEvent("wheel", { deltaY: ${d}, bubbles: true, cancelable: true }))`,
  );

await ev(`document.querySelector(".press-start")?.click()`);
await sleep(900);

const transitionCost = async (label, steps = 5) => {
  await css("");
  let total = { task: 0, style: 0, layout: 0 };
  for (let i = 0; i < steps; i += 1) {
    const a = await metrics();
    await wheel(120);
    await sleep(950);
    const b = await metrics();
    total.task += b.TaskDuration - a.TaskDuration;
    total.style += b.RecalcStyleDuration - a.RecalcStyleDuration;
    total.layout += b.LayoutDuration - a.LayoutDuration;
  }
  console.log(
    label.padEnd(22),
    JSON.stringify({
      perStepTaskMs: +((total.task * 1000) / steps).toFixed(1),
      perStepStyleMs: +((total.style * 1000) / steps).toFixed(1),
      perStepLayoutMs: +((total.layout * 1000) / steps).toFixed(1),
      footer: await footer(),
    }),
  );
};

await transitionCost("baseline transitions");

await css(`.screen-content, .screen-panel { animation: none !important; }`);
await transitionCost("no settle animation");

await css(`@keyframes screen-settle {
  0% { opacity: 0; transform: translateY(16px) scale(0.982); }
  46% { opacity: 1; }
  70% { transform: translateY(-2.5px) scale(1.0025); }
  100% { opacity: 1; transform: none; }
}`);
await transitionCost("settle w/o filter");

ws.close();
