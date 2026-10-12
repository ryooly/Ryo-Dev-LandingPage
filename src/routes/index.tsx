import { createFileRoute } from "@tanstack/react-router";
import gsap from "gsap";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type CSSProperties,
  type TransitionEvent as ReactTransitionEvent,
  type WheelEvent as ReactWheelEvent,
} from "react";

import {
  attachAudioUnlock,
  detachAudioUnlock,
  isMuted,
  playConsoleSound,
  setMuted,
} from "@/lib/console-sound";
import { cn } from "@/lib/utils";

type Screen = "home" | "profile" | "about" | "work" | "find" | "contact";
type MenuItem = "ABOUT ME" | "PROJECT" | "SKILLS" | "EXIT";
type MenuDetail = Exclude<MenuItem, "EXIT">;

const screens: Record<Screen, { number: string; label: string }> = {
  home: { number: "01", label: "HOME" },
  profile: { number: "02", label: "PROFILE" },
  about: { number: "03", label: "ABOUT" },
  work: { number: "04", label: "SKILLS" },
  find: { number: "05", label: "FIND" },
  contact: { number: "06", label: "CONTACT" },
};
const TOTAL_SCREENS = 6;

const NOTCH = 30;
const DRAG_STEP = 24;
const WHEEL_STEP = 40;

const STEP_COOLDOWN = 220;
const LAST_POSITION = 8;
const menuItems: MenuItem[] = ["ABOUT ME", "PROJECT", "SKILLS", "EXIT"];

const TOUCH_ME_URL = "https://www.linkedin.com/in/satrio-a-84445a335";

const swordSprite = [
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
  "...1...",
];

const heartSprite = [".11.11.", "1111111", "1111111", ".11111.", "..111..", "...1..."];

const heartOutline = [".11.11.", "1..1..1", "1.....1", ".1...1.", "..111..", "...1..."];

type Skill = { lines: [string, string]; value: number };

const skills: Skill[] = [
  { lines: ["FRONTEND", "DEV"], value: 43 },
  { lines: ["BACKEND", "DEV"], value: 90 },
  { lines: ["SYSTEM", "ARCH"], value: 73 },
  { lines: ["DEVOPS", "& CLOUD"], value: 55 },
  { lines: ["VECTOR DB", "& DATA"], value: 75 },
  { lines: ["AI", "INTEGRATION"], value: 80 },
  { lines: ["AI", "AGENTIC"], value: 45 },
  { lines: ["VIBE", "CODING"], value: 80 },
];

const powerLogos = [
  {
    name: "GitHub",
    href: "https://github.com/ryooly",
    src: "https://cdn.simpleicons.org/github/1d3a2a",
  },
  {
    name: "LeetCode",
    href: "https://leetcode.com/u/ryoleee/",
    src: "https://cdn.simpleicons.org/leetcode/1d3a2a",
  },
  {
    name: "Codewars",
    href: "https://www.codewars.com/users/Shinyoo0",
    src: "https://cdn.simpleicons.org/codewars/1d3a2a",
  },
];

type Project = { name: string; type: string; href: string };

const CONTACT_EMAIL = "ardiansyahhsatrio@gmail.com";

const projects: Project[] = [
  {
    name: "SPRINKLE",
    type: "BROWSER EXTENSION // INVENTORY",
    href: "https://github.com/ryooly/sprinkle-extension-inventory",
  },
];

type Platform = { name: string; handle: string; href: string; icon: string; src?: string };

const platforms: Platform[] = [
  { name: "X", handle: "@ryollie", href: "https://x.com/ryollie?s=11", icon: "x" },
  {
    name: "LinkedIn",
    handle: "satrio-a",
    href: "https://www.linkedin.com/in/satrio-a-84445a335?utm_source=share_via&utm_content=profile&utm_medium=member_ios",
    icon: "linkedin",

    src: "/icons/linkedin.svg",
  },
  {
    name: "Threads",
    handle: "@ryollyy_",
    href: "https://www.threads.com/@ryollyy_?igshid=NTc4MTIwNjQ2YQ==",
    icon: "threads",
  },
  {
    name: "GitHub",
    handle: "ryooly",
    href: "https://github.com/ryooly",
    icon: "github",
  },
  {
    name: "Duolingo",
    handle: "ryolly_",
    href: "https://invite.duolingo.com/profile-share/ryolly_?via=share_profile_qr",
    icon: "duolingo",
  },
];

type TechItem = { name: string; icon: string };
type TechBranch = {
  language: string;
  icon: string;
  groups: { label: string; items: TechItem[] }[];
};

const techIcon = (slug: string) => `https://cdn.simpleicons.org/${slug}/1d3a2a`;

function GithubMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const techTree: TechBranch[] = [
  {
    language: "PYTHON",
    icon: "python",
    groups: [
      { label: "SERVER & WEB", items: [{ name: "FASTAPI", icon: "fastapi" }] },
      {
        label: "AI & LLM",
        items: [
          { name: "OPENAI", icon: "openai" },
          { name: "CLAUDE", icon: "anthropic" },
        ],
      },
      {
        label: "DATABASES",
        items: [
          { name: "POSTGRESQL", icon: "postgresql" },
          { name: "MONGODB", icon: "mongodb" },
          { name: "MYSQL", icon: "mysql" },
        ],
      },
      {
        label: "ENV & TOOLING",
        items: [
          { name: "DOCKER", icon: "docker" },
          { name: "LINUX", icon: "linux" },
          { name: "CURSOR AI", icon: "cursor" },
        ],
      },
    ],
  },
  {
    language: "TYPESCRIPT",
    icon: "typescript",
    groups: [
      {
        label: "FRAMEWORKS",
        items: [
          { name: "NEXT.JS", icon: "nextdotjs" },
          { name: "VUE.JS", icon: "vuedotjs" },
        ],
      },
      { label: "RUNTIME", items: [{ name: "NODE.JS", icon: "nodedotjs" }] },
      {
        label: "DATABASES",
        items: [
          { name: "POSTGRESQL", icon: "postgresql" },
          { name: "MYSQL", icon: "mysql" },
        ],
      },
      {
        label: "ENV & TOOLING",
        items: [
          { name: "VS CODE", icon: "visualstudiocode" },
          { name: "GIT", icon: "git" },
        ],
      },
    ],
  },
  {
    language: "JAVASCRIPT",
    icon: "javascript",
    groups: [
      {
        label: "FRAMEWORKS",
        items: [
          { name: "NEXT.JS", icon: "nextdotjs" },
          { name: "VUE.JS", icon: "vuedotjs" },
        ],
      },
      { label: "RUNTIME", items: [{ name: "NODE.JS", icon: "nodedotjs" }] },
      { label: "DATABASES", items: [{ name: "MONGODB", icon: "mongodb" }] },
      {
        label: "ENV & TOOLING",
        items: [
          { name: "GIT", icon: "git" },
          { name: "VS CODE", icon: "visualstudiocode" },
        ],
      },
    ],
  },
];

