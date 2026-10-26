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

const sample = async (label) => {
  const a = await metrics();
  await sleep(2500);
  const b = await metrics();
  const d = (k) => +((b[k] - a[k]) * 1000).toFixed(1);
  console.log(
    label.padEnd(26),
    JSON.stringify({
      taskMs: d("TaskDuration"),
      styleMs: d("RecalcStyleDuration"),
      layoutMs: d("LayoutDuration"),
      scriptMs: d("ScriptDuration"),
    }),
  );
};

await sample("baseline");

await css(`.emoji-layer { filter: none !important; }`);
await sample("layer blur off");

await css(`.emoji-layer { filter: none !important; } .emoji-tile { animation: none; }`);
await sample("blur off + tiles static");

await css(`.emoji-layer { filter: none !important; } .emoji-drift { transform: none !important; }`);
await sample("blur off + drift frozen");

await css(
  `.emoji-layer { filter: saturate(0.8) brightness(0.96) !important; }
   .emoji-tile { filter: none; text-shadow: 0 0 6px rgba(0, 0, 0, 0.35); }`,
);
await sample("proposed backdrop");

await css(`.emoji-layer { display: none !important; }`);
await sample("backdrop hidden");

ws.close();
