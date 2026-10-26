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

const kinds = await ev(`(() => {
  const map = new Map();
  for (const a of document.getAnimations()) {
    const name = a.animationName || a.transitionProperty || "?";
    const target = a.effect?.target;
    const cls = (target?.className || target?.tagName || "?").toString().split(" ")[0];
    const props = a.effect?.getKeyframes?.().flatMap((k) => Object.keys(k)).filter((k) => !["offset", "computedOffset", "easing", "composite"].includes(k)) ?? [];
    const key = name + " [" + [...new Set(props)].join(",") + "] on ." + cls;
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
})()`);
console.log("animation kinds (name [props] on class -> count):");
for (const [k, n] of kinds) console.log("  " + String(n).padStart(4) + "  " + k);

const window_ = async (label) => {
  const a = await metrics();
  await sleep(2500);
  const b = await metrics();
  const d = (k) => +((b[k] - a[k]) * 1000).toFixed(1);
  console.log(
    label.padEnd(24),
    JSON.stringify({
      taskMs: d("TaskDuration"),
      styleMs: d("RecalcStyleDuration"),
      layoutMs: d("LayoutDuration"),
      scriptMs: d("ScriptDuration"),
    }),
  );
};

await window_("idle baseline");
await ev(`document.getAnimations().forEach((a) => a.pause())`);
await window_("idle animations paused");
await ev(`document.querySelector(".emoji-backdrop").style.display = "none"`);
await window_("idle backdrop hidden");
await ev(`document.querySelector(".emoji-backdrop").style.display = ""; document.getAnimations().forEach((a) => a.play())`);
await window_("idle restored");

ws.close();
