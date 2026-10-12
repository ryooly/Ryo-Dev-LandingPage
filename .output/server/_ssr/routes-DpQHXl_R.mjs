import { r as __toESM } from "../_runtime.mjs";
import { n as require_jsx_runtime, r as require_react } from "../_libs/react+tanstack__react-query.mjs";
import { t as gsapWithCSS } from "../_libs/gsap.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DpQHXl_R.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STORAGE_KEY = "rio-console-sound";
var MASTER_GAIN = .5;
var recipes = {
	press: [{
		voice: "blip",
		note: "A4",
		at: 0,
		dur: .05,
		vel: .5
	}, {
		voice: "click",
		at: 0,
		dur: .014,
		vel: .24
	}],
	move: [{
		voice: "thud",
		note: "C2",
		at: 0,
		dur: .07,
		vel: .42
	}, {
		voice: "click",
		at: 0,
		dur: .012,
		vel: .2
	}],
	start: [
		{
			voice: "blip",
			note: "C5",
			at: 0,
			dur: .07,
			vel: .55
		},
		{
			voice: "blip",
			note: "E5",
			at: .075,
			dur: .07,
			vel: .55
		},
		{
			voice: "blip",
			note: "G5",
			at: .15,
			dur: .07,
			vel: .55
		},
		{
			voice: "blip",
			note: "C6",
			at: .225,
			dur: .2,
			vel: .6
		}
	],
	deny: [{
		voice: "blip",
		note: "A2",
		at: 0,
		dur: .09,
		vel: .5
	}, {
		voice: "blip",
		note: "G2",
		at: .12,
		dur: .13,
		vel: .48
	}],
	open: [{
		voice: "blip",
		note: "G4",
		at: 0,
		dur: .06,
		vel: .45
	}, {
		voice: "blip",
		note: "D6",
		at: .06,
		dur: .1,
		vel: .45
	}],
	close: [{
		voice: "blip",
		note: "D6",
		at: 0,
		dur: .06,
		vel: .45
	}, {
		voice: "blip",
		note: "G4",
		at: .06,
		dur: .1,
		vel: .45
	}]
};
var rig = null;
var booting = null;
var toneLib = null;
function readMuted() {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(STORAGE_KEY) === "off";
	} catch {
		return false;
	}
}
var muted = readMuted();
async function ensureTone() {
	if (toneLib) return toneLib;
	try {
		toneLib = await import("../_libs/tone+tslib.mjs").then((n) => n.t);
		return toneLib;
	} catch {
		return null;
	}
}
async function buildRig() {
	const tone = await ensureTone();
	if (!tone) return null;
	await tone.start();
	if (tone.getContext().state !== "running") return null;
	const limiter = new tone.Limiter(-6).toDestination();
	const master = new tone.Gain(MASTER_GAIN);
	master.connect(limiter);
	const blip = new tone.Synth({
		oscillator: { type: "square" },
		envelope: {
			attack: .001,
			decay: .045,
			sustain: 0,
			release: .04
		}
	});
	blip.connect(master);
	const thud = new tone.MembraneSynth({
		octaves: 3,
		envelope: {
			attack: .001,
			decay: .08,
			sustain: 0,
			release: .05
		}
	});
	thud.connect(master);
	const click = new tone.NoiseSynth({
		noise: { type: "white" },
		envelope: {
			attack: .001,
			decay: .018,
			sustain: 0,
			release: .008
		}
	});
	click.connect(master);
	return {
		tone,
		blip,
		thud,
		click
	};
}
function boot() {
	if (rig) return Promise.resolve(rig);
	if (!booting) booting = buildRig().then((next) => {
		if (next) {
			rig = next;
			detachAudioUnlock();
		} else booting = null;
		return next;
	}).catch(() => {
		booting = null;
		return null;
	});
	return booting;
}
var unlockAttached = false;
function onFirstGesture() {
	if (muted) return;
	if (toneLib) toneLib.start();
	boot();
}
/**
* Pasang sekali setelah hidrasi: muat modul Tone.js lebih awal (agar `toneLib`
* siap dipakai sinkron saat gestur pertama) dan pasang listener pembuka audio
* yang bertahan sampai context benar-benar berjalan, lalu melepas dirinya.
*/
function attachAudioUnlock() {
	if (typeof window === "undefined" || unlockAttached) return;
	unlockAttached = true;
	ensureTone();
	window.addEventListener("pointerdown", onFirstGesture);
	window.addEventListener("keydown", onFirstGesture);
	window.addEventListener("touchstart", onFirstGesture, { passive: true });
}
function detachAudioUnlock() {
	if (typeof window === "undefined" || !unlockAttached) return;
	unlockAttached = false;
	window.removeEventListener("pointerdown", onFirstGesture);
	window.removeEventListener("keydown", onFirstGesture);
	window.removeEventListener("touchstart", onFirstGesture);
}
function isMuted() {
	return muted;
}
function setMuted(nextMuted) {
	muted = nextMuted;
	try {
		window.localStorage.setItem(STORAGE_KEY, nextMuted ? "off" : "on");
	} catch {}
	if (!nextMuted) {
		if (toneLib) toneLib.start();
		boot();
	}
}
async function playConsoleSound(sound) {
	if (muted) return;
	const active = await boot();
	if (!active) return;
	if (active.tone.getContext().state !== "running") {
		booting = null;
		rig = null;
		return;
	}
	const origin = active.tone.now();
	for (const step of recipes[sound]) {
		const voice = active[step.voice];
		if (step.voice === "click") voice.triggerAttackRelease(step.dur, origin + step.at, step.vel);
		else voice.triggerAttackRelease(step.note ?? "C4", step.dur, origin + step.at, step.vel);
	}
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var screens = {
	home: {
		number: "01",
		label: "HOME"
	},
	profile: {
		number: "02",
		label: "PROFILE"
	},
	about: {
		number: "03",
		label: "ABOUT"
	},
	work: {
		number: "04",
		label: "SKILLS"
	},
	find: {
		number: "05",
		label: "FIND"
	},
	contact: {
		number: "06",
		label: "CONTACT"
	}
};
var TOTAL_SCREENS = 6;
var NOTCH = 30;
var DRAG_STEP = 24;
var WHEEL_STEP = 40;
var STEP_COOLDOWN = 220;
var LAST_POSITION = 8;
var menuItems = [
	"ABOUT ME",
	"PROJECT",
	"SKILLS",
	"EXIT"
];
var TOUCH_ME_URL = "https://www.linkedin.com/in/username";
var swordSprite = [
	"...1...",
	"...1...",
	"..121..",
	"..111..",
	"...1...",
	"...1...",
	"1111111",
	".11111.",
	"..111..",
	"..121..",
	"..121..",
	"..121..",
	"..111..",
	"...1..."
];
var heartSprite = [
	".11.11.",
	"1111111",
	"1111111",
	".11111.",
	"..111..",
	"...1..."
];
var heartOutline = [
	".11.11.",
	"1..1..1",
	"1.....1",
	".1...1.",
	"..111..",
	"...1..."
];
var skills = [
	{
		lines: ["FRONTEND", "DEV"],
		value: 43
	},
	{
		lines: ["BACKEND", "DEV"],
		value: 90
	},
	{
		lines: ["SYSTEM", "ARCH"],
		value: 73
	},
	{
		lines: ["DEVOPS", "& CLOUD"],
		value: 55
	},
	{
		lines: ["VECTOR DB", "& DATA"],
		value: 75
	},
	{
		lines: ["AI", "INTEGRATION"],
		value: 80
	},
	{
		lines: ["AI", "AGENTIC"],
		value: 45
	},
	{
		lines: ["VIBE", "CODING"],
		value: 80
	}
];
var powerLogos = [
	{
		name: "GitHub",
		href: "https://github.com",
		src: "https://cdn.simpleicons.org/github/1d3a2a"
	},
	{
		name: "LeetCode",
		href: "https://leetcode.com",
		src: "https://cdn.simpleicons.org/leetcode/1d3a2a"
	},
	{
		name: "Codewars",
		href: "https://www.codewars.com",
		src: "https://cdn.simpleicons.org/codewars/1d3a2a"
	}
];
var projects = [
	{
		name: "PORTFOLIO.SYS",
		type: "WEB APP // TANSTACK START",
		href: "#"
	},
	{
		name: "SPIDEY-TRACKER",
		type: "INTERACTIVE UI // REACT",
		href: "#"
	},
	{
		name: "AI-COMPANION",
		type: "FULLSTACK SERVICE // AI",
		href: "#"
	}
];
var platforms = [
	{
		name: "X",
		handle: "@ryo",
		href: "https://x.com/",
		icon: "x"
	},
	{
		name: "LinkedIn",
		handle: "rio",
		href: "https://www.linkedin.com/",
		icon: "linkedin"
	},
	{
		name: "Threads",
		handle: "@ryo",
		href: "https://www.threads.net/",
		icon: "threads"
	},
	{
		name: "GitHub",
		handle: "ryo",
		href: "https://github.com/",
		icon: "github"
	},
	{
		name: "Duolingo",
		handle: "ryo",
		href: "https://www.duolingo.com/",
		icon: "duolingo"
	}
];
var techIcon = (slug) => `https://cdn.simpleicons.org/${slug}/1d3a2a`;
var techTree = [
	{
		language: "PYTHON",
		icon: "python",
		groups: [
			{
				label: "SERVER & WEB",
				items: [{
					name: "FASTAPI",
					icon: "fastapi"
				}]
			},
			{
				label: "AI & LLM",
				items: [{
					name: "OPENAI",
					icon: "openai"
				}, {
					name: "CLAUDE",
					icon: "anthropic"
				}]
			},
			{
				label: "DATABASES",
				items: [
					{
						name: "POSTGRESQL",
						icon: "postgresql"
					},
					{
						name: "MONGODB",
						icon: "mongodb"
					},
					{
						name: "MYSQL",
						icon: "mysql"
					}
				]
			},
			{
				label: "ENV & TOOLING",
				items: [
					{
						name: "DOCKER",
						icon: "docker"
					},
					{
						name: "LINUX",
						icon: "linux"
					},
					{
						name: "CURSOR AI",
						icon: "cursor"
					}
				]
			}
		]
	},
	{
		language: "TYPESCRIPT",
		icon: "typescript",
		groups: [
			{
				label: "FRAMEWORKS",
				items: [{
					name: "NEXT.JS",
					icon: "nextdotjs"
				}, {
					name: "VUE.JS",
					icon: "vuedotjs"
				}]
			},
			{
				label: "RUNTIME",
				items: [{
					name: "NODE.JS",
					icon: "nodedotjs"
				}]
			},
			{
				label: "DATABASES",
				items: [{
					name: "POSTGRESQL",
					icon: "postgresql"
				}, {
					name: "MYSQL",
					icon: "mysql"
				}]
			},
			{
				label: "ENV & TOOLING",
				items: [{
					name: "VS CODE",
					icon: "visualstudiocode"
				}, {
					name: "GIT",
					icon: "git"
				}]
			}
		]
	},
	{
		language: "JAVASCRIPT",
		icon: "javascript",
		groups: [
			{
				label: "FRAMEWORKS",
				items: [{
					name: "NEXT.JS",
					icon: "nextdotjs"
				}, {
					name: "VUE.JS",
					icon: "vuedotjs"
				}]
			},
			{
				label: "RUNTIME",
				items: [{
					name: "NODE.JS",
					icon: "nodedotjs"
				}]
			},
			{
				label: "DATABASES",
				items: [{
					name: "MONGODB",
					icon: "mongodb"
				}]
			},
			{
				label: "ENV & TOOLING",
				items: [{
					name: "GIT",
					icon: "git"
				}, {
					name: "VS CODE",
					icon: "visualstudiocode"
				}]
			}
		]
	}
];
var hackerEmojis = [
	"👾",
	"👾",
	"💻",
	"💻",
	"🖥️",
	"⌨️",
	"🕶️",
	"📡",
	"💾",
	"🔐",
	"🔌",
	"☠️",
	"🐛",
	"🚩"
];
function mulberry32(seed) {
	return () => {
		seed |= 0;
		seed = seed + 1831565813 | 0;
		let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
var emojiLayerSpecs = [
	{
		cols: 9,
		rows: 6,
		size: [12, 18],
		opacity: [.12, .22],
		depth: 14,
		blur: 1.1,
		jitter: .62
	},
	{
		cols: 7,
		rows: 5,
		size: [18, 27],
		opacity: [.2, .36],
		depth: 32,
		blur: .3,
		jitter: .58
	},
	{
		cols: 5,
		rows: 4,
		size: [27, 42],
		opacity: [.32, .52],
		depth: 56,
		blur: 0,
		jitter: .52
	}
];
function buildEmojiLayers() {
	const rng = mulberry32(1337);
	return emojiLayerSpecs.map((spec) => {
		const cellW = 100 / spec.cols;
		const cellH = 100 / spec.rows;
		const tiles = [];
		for (let row = 0; row < spec.rows; row += 1) for (let col = 0; col < spec.cols; col += 1) {
			const [minSize, maxSize] = spec.size;
			const [minOpacity, maxOpacity] = spec.opacity;
			tiles.push({
				char: hackerEmojis[Math.floor(rng() * hackerEmojis.length)] ?? "👾",
				left: (col + .5 + (rng() - .5) * spec.jitter) * cellW,
				top: (row + .5 + (rng() - .5) * spec.jitter) * cellH,
				size: minSize + rng() * (maxSize - minSize),
				rotate: (rng() - .5) * 44,
				opacity: minOpacity + rng() * (maxOpacity - minOpacity),
				delay: -rng() * 6,
				duration: 3.4 + rng() * 3.2,
				glitch: rng() < .08
			});
		}
		return {
			depth: spec.depth,
			blur: spec.blur,
			tiles
		};
	});
}
function HackerEmojiBackdrop() {
	const layers = (0, import_react.useMemo)(buildEmojiLayers, []);
	const layerRefs = (0, import_react.useRef)([]);
	const driftRefs = (0, import_react.useRef)([]);
	(0, import_react.useEffect)(() => {
		if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const setters = layers.map((layer, index) => {
			const el = layerRefs.current[index];
			if (!el) return null;
			const vars = {
				duration: 1.2,
				ease: "power3.out",
				overwrite: "auto"
			};
			return {
				depth: layer.depth,
				x: gsapWithCSS.quickTo(el, "x", vars),
				y: gsapWithCSS.quickTo(el, "y", vars)
			};
		});
		let inside = false;
		const driftPaths = [
			[
				{
					x: 10,
					y: -6
				},
				{
					x: -8,
					y: 8
				},
				{
					x: 6,
					y: 4
				},
				{
					x: 0,
					y: 0
				}
			],
			[
				{
					x: -16,
					y: 9
				},
				{
					x: 13,
					y: -12
				},
				{
					x: -6,
					y: 7
				},
				{
					x: 0,
					y: 0
				}
			],
			[
				{
					x: 26,
					y: -15
				},
				{
					x: -20,
					y: 17
				},
				{
					x: 11,
					y: 9
				},
				{
					x: 0,
					y: 0
				}
			]
		];
		const driftTweens = driftRefs.current.map((el, index) => {
			const path = driftPaths[index % driftPaths.length];
			if (!el || !path) return null;
			return gsapWithCSS.to(el, {
				keyframes: path,
				duration: 26 - index * 5,
				ease: "sine.inOut",
				repeat: -1
			});
		});
		const freeze = () => {
			for (const setter of setters) {
				if (!setter) continue;
				setter.x.tween.pause();
				setter.y.tween.pause();
			}
			for (const tween of driftTweens) tween?.pause();
		};
		const unfreeze = () => {
			for (const setter of setters) {
				if (!setter) continue;
				setter.x.tween.resume();
				setter.y.tween.resume();
			}
			for (const tween of driftTweens) tween?.resume();
		};
		const onMove = (event) => {
			const target = event.target;
			if (target instanceof Element && target.closest(".console-shell")) {
				if (!inside) {
					inside = true;
					freeze();
				}
				return;
			}
			if (inside) {
				inside = false;
				unfreeze();
			}
			const px = (event.clientX / window.innerWidth - .5) * 2;
			const py = (event.clientY / window.innerHeight - .5) * 2;
			for (const setter of setters) {
				if (!setter) continue;
				setter.x(px * setter.depth);
				setter.y(py * setter.depth);
			}
		};
		window.addEventListener("mousemove", onMove, { passive: true });
		return () => {
			window.removeEventListener("mousemove", onMove);
			for (const setter of setters) {
				if (!setter) continue;
				setter.x.tween.kill();
				setter.y.tween.kill();
			}
			for (const tween of driftTweens) tween?.kill();
		};
	}, [layers]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "emoji-backdrop",
		"aria-hidden": "true",
		children: layers.map((layer, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "emoji-layer",
			ref: (el) => {
				layerRefs.current[index] = el;
			},
			style: layer.blur ? { filter: `blur(${layer.blur}px)` } : void 0,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "emoji-drift",
				ref: (el) => {
					driftRefs.current[index] = el;
				},
				children: layer.tiles.map((tile, tileIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: cn("emoji-tile", tile.glitch && "is-glitch"),
					style: {
						left: `${tile.left}%`,
						top: `${tile.top}%`,
						"--emoji-opacity": tile.opacity.toFixed(3),
						"--emoji-size": `${tile.size.toFixed(1)}px`,
						"--emoji-rotate": `${tile.rotate.toFixed(1)}deg`,
						"--emoji-delay": `${tile.delay.toFixed(2)}s`,
						"--emoji-duration": `${tile.duration.toFixed(2)}s`
					},
					children: tile.char
				}, tileIndex))
			})
		}, index))
	});
}
function Index() {
	const [started, setStarted] = (0, import_react.useState)(false);
	const [soundOn, setSoundOn] = (0, import_react.useState)(true);
	const [dark, setDark] = (0, import_react.useState)(false);
	const [denied, setDenied] = (0, import_react.useState)(false);
	const denyTimer = (0, import_react.useRef)(null);
	const [position, setPosition] = (0, import_react.useState)(0);
	const [menuDetail, setMenuDetail] = (0, import_react.useState)(null);
	const [bioOpen, setBioOpen] = (0, import_react.useState)(false);
	const [vault, setVault] = (0, import_react.useState)(false);
	const [tree, setTree] = (0, import_react.useState)(false);
	const [activeLang, setActiveLang] = (0, import_react.useState)("PYTHON");
	const [ridgeOffset, setRidgeOffset] = (0, import_react.useState)(0);
	const [dragging, setDragging] = (0, import_react.useState)(false);
	const dragRef = (0, import_react.useRef)(null);
	const wheelRef = (0, import_react.useRef)({
		acc: 0,
		lastDir: 0,
		lockUntil: 0,
		snapTimer: null
	});
	const locked = !started;
	(0, import_react.useEffect)(() => {
		setSoundOn(!isMuted());
		attachAudioUnlock();
		return () => detachAudioUnlock();
	}, []);
	(0, import_react.useEffect)(() => {
		if (window.localStorage.getItem("console-theme") === "dark") setDark(true);
	}, []);
	(0, import_react.useEffect)(() => {
		document.body.classList.toggle("stage-dark", dark);
	}, [dark]);
	const toggleSound = () => {
		const next = !soundOn;
		setSoundOn(next);
		setMuted(!next);
		if (next) playConsoleSound("open");
	};
	const toggleTheme = () => {
		const next = !dark;
		setDark(next);
		window.localStorage.setItem("console-theme", next ? "dark" : "light");
		playConsoleSound("press");
	};
	const screen = position === 0 ? "home" : position === 1 ? "profile" : position <= 5 ? "about" : position === 6 ? "work" : position === 7 ? "find" : "contact";
	const menuIndex = Math.min(3, Math.max(0, position - 2));
	const view = bioOpen ? "bio" : vault ? "vault" : tree ? "tree" : screen;
	const canContinue = view === "about" && !menuDetail;
	const canBack = !!menuDetail || view === "bio" || view === "vault" || view === "tree";
	const nudge = () => {
		playConsoleSound("deny");
		setDenied(true);
		if (denyTimer.current) clearTimeout(denyTimer.current);
		denyTimer.current = setTimeout(() => setDenied(false), 340);
	};
	const applyPosition = (nextPosition) => {
		const boundedPosition = Math.min(LAST_POSITION, Math.max(0, nextPosition));
		setPosition(boundedPosition);
		setMenuDetail(null);
		setBioOpen(false);
		setVault(false);
		setTree(false);
		setRidgeOffset(boundedPosition * NOTCH);
	};
	const goToPosition = (nextPosition) => {
		if (locked && nextPosition !== 0) {
			nudge();
			return;
		}
		playConsoleSound("move");
		applyPosition(nextPosition);
	};
	const startGame = () => {
		playConsoleSound("start");
		setStarted(true);
		setDenied(false);
		applyPosition(1);
	};
	const move = (direction, steps = 1) => {
		if (locked) return;
		playConsoleSound("move");
		setPosition((currentPosition) => {
			const nextPosition = Math.min(LAST_POSITION, Math.max(0, currentPosition + direction * steps));
			setMenuDetail(null);
			setBioOpen(false);
			setVault(false);
			setTree(false);
			return nextPosition;
		});
	};
	const turnDial = (direction) => {
		if (locked) {
			nudge();
			return;
		}
		setRidgeOffset((offset) => {
			return Math.round(offset / NOTCH) * NOTCH + direction * NOTCH;
		});
		move(direction);
	};
	const startDial = (event) => {
		if (locked) {
			nudge();
			return;
		}
		event.currentTarget.setPointerCapture(event.pointerId);
		setDragging(true);
		dragRef.current = {
			startY: event.clientY,
			baseOffset: ridgeOffset,
			lockUntil: 0
		};
	};
	const dragDial = (event) => {
		const drag = dragRef.current;
		if (!drag) return;
		const now = event.timeStamp || Date.now();
		const offset = drag.baseOffset + (event.clientY - drag.startY);
		if (Math.abs(event.clientY - drag.startY) >= DRAG_STEP && now >= drag.lockUntil) {
			const direction = event.clientY > drag.startY ? 1 : -1;
			drag.baseOffset = offset;
			drag.startY = event.clientY;
			drag.lockUntil = now + STEP_COOLDOWN;
			move(direction);
			setRidgeOffset(Math.min(240, Math.max(0, offset)));
		} else setRidgeOffset(offset);
	};
	const finishDial = () => {
		if (!dragRef.current) return;
		dragRef.current = null;
		setDragging(false);
		setRidgeOffset((offset) => Math.round(offset / NOTCH) * NOTCH);
	};
	const wheelDial = (event) => {
		event.preventDefault();
		const wheel = wheelRef.current;
		if (locked) {
			wheel.acc = 0;
			wheel.lastDir = 0;
			nudge();
			return;
		}
		const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
		if (wheel.lastDir !== 0 && Math.sign(dy) !== wheel.lastDir) {
			wheel.acc = 0;
			wheel.lockUntil = 0;
		}
		wheel.lastDir = Math.sign(dy);
		wheel.acc += dy;
		const now = event.timeStamp || Date.now();
		if (Math.abs(wheel.acc) >= WHEEL_STEP && now >= wheel.lockUntil) {
			const direction = wheel.acc > 0 ? 1 : -1;
			wheel.acc = 0;
			wheel.lockUntil = now + STEP_COOLDOWN;
			move(direction);
			setRidgeOffset((offset) => {
				const base = Math.round(offset / NOTCH) * NOTCH;
				return Math.min(240, Math.max(0, base + direction * NOTCH));
			});
		} else if (now < wheel.lockUntil) wheel.acc = Math.min(Math.abs(wheel.acc), WHEEL_STEP) * wheel.lastDir;
		if (wheel.snapTimer) clearTimeout(wheel.snapTimer);
		wheel.snapTimer = setTimeout(() => {
			wheel.acc = 0;
			wheel.lastDir = 0;
		}, 140);
	};
	const selectMenuItem = () => {
		const selectedItem = menuItems[menuIndex];
		if (!selectedItem) return;
		if (selectedItem === "EXIT") {
			goToPosition(0);
			return;
		}
		if (selectedItem === "PROJECT") {
			playConsoleSound("open");
			setBioOpen(false);
			setTree(false);
			setVault(true);
			return;
		}
		if (selectedItem === "SKILLS") {
			playConsoleSound("open");
			setBioOpen(false);
			setVault(false);
			setTree(true);
			return;
		}
		playConsoleSound("open");
		setVault(false);
		setTree(false);
		setBioOpen(true);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "console-stage",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: cn("theme-toggle", !dark && "is-off"),
				onClick: toggleTheme,
				"aria-pressed": dark,
				"aria-label": dark ? "Switch to day mode" : "Switch to night mode",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
						className: "theme-led",
						"aria-hidden": "true"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "theme-glyph",
						"aria-hidden": "true",
						children: dark ? "☾" : "☀"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "theme-label",
						children: dark ? "NIGHT ON" : "NIGHT OFF"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HackerEmojiBackdrop, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "console-shell",
				"aria-label": "Personal portfolio game console",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "console-topline",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "brand-lockup",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "power-light",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "NF—01" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								className: cn("sound-toggle", !soundOn && "is-off"),
								onClick: toggleSound,
								"aria-pressed": soundOn,
								"aria-label": soundOn ? "Mute console sound" : "Unmute console sound",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
									className: "sound-led",
									"aria-hidden": "true"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: soundOn ? "SND ON" : "SND OFF" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "edition",
								children: "PERSONAL SYSTEM"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "screen-bezel",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("console-screen", locked && denied && "is-denied"),
							"aria-live": "polite",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "screen-grid",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "screen-scanline",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hud-corner hud-corner-tl",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hud-corner hud-corner-tr",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hud-corner hud-corner-bl",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "hud-corner hud-corner-br",
									"aria-hidden": "true"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "screen-header",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "status",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}), " GLOBAL SCAN ACTIVE"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "signal-bars",
										"aria-label": `Screen ${screens[screen].number} of ${String(TOTAL_SCREENS).padStart(2, "0")}`,
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
											" ",
											screens[screen].number,
											"/",
											String(TOTAL_SCREENS).padStart(2, "0")
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "screen-content",
									children: [
										view === "bio" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "bio-screen",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "screen-kicker",
													children: "SUBJECT: RIO // BACKSTORY"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
													"About",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Me."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "screen-copy bio-copy",
													children: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat."
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "bio-copy",
													children: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "bio-meter",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "MYSTERY LEVEL // 78%" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "bio-bar",
														"aria-hidden": "true",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
													})]
												})
											]
										}),
										view === "home" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "home-screen",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "home-sparks",
													"aria-hidden": "true",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "screen-kicker",
													children: locked ? "PLAYER_ONE // STANDBY" : "PLAYER_ONE // IDENTIFIED"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
													className: "home-title",
													children: [
														"Hi, I’m",
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
															className: "home-name",
															children: ["Ryo.", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "home-sword",
																"aria-hidden": "true",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PixelSprite, {
																	rows: swordSprite,
																	className: "home-sword-blade"
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "sword-dust" })]
															})]
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "screen-copy home-copy",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "home-typed",
														children: "I build thoughtful digital experiences with a playful edge."
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "home-caret",
														"aria-hidden": "true",
														children: "▮"
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "home-vitals",
													"aria-hidden": "true",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "vitals-label",
															children: "HP"
														}),
														Array.from({ length: 5 }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PixelSprite, {
															rows: index < 4 ? heartSprite : heartOutline,
															className: "vitals-heart"
														}, index)),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "vitals-lv",
															children: "LV.26"
														})
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													type: "button",
													className: "press-start",
													onClick: () => {
														if (locked) {
															startGame();
															return;
														}
														playConsoleSound("move");
														applyPosition(1);
													},
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															"aria-hidden": "true",
															children: "►"
														}),
														" ",
														locked ? "PRESS START" : "CONTINUE"
													]
												})
											]
										}),
										view === "profile" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "profile-screen",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "screen-kicker",
													children: "PLAYER PROFILE // DATA CARD"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
													"Rio's",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Dossier."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "profile-body",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "character-box",
														"aria-label": "Character portrait",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "character-sprite",
															"aria-hidden": "true",
															children: "👾"
														})
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
														className: "stat-list",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "NAME" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "Satrio (Ryo)" })] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "EMAIL" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "ardiansyahhsatrio@gmail.com" })] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "REGION" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "Southeast Asia" })] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "LANGUAGES" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "English · Indonesian" })] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "STRENGTHS" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: "Backend & AI Integration" })] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", { children: "POWER" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
																className: "power-logos",
																children: powerLogos.map((logo) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
																	href: logo.href,
																	target: "_blank",
																	rel: "noreferrer noopener",
																	"aria-label": `${logo.name} profile`,
																	title: logo.name,
																	onClick: () => playConsoleSound("press"),
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																		src: logo.src,
																		alt: "",
																		width: 24,
																		height: 24
																	})
																}, logo.name))
															})] })
														]
													})]
												})
											]
										}),
										view === "about" && (menuDetail ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "menu-detail",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "screen-kicker",
												children: menuDetail
											}), menuDetail === "ABOUT ME" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
												"Curious by",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												"default."
											] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "screen-copy",
												children: "Designer and developer turning ideas into clear, memorable products."
											})] })]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "menu-screen",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "menu-heading",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "screen-kicker",
													children: "PLAYER_MENU // 04 MODULES"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
													"Choose your",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"next move."
												] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "screen-menu",
												role: "listbox",
												"aria-label": "Portfolio menu",
												children: menuItems.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													className: index === menuIndex ? "is-active" : void 0,
													type: "button",
													role: "option",
													"aria-selected": index === menuIndex,
													tabIndex: index === menuIndex ? 0 : -1,
													onClick: () => {
														if (item === "PROJECT") {
															playConsoleSound("open");
															setBioOpen(false);
															setTree(false);
															setVault(true);
															return;
														}
														if (item === "SKILLS") {
															playConsoleSound("open");
															setBioOpen(false);
															setVault(false);
															setTree(true);
															return;
														}
														if (item === "ABOUT ME") {
															playConsoleSound("open");
															goToPosition(2);
															setBioOpen(true);
															return;
														}
														goToPosition(0);
													},
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "menu-marker",
															"aria-hidden": "true"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {
															"aria-hidden": "true",
															children: String(index + 1).padStart(2, "0")
														})
													]
												}, item))
											})]
										})),
										view === "work" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "skills-screen",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "screen-kicker",
													children: "STATUS READING // ABILITY MATRIX"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
													"RIO's",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Skills."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillsRadar, { skills })
											]
										}),
										view === "tree" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "techtree-screen",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "screen-kicker",
													children: "SKILL TREE // TECH STACK.SYS"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
													"Tech",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Tree."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "techtree-body",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "tech-root",
															children: "RIO.DEV"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "tech-trunk",
															"aria-hidden": "true"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "tech-langs",
															role: "tablist",
															"aria-label": "Skill languages",
															children: techTree.map((branch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
																type: "button",
																role: "tab",
																"aria-selected": activeLang === branch.language,
																className: cn("tech-lang", activeLang === branch.language && "is-active"),
																onClick: () => {
																	playConsoleSound("press");
																	setActiveLang((current) => current === branch.language ? null : branch.language);
																},
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																	src: techIcon(branch.icon),
																	alt: "",
																	width: 20,
																	height: 20
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: branch.language })]
															}, branch.language))
														}),
														techTree.filter((branch) => branch.language === activeLang).map((branch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "tech-branch",
															role: "tabpanel",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "tech-stub",
																"aria-hidden": "true"
															}), branch.groups.map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "tech-group",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "tech-group-label",
																	children: group.label
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																	className: "tech-chips",
																	children: group.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																		className: "tech-chip",
																		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
																			src: techIcon(item.icon),
																			alt: "",
																			width: 14,
																			height: 14
																		}), item.name]
																	}, item.name))
																})]
															}, group.label))]
														}, branch.language))
													]
												})
											]
										}),
										view === "vault" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "project-screen",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "screen-kicker",
													children: [
														"INVENTORY // QUEST ITEMS ",
														projects.length,
														"/8"
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
													"Project",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Vault."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "inventory-grid",
													role: "list",
													"aria-label": "Project inventory",
													children: projects.map((project, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
														role: "listitem",
														className: "inventory-slot",
														href: project.href,
														target: "_blank",
														rel: "noreferrer noopener",
														"aria-label": `Open ${project.name} repository on GitHub`,
														onClick: () => playConsoleSound("press"),
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "slot-index",
																"aria-hidden": "true",
																children: String(index + 1).padStart(2, "0")
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "slot-body",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: project.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: project.type })]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "slot-go",
																"aria-hidden": "true",
																children: "OPEN REPO ↗"
															})
														]
													}, project.name))
												})
											]
										}),
										view === "find" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "find-screen",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "screen-kicker",
													children: [
														"TRACK ME DOWN // ",
														platforms.length,
														" CHANNELS"
													]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
													"Find Me",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
													"Here."
												] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FindMeCarousel, { items: platforms })
											]
										}),
										view === "contact" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "screen-kicker",
												children: "OPEN CHANNEL"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", { children: [
												"Let’s make",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
												"something."
											] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
												className: "contact-link",
												href: "mailto:hello@example.com",
												onClick: () => playConsoleSound("press"),
												children: "HELLO@EXAMPLE.COM ↗"
											})
										] })
									]
								}, view),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "screen-footer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"VER 1.0.4",
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
										"SIG-STRENGTH: 98%"
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: view === "bio" ? "SYS_BIO" : view === "vault" ? "SYS_VAULT" : view === "tree" ? "SYS_TECHTREE" : view === "about" && !menuDetail ? `SELECT ${menuIndex + 1}/4` : `SYS_${screens[screen].label}` })]
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "console-controls",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "dial-wrap",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "jog-stack",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "jog-arrow",
											"aria-hidden": "true",
											children: "▲"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "jog-dial",
											role: "slider",
											"aria-label": "Scroll up or down to navigate screens",
											"aria-orientation": "vertical",
											"aria-valuemin": 1,
											"aria-valuemax": 9,
											"aria-valuenow": position + 1,
											tabIndex: 0,
											onPointerDown: startDial,
											onPointerMove: dragDial,
											onPointerUp: finishDial,
											onPointerCancel: finishDial,
											onWheel: wheelDial,
											onKeyDown: (event) => {
												if (event.key === "ArrowDown") turnDial(1);
												if (event.key === "ArrowUp") turnDial(-1);
											},
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("jog-ridges", dragging && "is-dragging"),
												style: { backgroundPositionY: `${ridgeOffset}px` }
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "jog-arrow",
											"aria-hidden": "true",
											children: "▼"
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "dial-label",
									children: "SCROLL"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "system-controls",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => goToPosition(0),
										"aria-label": "Open home screen",
										className: "pill-button"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "SELECT" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											if (locked) {
												startGame();
												return;
											}
											goToPosition(6);
										},
										"aria-label": locked ? "Start: go to page 2" : "Open skills screen",
										className: "pill-button"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "START" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "action-controls",
								"aria-label": "Quick access controls",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => {
										playConsoleSound("press");
										window.open(TOUCH_ME_URL, "_blank", "noopener,noreferrer");
									},
									"aria-label": "Open profile link",
									className: "bar-button",
									children: "TOUCH ME"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "action-row",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: cn("action-wrap", !canBack && "is-dimmed"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: !canBack,
											"aria-disabled": !canBack,
											onClick: () => {
												playConsoleSound("close");
												if (bioOpen) {
													setBioOpen(false);
													return;
												}
												if (vault) {
													setVault(false);
													return;
												}
												if (tree) {
													setTree(false);
													return;
												}
												if (menuDetail) setMenuDetail(null);
											},
											"aria-label": "Back to menu",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "action-icon",
												"aria-hidden": "true",
												children: "◄"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "BACK" })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: cn("action-wrap", !canContinue && "is-dimmed"),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: !canContinue,
											"aria-disabled": !canContinue,
											onClick: () => {
												if (canContinue) selectMenuItem();
											},
											"aria-label": "Continue into selected section",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "action-icon",
												"aria-hidden": "true",
												children: "►"
											})
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "CONTINUE" })]
									})]
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "speaker",
						"aria-hidden": "true",
						children: Array.from({ length: 6 }).map((_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", {}, index))
					})
				]
			})
		]
	});
}
var REEL_REPS = 3;
function FindMeCarousel({ items }) {
	const count = items.length;
	const [pos, setPos] = (0, import_react.useState)(count);
	const [paused, setPaused] = (0, import_react.useState)(false);
	const [snapping, setSnapping] = (0, import_react.useState)(false);
	const reelRef = (0, import_react.useRef)(null);
	const posRef = (0, import_react.useRef)(pos);
	const wheel = (0, import_react.useRef)({
		acc: 0,
		lastDir: 0,
		lockUntil: 0,
		snapTimer: void 0
	});
	(0, import_react.useEffect)(() => {
		posRef.current = pos;
	}, [pos]);
	const spin = (0, import_react.useCallback)((direction, sound) => {
		if (count <= 1) return;
		if (sound) playConsoleSound("move");
		setSnapping(false);
		setPos((current) => current + direction);
	}, [count]);
	(0, import_react.useEffect)(() => {
		const el = reelRef.current;
		if (!el || count <= 1) return;
		const state = wheel.current;
		const onWheel = (event) => {
			event.preventDefault();
			event.stopPropagation();
			const dy = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? 100 : 1);
			if (state.lastDir !== 0 && Math.sign(dy) !== state.lastDir) {
				state.acc = 0;
				state.lockUntil = 0;
			}
			state.lastDir = Math.sign(dy);
			state.acc += dy;
			const now = event.timeStamp || Date.now();
			if (Math.abs(state.acc) >= WHEEL_STEP && now >= state.lockUntil) {
				const direction = state.acc > 0 ? 1 : -1;
				state.acc = 0;
				state.lockUntil = now + STEP_COOLDOWN;
				spin(direction, true);
			} else if (now < state.lockUntil) state.acc = Math.min(Math.abs(state.acc), WHEEL_STEP) * state.lastDir;
			if (state.snapTimer) clearTimeout(state.snapTimer);
			state.snapTimer = setTimeout(() => {
				state.acc = 0;
				state.lastDir = 0;
			}, 140);
		};
		el.addEventListener("wheel", onWheel, { passive: false });
		return () => {
			el.removeEventListener("wheel", onWheel);
			if (state.snapTimer) clearTimeout(state.snapTimer);
		};
	}, [count, spin]);
	(0, import_react.useEffect)(() => {
		if (paused || count <= 1) return;
		if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
		const id = setInterval(() => spin(1, false), 2400);
		return () => clearInterval(id);
	}, [
		paused,
		count,
		spin
	]);
	const handleTransitionEnd = (event) => {
		if (event.target !== event.currentTarget || event.propertyName !== "transform") return;
		if (count <= 1) return;
		const current = posRef.current;
		if (current >= 2 * count) {
			setSnapping(true);
			setPos(current - count);
		} else if (current <= count - 1) {
			setSnapping(true);
			setPos(current + count);
		}
	};
	(0, import_react.useEffect)(() => {
		if (!snapping) return;
		let inner = 0;
		const outer = requestAnimationFrame(() => {
			inner = requestAnimationFrame(() => setSnapping(false));
		});
		return () => {
			cancelAnimationFrame(outer);
			cancelAnimationFrame(inner);
		};
	}, [snapping]);
	if (count === 0) return null;
	const reel = Array.from({ length: REEL_REPS }, () => items).flat();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: reelRef,
		className: "find-reel",
		onMouseEnter: () => setPaused(true),
		onMouseLeave: () => setPaused(false),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "find-viewport",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "find-reticle",
				"aria-hidden": "true"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("find-strip", snapping && "is-snapping"),
				style: { transform: `translateY(calc(${1 - pos} * var(--find-pitch)))` },
				onTransitionEnd: handleTransitionEnd,
				children: reel.map((item, index) => {
					const distance = Math.abs(index - pos);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						className: cn("find-slot", distance === 0 ? "is-active" : distance === 1 ? "is-dim" : "is-far"),
						href: item.href,
						target: "_blank",
						rel: "noreferrer noopener",
						tabIndex: distance <= 1 ? 0 : -1,
						"aria-hidden": distance > 1,
						"aria-label": distance === 0 ? `Open ${item.name} profile` : `${item.name} — spin into centre`,
						onClick: (event) => {
							if (distance === 0) {
								playConsoleSound("press");
								return;
							}
							event.preventDefault();
							if (distance === 1) spin(index > pos ? 1 : -1, true);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: techIcon(item.icon),
								alt: "",
								width: 36,
								height: 36
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "find-meta",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: item.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: item.handle })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "find-go",
								"aria-hidden": "true",
								children: "VISIT ↗"
							})
						]
					}, `${item.name}-${index}`);
				})
			})]
		})
	});
}
var CX = 186;
var CY = 122;
var RADIUS = 72;
var RINGS = 4;
var LINE_HEIGHT = 9;
function polar(angle, ratio) {
	const rad = angle * Math.PI / 180;
	return {
		x: CX + RADIUS * ratio * Math.cos(rad),
		y: CY + RADIUS * ratio * Math.sin(rad)
	};
}
function polygonPoints(ratio, count) {
	return Array.from({ length: count }, (_, index) => {
		const point = polar(-90 + 360 / count * index, ratio);
		return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
	}).join(" ");
}
function SkillsRadar({ skills }) {
	const count = skills.length;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "skill-radar",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
			viewBox: "0 0 372 250",
			role: "img",
			"aria-label": `Skill chart: ${skills.map((skill) => `${skill.lines.join(" ")} ${skill.value}%`).join(", ")}`,
			children: [
				Array.from({ length: RINGS }, (_, ring) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
					className: "radar-web",
					points: polygonPoints((ring + 1) / RINGS, count)
				}, ring)),
				skills.map((skill, index) => {
					const outer = polar(-90 + 360 / count * index, 1);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
						className: "radar-web",
						x1: CX,
						y1: CY,
						x2: outer.x,
						y2: outer.y
					}, skill.lines.join(" "));
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("polygon", {
					className: "radar-shape",
					points: skills.map((skill, index) => {
						const point = polar(-90 + 360 / count * index, skill.value / 100);
						return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
					}).join(" ")
				}),
				skills.map((skill, index) => {
					const angle = -90 + 360 / count * index;
					const dot = polar(angle, skill.value / 100);
					const label = polar(angle, 1.26);
					const cos = Math.cos(angle * Math.PI / 180);
					const sin = Math.sin(angle * Math.PI / 180);
					const anchor = Math.abs(cos) < .3 ? "middle" : cos > 0 ? "start" : "end";
					const firstDy = sin < -.5 ? -11 : sin > .5 ? 8 : -1;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
						className: "radar-dot",
						cx: dot.x,
						cy: dot.y,
						r: 2.6
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						className: "radar-label",
						x: label.x,
						y: label.y,
						textAnchor: anchor,
						children: skill.lines.map((line, lineIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tspan", {
							x: label.x,
							dy: lineIndex === 0 ? firstDy : LINE_HEIGHT,
							children: line
						}, line))
					})] }, skill.lines.join(" "));
				})
			]
		})
	});
}
function PixelSprite({ rows, className, label }) {
	const cols = Math.max(...rows.map((row) => row.length));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		className,
		viewBox: `0 0 ${cols} ${rows.length}`,
		shapeRendering: "crispEdges",
		role: label ? "img" : void 0,
		"aria-label": label,
		"aria-hidden": label ? void 0 : true,
		children: rows.map((row, y) => row.split("").map((cell, x) => cell === "." ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x,
			y,
			width: 1,
			height: 1,
			fill: cell === "2" ? "var(--screen-glow)" : "var(--console-screen-ink)"
		}, `${x}-${y}`)))
	});
}
//#endregion
export { Index as component };
