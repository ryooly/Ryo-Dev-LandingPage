const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9224;
const W = Number(process.env.W || 1440);
const H = Number(process.env.H || 900);

let targets;
for (let i = 0; i < 60; i++) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    if (targets.some((t) => t.type === "page")) break;
  } catch {}
  await sleep(250);
}
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
  width: W,
  height: H,
  deviceScaleFactor: 1,
  mobile: false,
});
await send("Page.navigate", { url: "http://localhost:8080/" });
await sleep(3000);

const ev = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  return r.exceptionDetails ? { err: r.exceptionDetails.text } : r.result.value;
};
const footer = () => ev(`document.querySelector(".screen-footer strong")?.textContent.trim()`);
const until = async (want, action) => {
  for (let i = 0; i < 24; i++) {
    if ((await footer()) === want) return true;
    await action();
    await sleep(350);
  }
  console.log("STUCK", want, "->", await footer());
  return false;
};

await ev(`(() => {
  window.__lt = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__lt.push(Math.round(e.duration));
  }).observe({ type: "longtask", buffered: true });
  return true;
})()`);

const fps = (ms) =>
  ev(`new Promise((resolve) => {
    const gaps = [];
    let last = performance.now();
    const end = last + ${ms};
    const tick = (t) => {
      gaps.push(t - last);
      last = t;
      if (t < end) requestAnimationFrame(tick);
      else {
        gaps.sort((a, b) => a - b);
        resolve({
          frames: gaps.length,
          avg: +(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2),
          p95: +gaps[Math.floor(gaps.length * 0.95)].toFixed(2),
          max: +gaps[gaps.length - 1].toFixed(2),
          over24: gaps.filter((g) => g > 24).length,
        });
      }
    };
    requestAnimationFrame(tick);
  })`);

const metrics = async () => {
  const m = await send("Performance.getMetrics");
  return Object.fromEntries(m.metrics.map((x) => [x.name, x.value]));
};

console.log("animations", await ev(`document.getAnimations().length`));
console.log("domNodes  ", await ev(`document.getElementsByTagName("*").length`));
const m0 = await metrics();
console.log("idle fps  ", JSON.stringify(await fps(2500)));
const m1 = await metrics();
console.log(
  "idle cost ",
  JSON.stringify({
    layoutMs: +((m1.LayoutDuration - m0.LayoutDuration) * 1000).toFixed(1),
    styleMs: +((m1.RecalcStyleDuration - m0.RecalcStyleDuration) * 1000).toFixed(1),
    scriptMs: +((m1.ScriptDuration - m0.ScriptDuration) * 1000).toFixed(1),
    taskMs: +((m1.TaskDuration - m0.TaskDuration) * 1000).toFixed(1),
  }),
);
console.log("longtasks ", JSON.stringify(await ev(`window.__lt`)));

await until("SYS_PROFILE", () => ev(`document.querySelector(".press-start")?.click()`));
await sleep(600);
await ev(`window.__lt.length = 0`);
const m2 = await metrics();
const spin = ev(`new Promise((resolve) => {
  const dial = document.querySelector(".jog-dial");
  const gaps = [];
  let last = performance.now();
  let i = 0;
  const step = () => {
    dial.dispatchEvent(new WheelEvent("wheel", { deltaY: 120, bubbles: true, cancelable: true }));
  };
  const tick = (t) => {
    gaps.push(t - last);
    last = t;
    if (i++ < 5) step();
    if (i < 210) requestAnimationFrame(tick);
    else {
      gaps.sort((a, b) => a - b);
      resolve({
        frames: gaps.length,
        avg: +(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(2),
        p95: +gaps[Math.floor(gaps.length * 0.95)].toFixed(2),
        max: +gaps[gaps.length - 1].toFixed(2),
        over24: gaps.filter((g) => g > 24).length,
      });
    }
  };
  requestAnimationFrame(tick);
})`);
const spinStats = await spin;
const m3 = await metrics();
console.log("spin fps  ", JSON.stringify(spinStats));
console.log(
  "spin cost ",
  JSON.stringify({
    layoutMs: +((m3.LayoutDuration - m2.LayoutDuration) * 1000).toFixed(1),
    styleMs: +((m3.RecalcStyleDuration - m2.RecalcStyleDuration) * 1000).toFixed(1),
    scriptMs: +((m3.ScriptDuration - m2.ScriptDuration) * 1000).toFixed(1),
    taskMs: +((m3.TaskDuration - m2.TaskDuration) * 1000).toFixed(1),
  }),
);
console.log("longtasks ", JSON.stringify(await ev(`window.__lt`)));
console.log("footer    ", await footer());

ws.close();
