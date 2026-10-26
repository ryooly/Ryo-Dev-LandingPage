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
await send("Profiler.enable");
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
await ev(`document.querySelector(".press-start")?.click()`);
await sleep(1200);

const press = (n) =>
  ev(`(() => {
    const b = [...document.querySelectorAll("button")].find((x) => x.textContent.trim().startsWith(${JSON.stringify(n)}));
    b?.click(); return !!b;
  })()`);

await press("SKILLS");
await sleep(1200);
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await sleep(1000);

const profileOpen = async (label, name) => {
  await send("Profiler.setSamplingInterval", { interval: 100 });
  await send("Profiler.start");
  await press(name);
  await sleep(1400);
  const { profile } = await send("Profiler.stop");

  const byId = new Map(profile.nodes.map((n) => [n.id, n]));
  const self = new Map();
  const dt = profile.timeDeltas;
  for (let i = 0; i < profile.samples.length; i += 1) {
    const node = byId.get(profile.samples[i]);
    if (!node) continue;
    const cf = node.callFrame;
    const key = `${cf.functionName || "(anon)"} ${cf.url ? cf.url.split("/").pop() : ""}:${cf.lineNumber + 1}`;
    self.set(key, (self.get(key) ?? 0) + (dt[i] ?? 0));
  }
  const total = [...self.values()].reduce((a, b) => a + b, 0);
  console.log(`\n== ${label} total ${(total / 1000).toFixed(0)}ms`);
  [...self.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 16)
    .forEach(([k, v]) => console.log(`  ${(v / 1000).toFixed(1).padStart(7)}ms  ${k}`));
};

await profileOpen("open SKILLS", "SKILLS");
await send("Input.dispatchKeyEvent", { type: "keyDown", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await send("Input.dispatchKeyEvent", { type: "keyUp", key: "Escape", code: "Escape", windowsVirtualKeyCode: 27 });
await sleep(900);
await profileOpen("open PROJECT", "PROJECT");
ws.close();
