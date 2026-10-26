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
await ev(`window.__long = [];
new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(Math.round(e.duration)); })
  .observe({ entryTypes: ["longtask"] });
true`);
await ev(`document.querySelector(".press-start")?.click()`);
await sleep(1200);

const press = (n) =>
  ev(`(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith(${JSON.stringify(n)}));
    b?.click(); return !!b;
  })()`);
const esc = async () => {
  await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
  await sleep(600);
};
const css = (text) =>
  ev(`(() => {
    let s = document.getElementById("probe");
    if (!s) { s = document.createElement("style"); s.id = "probe"; document.head.appendChild(s); }
    s.textContent = ${JSON.stringify(text)};
    return true;
  })()`);

const measure = async (label, name = "SKILLS", rounds = 4) => {
  const results = [];
  for (let i = 0; i < rounds; i += 1) {
    await ev(`window.__long = []; true`);
    await press(name);
    await sleep(1100);
    const long = await ev(`window.__long`);
    results.push(Math.max(0, ...long));
    await esc();
  }
  const sorted = [...results].sort((a, b) => a - b);
  console.log(
    label.padEnd(28),
    JSON.stringify({ worst: sorted[sorted.length - 1], median: sorted[Math.floor(sorted.length / 2)] }),
  );
};

await measure("baseline");
await measure("baseline #2");

await css(`@keyframes screen-settle {
  0% { opacity: 0; transform: translateY(16px) scale(0.982); }
  100% { opacity: 1; transform: none; }
}`);
await measure("no brightness in keyframes");

await css(`.screen-panel { animation: none !important; }`);
await measure("panel no animation");

await css(`
  .screen-panel { will-change: transform, opacity, filter; }`);
await measure("panel will-change");

await css(`.screen-content { animation: none !important; }`);
await measure("content no animation");

await css("");
await measure("restore");

await css(`.screen-panel { contain: layout paint; }`);
await measure("panel contain");

await css(`.screen-body[data-panel] .screen-content { display: none; }`);
await measure("hide content display");

await css("");
await measure("restore 2");
ws.close();