const hackerEmojis = [
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
  "🚩",
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type EmojiTile = {
  char: string;
  left: number;
  top: number;
  size: number;
  rotate: number;
  opacity: number;
  delay: number;
  duration: number;
  glitch: boolean;
};

type EmojiLayerSpec = {
  cols: number;
  rows: number;
  size: [number, number];
  opacity: [number, number];
  depth: number;
  blur: number;
  jitter: number;
};

const emojiLayerSpecs: EmojiLayerSpec[] = [
  { cols: 9, rows: 6, size: [12, 18], opacity: [0.12, 0.22], depth: 14, blur: 1.1, jitter: 0.62 },
  { cols: 7, rows: 5, size: [18, 27], opacity: [0.2, 0.36], depth: 32, blur: 0.3, jitter: 0.58 },
  { cols: 5, rows: 4, size: [27, 42], opacity: [0.32, 0.52], depth: 56, blur: 0, jitter: 0.52 },
];

function buildEmojiLayers(): { depth: number; blur: number; tiles: EmojiTile[] }[] {
  const rng = mulberry32(1337);
  return emojiLayerSpecs.map((spec) => {
    const cellW = 100 / spec.cols;
    const cellH = 100 / spec.rows;
    const tiles: EmojiTile[] = [];
    for (let row = 0; row < spec.rows; row += 1) {
      for (let col = 0; col < spec.cols; col += 1) {
        const [minSize, maxSize] = spec.size;
        const [minOpacity, maxOpacity] = spec.opacity;
        tiles.push({
          char: hackerEmojis[Math.floor(rng() * hackerEmojis.length)] ?? "👾",
          left: (col + 0.5 + (rng() - 0.5) * spec.jitter) * cellW,
          top: (row + 0.5 + (rng() - 0.5) * spec.jitter) * cellH,
          size: minSize + rng() * (maxSize - minSize),
          rotate: (rng() - 0.5) * 44,
          opacity: minOpacity + rng() * (maxOpacity - minOpacity),
          delay: -rng() * 6,
          duration: 3.4 + rng() * 3.2,

          glitch: rng() < 0.08,
        });
      }
    }
    return { depth: spec.depth, blur: spec.blur, tiles };
  });
}

function HackerEmojiBackdrop() {
  const layers = useMemo(buildEmojiLayers, []);
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const driftRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const setters = layers.map((layer, index) => {
      const el = layerRefs.current[index];
      if (!el) return null;
      const vars = { duration: 1.2, ease: "power3.out", overwrite: "auto" } as const;
      return { depth: layer.depth, x: gsap.quickTo(el, "x", vars), y: gsap.quickTo(el, "y", vars) };
    });

    let inside = false;

    const driftPaths = [
      [
        { x: 10, y: -6 },
        { x: -8, y: 8 },
        { x: 6, y: 4 },
        { x: 0, y: 0 },
      ],
      [
        { x: -16, y: 9 },
        { x: 13, y: -12 },
        { x: -6, y: 7 },
        { x: 0, y: 0 },
      ],
      [
        { x: 26, y: -15 },
        { x: -20, y: 17 },
        { x: 11, y: 9 },
        { x: 0, y: 0 },
      ],
    ];
    const driftTweens = driftRefs.current.map((el, index) => {
      const path = driftPaths[index % driftPaths.length];
      if (!el || !path) return null;
      return gsap.to(el, {
        keyframes: path,
        duration: 26 - index * 5,
        ease: "sine.inOut",
        repeat: -1,
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

    const onMove = (event: MouseEvent) => {
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
      const px = (event.clientX / window.innerWidth - 0.5) * 2;
      const py = (event.clientY / window.innerHeight - 0.5) * 2;
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

  return (
    <div className="emoji-backdrop" aria-hidden="true">
      {layers.map((layer, index) => (
        <div
          key={index}
          className="emoji-layer"
          ref={(el) => {
            layerRefs.current[index] = el;
          }}
          style={layer.blur ? { filter: `blur(${layer.blur}px)` } : undefined}
        >
          <div
            className="emoji-drift"
            ref={(el) => {
              driftRefs.current[index] = el;
            }}
          >
            {layer.tiles.map((tile, tileIndex) => (
              <span
                key={tileIndex}
                className={cn("emoji-tile", tile.glitch && "is-glitch")}
                style={
                  {
                    left: `${tile.left}%`,
                    top: `${tile.top}%`,
                    "--emoji-opacity": tile.opacity.toFixed(3),
                    "--emoji-size": `${tile.size.toFixed(1)}px`,
                    "--emoji-rotate": `${tile.rotate.toFixed(1)}deg`,
                    "--emoji-delay": `${tile.delay.toFixed(2)}s`,
                    "--emoji-duration": `${tile.duration.toFixed(2)}s`,
                  } as CSSProperties
                }
              >
                {tile.char}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ryo's Personal Page" },
      {
        name: "description",
        content: "Personal portfolio presented through an interactive game console.",
      },
      { property: "og:title", content: "Ryo's Personal Page" },
      {
        property: "og:description",
        content:
          "Explore my profile, work, and contact details through an interactive game console.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [started, setStarted] = useState(false);

  const [soundOn, setSoundOn] = useState(true);

  const [dark, setDark] = useState(false);
  const [denied, setDenied] = useState(false);
  const denyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [position, setPosition] = useState(0);
  const [menuDetail, setMenuDetail] = useState<MenuDetail | null>(null);
  const [bioOpen, setBioOpen] = useState(false);
  const [vault, setVault] = useState(false);
  const [tree, setTree] = useState(false);

  const [emailCopied, setEmailCopied] = useState(false);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [touchLit, setTouchLit] = useState(false);
  const touchLitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeLang, setActiveLang] = useState<string | null>("PYTHON");
  const [ridgeOffset, setRidgeOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    startY: number;
    baseOffset: number;
    lockUntil: number;
  } | null>(null);
  const wheelRef = useRef<{
    acc: number;
    lastDir: number;
    lockUntil: number;
    snapTimer: ReturnType<typeof setTimeout> | null;
  }>({ acc: 0, lastDir: 0, lockUntil: 0, snapTimer: null });

  const locked = !started;

  useEffect(() => {
    setSoundOn(!isMuted());

    attachAudioUnlock();
    return () => detachAudioUnlock();
  }, []);

  useEffect(() => {
    if (window.localStorage.getItem("console-theme") === "dark") setDark(true);
  }, []);

  useEffect(() => {
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

  const screen: Screen =
    position === 0
      ? "home"
      : position === 1
        ? "profile"
        : position <= 5
          ? "about"
          : position === 6
            ? "work"
            : position === 7
              ? "find"
              : "contact";
  const menuIndex = Math.min(3, Math.max(0, position - 2));

  const view: Screen | "bio" | "vault" | "tree" = bioOpen
    ? "bio"
    : vault
      ? "vault"
      : tree
        ? "tree"
        : screen;

  const canContinue = view === "about" && !menuDetail;
  const canBack = !!menuDetail || view === "bio" || view === "vault" || view === "tree";

  const nudge = () => {
    playConsoleSound("deny");
    setDenied(true);
    if (denyTimer.current) clearTimeout(denyTimer.current);
    denyTimer.current = setTimeout(() => setDenied(false), 340);
  };

  const applyPosition = (nextPosition: number) => {
    const boundedPosition = Math.min(LAST_POSITION, Math.max(0, nextPosition));
    setPosition(boundedPosition);
    setMenuDetail(null);
    setBioOpen(false);
    setVault(false);
    setTree(false);
    setRidgeOffset(boundedPosition * NOTCH);
  };

  const goToPosition = (nextPosition: number) => {
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

  const move = (direction: 1 | -1, steps = 1) => {
    if (locked) return;
    playConsoleSound("move");
    setPosition((currentPosition) => {
      const nextPosition = Math.min(
        LAST_POSITION,
        Math.max(0, currentPosition + direction * steps),
      );
      setMenuDetail(null);
      setBioOpen(false);
      setVault(false);
      setTree(false);
      return nextPosition;
    });
  };

  const turnDial = (direction: 1 | -1) => {
    if (locked) {
      nudge();
      return;
    }
    setRidgeOffset((offset) => {
      const snapped = Math.round(offset / NOTCH) * NOTCH;
      return snapped + direction * NOTCH;
    });
    move(direction);
  };

  const startDial = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (locked) {
      nudge();
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    dragRef.current = { startY: event.clientY, baseOffset: ridgeOffset, lockUntil: 0 };
  };

  const dragDial = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const now = event.timeStamp || Date.now();
    const offset = drag.baseOffset + (event.clientY - drag.startY);

    if (Math.abs(event.clientY - drag.startY) >= DRAG_STEP && now >= drag.lockUntil) {
      const direction = event.clientY > drag.startY ? 1 : -1;
      drag.baseOffset = offset;
      drag.startY = event.clientY;
      drag.lockUntil = now + STEP_COOLDOWN;
      move(direction as 1 | -1);
      setRidgeOffset(Math.min(LAST_POSITION * NOTCH, Math.max(0, offset)));
    } else {
      setRidgeOffset(offset);
    }
  };

  const finishDial = () => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setDragging(false);
    setRidgeOffset((offset) => Math.round(offset / NOTCH) * NOTCH);
  };

  const wheelDial = (event: ReactWheelEvent<HTMLDivElement>) => {
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
        return Math.min(LAST_POSITION * NOTCH, Math.max(0, base + direction * NOTCH));
      });
    } else if (now < wheel.lockUntil) {
      wheel.acc = Math.min(Math.abs(wheel.acc), WHEEL_STEP) * wheel.lastDir;
    }
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

  return (
    <main className="console-stage">
      <button
        type="button"
        className={cn("theme-toggle", !dark && "is-off")}
        onClick={toggleTheme}
        aria-pressed={dark}
        aria-label={dark ? "Switch to day mode" : "Switch to night mode"}
      >
        <i className="theme-led" aria-hidden="true" />
        <span className="theme-glyph" aria-hidden="true">
          {dark ? "☾" : "☀"}
        </span>
        <span className="theme-label">{dark ? "NIGHT ON" : "NIGHT OFF"}</span>
      </button>
      <HackerEmojiBackdrop />
      <section className="console-shell" aria-label="Personal portfolio game console">
        <div className="console-topline">
          <div className="brand-lockup">
            <span className="power-light" aria-hidden="true" />
            <span>NF—01</span>
          </div>
          <button
            type="button"
            className={cn("sound-toggle", !soundOn && "is-off")}
            onClick={toggleSound}
            aria-pressed={soundOn}
            aria-label={soundOn ? "Mute console sound" : "Unmute console sound"}
          >
            <i className="sound-led" aria-hidden="true" />
            <span>{soundOn ? "SND ON" : "SND OFF"}</span>
          </button>
          <span className="edition">PERSONAL SYSTEM</span>
        </div>

        <div className="screen-bezel">
          <div className={cn("console-screen", locked && denied && "is-denied")} aria-live="polite">
            <div className="screen-grid" aria-hidden="true" />
            <div className="screen-scanline" aria-hidden="true" />
            <span className="hud-corner hud-corner-tl" aria-hidden="true" />
            <span className="hud-corner hud-corner-tr" aria-hidden="true" />
            <span className="hud-corner hud-corner-bl" aria-hidden="true" />
            <span className="hud-corner hud-corner-br" aria-hidden="true" />
            <div className="screen-header">
              <span className="status">
                <i /> GLOBAL SCAN ACTIVE
              </span>
              <span
                className="signal-bars"
                aria-label={`Screen ${screens[screen].number} of ${String(TOTAL_SCREENS).padStart(2, "0")}`}
              >
                <i />
                <i />
                <i /> {screens[screen].number}/{String(TOTAL_SCREENS).padStart(2, "0")}
              </span>
            </div>

            <div className="screen-content" key={view}>
              {view === "bio" && (
                <div className="bio-screen">
                  <p className="screen-kicker">SUBJECT: RIO // BACKSTORY</p>
                  <h2>
                    About
                    <br />
                    Me.
                  </h2>
                  <p className="screen-copy bio-copy">
                    I combine <strong>software engineering and AI</strong> to build products that go
                    beyond traditional applications.
                  </p>
                  <p className="bio-copy">
                    From reliable backend systems to AI-powered automation and agentic workflows, I
                    build software that can <strong>think, adapt, and act</strong>.
                  </p>
                  <div className="bio-focus">
                    <p className="bio-focus-label">FOCUS // LOADOUT</p>
                    <ul className="bio-chips">
                      <li>AI × Software</li>
                      <li>Backend Systems</li>
                      <li>Agentic Workflows</li>
                      <li>Automation</li>
                    </ul>
                  </div>
                </div>
              )}
              {view === "home" && (
                <div className="home-screen">
                  <div className="home-sparks" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                  <p className="screen-kicker">
                    {locked ? "PLAYER_ONE // STANDBY" : "PLAYER_ONE // IDENTIFIED"}
                  </p>
                  <h1 className="home-title">
                    Hi, I’m
                    <br />
                    <span className="home-name">
                      Ryo.
                      <span className="home-sword" aria-hidden="true">
                        <PixelSprite rows={swordSprite} className="home-sword-blade" />
                        <i className="sword-dust" />
                      </span>
                    </span>
                  </h1>
                  <p className="screen-copy home-copy">
                    <span className="home-typed">
                      Claude Code, Codex, and Antigravity are useless without me.
                    </span>
                    <span className="home-caret" aria-hidden="true">
                      ▮
                    </span>
                  </p>
                  <div className="home-vitals" aria-hidden="true">
                    <span className="vitals-label">HP</span>
                    {Array.from({ length: 5 }, (_, index) => (
                      <PixelSprite
                        key={index}
                        rows={index < 4 ? heartSprite : heartOutline}
                        className="vitals-heart"
                      />
                    ))}
                    <span className="vitals-lv">LV.26</span>
                  </div>
                  <button
                    type="button"
                    className="press-start"
                    onClick={() => {
                      if (locked) {
                        startGame();
                        return;
                      }
                      playConsoleSound("move");
                      applyPosition(1);
                    }}
                  >
                    <span aria-hidden="true">►</span> {locked ? "PRESS START" : "CONTINUE"}
                  </button>
                </div>
              )}
              {view === "profile" && (
                <div className="profile-screen">
                  <p className="screen-kicker">PLAYER PROFILE // DATA CARD</p>
                  <h2>
                    Rio&apos;s
                    <br />
                    Dossier.
                  </h2>
                  <div className="profile-body">
                    <div className="character-box" aria-label="Character portrait">
                      <span className="character-sprite" aria-hidden="true">
                        👾
                      </span>
                    </div>
                    <dl className="stat-list">
                      <div>
                        <dt>NAME</dt>
                        <dd>Satrio (Ryo)</dd>
                      </div>
                      <div>
                        <dt>EMAIL</dt>
                        <dd>ardiansyahhsatrio@gmail.com</dd>
                      </div>
                      <div>
                        <dt>REGION</dt>
                        <dd>Southeast Asia</dd>
                      </div>
                      <div>
                        <dt>LANGUAGES</dt>
                        <dd>English · Indonesian</dd>
                      </div>
                      <div>
                        <dt>STRENGTHS</dt>
                        <dd>Backend &amp; AI Integration</dd>
                      </div>
                      <div>
                        <dt>POWER</dt>
                        <dd className="power-logos">
                          {powerLogos.map((logo) => (
                            <a
                              key={logo.name}
                              href={logo.href}
                              target="_blank"
                              rel="noreferrer noopener"
                              aria-label={`${logo.name} profile`}
                              title={logo.name}
                              onClick={() => playConsoleSound("press")}
                            >
                              <img src={logo.src} alt="" width={24} height={24} />
                            </a>
                          ))}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
              {view === "about" &&
                (menuDetail ? (
                  <div className="menu-detail">
                    <p className="screen-kicker">{menuDetail}</p>
                    {menuDetail === "ABOUT ME" && (
                      <>
                        <h2>
                          Curious by
                          <br />
                          default.
                        </h2>
                        <p className="screen-copy">
                          Designer and developer turning ideas into clear, memorable products.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="menu-screen">
                    <div className="menu-heading">
                      <p className="screen-kicker">PLAYER_MENU // 04 MODULES</p>
                      <h2>
                        Choose your
                        <br />
                        next move.
                      </h2>
                    </div>
                    <div className="screen-menu" role="listbox" aria-label="Portfolio menu">
                      {menuItems.map((item, index) => (
                        <button
                          key={item}
                          className={index === menuIndex ? "is-active" : undefined}
                          type="button"
                          role="option"
                          aria-selected={index === menuIndex}
                          tabIndex={index === menuIndex ? 0 : -1}
                          onClick={() => {
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
                          }}
                        >
                          <span className="menu-marker" aria-hidden="true" />
                          <strong>{item}</strong>
                          <i aria-hidden="true">{String(index + 1).padStart(2, "0")}</i>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              {view === "work" && (
                <div className="skills-screen">
                  <p className="screen-kicker">STATUS READING // ABILITY MATRIX</p>
                  <h2>
                    RIO&apos;s
                    <br />
                    Skills.
                  </h2>
                  <SkillsRadar skills={skills} />
                </div>
              )}
              {view === "tree" && (
                <div className="techtree-screen">
                  <p className="screen-kicker">SKILL TREE // TECH STACK.SYS</p>
                  <h2>
                    Tech
                    <br />
                    Tree.
                  </h2>
                  <div className="techtree-body">
                    <div className="tech-root">RIO.DEV</div>
                    <div className="tech-trunk" aria-hidden="true" />
                    <div className="tech-langs" role="tablist" aria-label="Skill languages">
                      {techTree.map((branch) => (
                        <button
                          key={branch.language}
                          type="button"
                          role="tab"
                          aria-selected={activeLang === branch.language}
                          className={cn("tech-lang", activeLang === branch.language && "is-active")}
                          onClick={() => {
                            playConsoleSound("press");
                            setActiveLang((current) =>
                              current === branch.language ? null : branch.language,
                            );
                          }}
                        >
                          <img src={techIcon(branch.icon)} alt="" width={20} height={20} />
                          <span>{branch.language}</span>
                        </button>
                      ))}
                    </div>
                    {techTree
                      .filter((branch) => branch.language === activeLang)
                      .map((branch) => (
                        <div key={branch.language} className="tech-branch" role="tabpanel">
                          <div className="tech-stub" aria-hidden="true" />
                          {branch.groups.map((group) => (
                            <div key={group.label} className="tech-group">
                              <span className="tech-group-label">{group.label}</span>
                              <div className="tech-chips">
                                {group.items.map((item) => (
                                  <span key={item.name} className="tech-chip">
                                    <img src={techIcon(item.icon)} alt="" width={14} height={14} />
                                    {item.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                </div>
              )}
              {view === "vault" && (
                <div className="project-screen">
                  <p className="screen-kicker">INVENTORY // QUEST ITEMS {projects.length}/8</p>
                  <h2>
                    Project
                    <br />
                    Vault.
                  </h2>
                  <div className="inventory-grid" role="list" aria-label="Project inventory">
                    {projects.map((project, index) => {
                      const isGithub = /github\.com/i.test(project.href);
                      return (
                        <a
                          key={project.name}
                          role="listitem"
                          className="inventory-slot"
                          href={project.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          aria-label={`Open ${project.name} repository on GitHub`}
                          onClick={() => playConsoleSound("press")}
                        >
                          <span className="slot-index" aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="slot-body">
                            <strong>{project.name}</strong>
                            <small>{project.type}</small>
                          </span>
                          <span className="slot-go" aria-hidden="true">
                            {isGithub && <GithubMark className="slot-go-icon" />}
                            <span className="slot-go-label">{isGithub ? "GITHUB" : "OPEN"} ↗</span>
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
              {view === "find" && (
                <div className="find-screen">
                  <p className="screen-kicker">TRACK ME DOWN // {platforms.length} CHANNELS</p>
                  <h2>
                    Find Me
                    <br />
                    Here.
                  </h2>
                  <FindMeCarousel items={platforms} />
                </div>
              )}
              {view === "contact" && (
                <>
                  <p className="screen-kicker">OPEN CHANNEL</p>
                  <h2>
                    Let’s make
                    <br />
                    something.
                  </h2>
                  <a
                    className={`contact-link${emailCopied ? " is-copied" : ""}`}
                    href={`mailto:${CONTACT_EMAIL}?subject=Let%27s%20build%20something`}
                    aria-label={`Email ${CONTACT_EMAIL}. Opens your mail app and copies the address.`}
                    onClick={() => {
                      playConsoleSound("press");
                      void (async () => {
                        try {
                          await navigator.clipboard.writeText(CONTACT_EMAIL);
                          setEmailCopied(true);
                          if (copyTimer.current) clearTimeout(copyTimer.current);
                          copyTimer.current = setTimeout(() => setEmailCopied(false), 2200);
                        } catch {}
                      })();
                    }}
                  >
                    {emailCopied ? "EMAIL COPIED ✓" : "ARDIANSYAHSATRIO@GMAIL.COM ↗"}
                  </a>
                </>
              )}
            </div>

            <div className="screen-footer">
              <span>
                VER 1.0.4
                <br />
                SIG-STRENGTH: 98%
              </span>
              <strong>
                {view === "bio"
                  ? "SYS_BIO"
                  : view === "vault"
                    ? "SYS_VAULT"
                    : view === "tree"
                      ? "SYS_TECHTREE"
                      : view === "about" && !menuDetail
                        ? `SELECT ${menuIndex + 1}/4`
                        : `SYS_${screens[screen].label}`}
              </strong>
            </div>
          </div>
        </div>

        <div className="console-controls">
          <div className="dial-wrap">
            <div className="jog-stack">
              <span className="jog-arrow" aria-hidden="true">
                ▲
              </span>
              <div
                className="jog-dial"
                role="slider"
                aria-label="Scroll up or down to navigate screens"
                aria-orientation="vertical"
                aria-valuemin={1}
                aria-valuemax={LAST_POSITION + 1}
                aria-valuenow={position + 1}
                tabIndex={0}
                onPointerDown={startDial}
                onPointerMove={dragDial}
                onPointerUp={finishDial}
                onPointerCancel={finishDial}
                onWheel={wheelDial}
                onKeyDown={(event) => {
                  if (event.key === "ArrowDown") turnDial(1);
                  if (event.key === "ArrowUp") turnDial(-1);
                }}
              >
                <span
                  className={cn("jog-ridges", dragging && "is-dragging")}
                  style={{ backgroundPositionY: `${ridgeOffset}px` }}
                />
              </div>
              <span className="jog-arrow" aria-hidden="true">
                ▼
              </span>
            </div>
            <span className="dial-label">SCROLL</span>
          </div>

          <div className="system-controls">
            <button
              onClick={() => goToPosition(0)}
              aria-label="Open home screen"
              className="pill-button"
            />
            <span>SELECT</span>
            <button
              onClick={() => {
                if (locked) {
                  startGame();
                  return;
                }
                goToPosition(6);
              }}
              aria-label={locked ? "Start: go to page 2" : "Open skills screen"}
              className="pill-button"
            />
            <span>START</span>
          </div>

          <div className="action-controls" aria-label="Quick access controls">
            <button
              type="button"
              onClick={() => {
                playConsoleSound("press");
                setTouchLit(true);
                if (touchLitTimer.current) clearTimeout(touchLitTimer.current);
                touchLitTimer.current = setTimeout(() => setTouchLit(false), 500);
                window.open(TOUCH_ME_URL, "_blank", "noopener,noreferrer");
              }}
              aria-label="Open profile link"
              className={cn("bar-button", touchLit && "is-lit")}
            >
              TOUCH ME
            </button>
            <div className="action-row">
              <div className={cn("action-wrap", !canBack && "is-dimmed")}>
                <button
                  type="button"
                  disabled={!canBack}
                  aria-disabled={!canBack}
                  onClick={() => {
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
                    if (menuDetail) {
                      setMenuDetail(null);
                    }
                  }}
                  aria-label="Back to menu"
                >
                  <span className="action-icon" aria-hidden="true">
                    ◄
                  </span>
                </button>
                <span>BACK</span>
              </div>
              <div className={cn("action-wrap", !canContinue && "is-dimmed")}>
                <button
                  type="button"
                  disabled={!canContinue}
                  aria-disabled={!canContinue}
                  onClick={() => {
                    if (canContinue) selectMenuItem();
                  }}
                  aria-label="Continue into selected section"
                >
                  <span className="action-icon" aria-hidden="true">
                    ►
                  </span>
                </button>
                <span>CONTINUE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="speaker" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <i key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}

const REEL_REPS = 3;

function FindMeCarousel({ items }: { items: Platform[] }) {
  const count = items.length;

  const [pos, setPos] = useState(count);
  const [paused, setPaused] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const reelRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(pos);
  const wheel = useRef({
    acc: 0,
    lastDir: 0,
    lockUntil: 0,
    snapTimer: undefined as ReturnType<typeof setTimeout> | undefined,
  });

  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const spin = useCallback(
    (direction: 1 | -1, sound: boolean) => {
      if (count <= 1) return;
      if (sound) playConsoleSound("move");
      setSnapping(false);
      setPos((current) => current + direction);
    },
    [count],
  );

  useEffect(() => {
    const el = reelRef.current;
    if (!el || count <= 1) return;
    const state = wheel.current;
    const onWheel = (event: WheelEvent) => {
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
        const direction: 1 | -1 = state.acc > 0 ? 1 : -1;
        state.acc = 0;
        state.lockUntil = now + STEP_COOLDOWN;
        spin(direction, true);
      } else if (now < state.lockUntil) {
        state.acc = Math.min(Math.abs(state.acc), WHEEL_STEP) * state.lastDir;
      }
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

  useEffect(() => {
    if (paused || count <= 1) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => spin(1, false), 2400);
    return () => clearInterval(id);
  }, [paused, count, spin]);

  const handleTransitionEnd = (event: ReactTransitionEvent<HTMLDivElement>) => {
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

  useEffect(() => {
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

  return (
    <div
      ref={reelRef}
      className="find-reel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="find-viewport">
        <span className="find-reticle" aria-hidden="true" />
        <div
          className={cn("find-strip", snapping && "is-snapping")}
          style={{ transform: `translateY(calc(${1 - pos} * var(--find-pitch)))` }}
          onTransitionEnd={handleTransitionEnd}
        >
          {reel.map((item, index) => {
            const distance = Math.abs(index - pos);
            const stateClass = distance === 0 ? "is-active" : distance === 1 ? "is-dim" : "is-far";
            return (
              <a
                key={`${item.name}-${index}`}
                className={cn("find-slot", stateClass)}
                href={item.href}
                target="_blank"
                rel="noreferrer noopener"
                tabIndex={distance <= 1 ? 0 : -1}
                aria-hidden={distance > 1}
                aria-label={
                  distance === 0 ? `Open ${item.name} profile` : `${item.name} — spin into centre`
                }
                onClick={(event) => {
                  if (distance === 0) {
                    playConsoleSound("press");
                    return;
                  }
                  event.preventDefault();
                  if (distance === 1) spin(index > pos ? 1 : -1, true);
                }}
              >
                <img src={item.src ?? techIcon(item.icon)} alt="" width={36} height={36} />
                <span className="find-meta">
                  <strong>{item.name}</strong>
                  <small>{item.handle}</small>
                </span>
                <span className="find-go" aria-hidden="true">
                  VISIT ↗
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const CX = 186;
const CY = 122;
const RADIUS = 72;
const RINGS = 4;
const LINE_HEIGHT = 9;

function polar(angle: number, ratio: number) {
  const rad = (angle * Math.PI) / 180;
  return {
    x: CX + RADIUS * ratio * Math.cos(rad),
    y: CY + RADIUS * ratio * Math.sin(rad),
  };
}

function polygonPoints(ratio: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const point = polar(-90 + (360 / count) * index, ratio);
    return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
  }).join(" ");
}

function SkillsRadar({ skills }: { skills: Skill[] }) {
  const count = skills.length;
  return (
    <div className="skill-radar">
      <svg
        viewBox="0 0 372 250"
        role="img"
        aria-label={`Skill chart: ${skills
          .map((skill) => `${skill.lines.join(" ")} ${skill.value}%`)
          .join(", ")}`}
      >
        {Array.from({ length: RINGS }, (_, ring) => (
          <polygon
            key={ring}
            className="radar-web"
            points={polygonPoints((ring + 1) / RINGS, count)}
          />
        ))}
        {skills.map((skill, index) => {
          const outer = polar(-90 + (360 / count) * index, 1);
          return (
            <line
              key={skill.lines.join(" ")}
              className="radar-web"
              x1={CX}
              y1={CY}
              x2={outer.x}
              y2={outer.y}
            />
          );
        })}
        <polygon
          className="radar-shape"
          points={skills
            .map((skill, index) => {
              const point = polar(-90 + (360 / count) * index, skill.value / 100);
              return `${point.x.toFixed(1)},${point.y.toFixed(1)}`;
            })
            .join(" ")}
        />
        {skills.map((skill, index) => {
          const angle = -90 + (360 / count) * index;
          const dot = polar(angle, skill.value / 100);
          const label = polar(angle, 1.26);
          const cos = Math.cos((angle * Math.PI) / 180);
          const sin = Math.sin((angle * Math.PI) / 180);
          const anchor = Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";

          const firstDy = sin < -0.5 ? -(LINE_HEIGHT + 2) : sin > 0.5 ? 8 : -1;
          return (
            <g key={skill.lines.join(" ")}>
              <circle className="radar-dot" cx={dot.x} cy={dot.y} r={2.6} />
              <text className="radar-label" x={label.x} y={label.y} textAnchor={anchor}>
                {skill.lines.map((line, lineIndex) => (
                  <tspan key={line} x={label.x} dy={lineIndex === 0 ? firstDy : LINE_HEIGHT}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function PixelSprite({
  rows,
  className,
  label,
}: {
  rows: string[];
  className?: string;
  label?: string;
}) {
  const cols = Math.max(...rows.map((row) => row.length));
  return (
    <svg
      className={className}
      viewBox={`0 0 ${cols} ${rows.length}`}
      shapeRendering="crispEdges"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {rows.map((row, y) =>
        row
          .split("")
          .map((cell, x) =>
            cell === "." ? null : (
              <rect
                key={`${x}-${y}`}
                x={x}
                y={y}
                width={1}
                height={1}
                fill={cell === "2" ? "var(--screen-glow)" : "var(--console-screen-ink)"}
              />
            ),
          ),
      )}
    </svg>
  );
}
