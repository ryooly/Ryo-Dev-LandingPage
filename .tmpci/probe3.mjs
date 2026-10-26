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
    label.padEnd(30),
    JSON.stringify({
      task: +((task * 1000) / steps).toFixed(0),
      style: +((style * 1000) / steps).toFixed(0),
      layout: +((layout * 1000) / steps).toFixed(0),
    }),
  );
};

console.log("body bg", JSON.stringify(await ev(`getComputedStyle(document.body).backgroundColor`)));

await transitions("baseline");
await transitions("baseline again");

await css(`.emoji-backdrop { -webkit-mask-image: none !important; mask-image: none !important; }`);
await transitions("no mask");

await css(`
  .emoji-backdrop { -webkit-mask-image: none !important; mask-image: none !important; }
  .emoji-layer { filter: none !important; }`);
await transitions("no mask + no filter");

await css(`.emoji-layer { filter: none !important; }`);
await transitions("no filter only");

await css("");
await css(`.screen-content, .screen-panel { will-change: transform, opacity, filter; }`);
await transitions("will-change on settle");

await css(`
  .screen-content, .screen-panel { will-change: transform, opacity, filter; }
  .emoji-layer { filter: none !important; }`);
await transitions("wc + no filter");

await css(`
  .screen-content, .screen-panel { will-change: transform, opacity, filter; }
  .emoji-layer { filter: none !important; }
  .emoji-backdrop { -webkit-mask-image: none !important; mask-image: none !important; }`);
await transitions("wc + no filter + no mask");

await css("");
await transitions("restore");
ws.close();
