"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import Browser, { type Page } from "./Browser";
import RoomPanel from "./RoomPanel";
import { CONTENT } from "@/lib/content";

type RoomState = { day: boolean; lamp: boolean; music: boolean; lite: boolean };

type Api = {
  close: () => void;
  move: (d: number) => void;
  setDay: (d: boolean) => void;
  toggleLamp: () => void;
  toggleMusic: () => void;
  look: (name: string) => void;
  openComputer: () => void;
  setLite: (l: boolean) => void;
};

type Cb = {
  onOpen: () => void;
  onHover: (label: string | null) => void;
  onState: (s: RoomState) => void;
  onPage: (p: Page) => void;
  onPanel: (k: string) => void;
  onPunch: (n: number) => void;
};

type Tr = {
  fp: THREE.Vector3;
  tp: THREE.Vector3;
  fy: number;
  ty: number;
  fpi: number;
  tpi: number;
  dur: number;
  t: number;
  fadeTo: number | null;
  fadeFrom: number;
  done: () => void;
};

function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasTex(
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D, w: number, h: number) => void,
  repeat?: [number, number]
) {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d")!;
  draw(c, w, h);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

const std = (
  color: THREE.ColorRepresentation,
  o: THREE.MeshStandardMaterialParameters = {}
) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...o });

function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addCyl(
  parent: THREE.Object3D,
  rt: number,
  rb: number,
  h: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number,
  seg = 24
) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function addSphere(
  parent: THREE.Object3D,
  r: number,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number
) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const wrapAngle = (a: number) => Math.atan2(Math.sin(a), Math.cos(a));

/* soft generated piano-ish loop, no audio files needed */
function createMusic() {
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let step = 0;
  const chords = [
    [57, 60, 64, 67],
    [53, 57, 60, 64],
    [48, 52, 55, 59],
    [55, 59, 62, 64],
  ];
  const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

  const bar = () => {
    if (!ctx || !filter) return;
    const c = ctx;
    const f = filter;
    const t0 = c.currentTime + 0.05;
    const chord = chords[step % chords.length];
    step++;
    chord.forEach((m) => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "triangle";
      o.frequency.value = hz(m);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.05, t0 + 0.9);
      g.gain.linearRampToValueAtTime(0.0001, t0 + 4.6);
      o.connect(g);
      g.connect(f);
      o.start(t0);
      o.stop(t0 + 4.7);
    });
    for (let i = 0; i < 8; i++) {
      if (Math.random() < 0.3) continue;
      const m = chord[Math.floor(Math.random() * chord.length)] + 12;
      const tt = t0 + i * 0.5;
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = "sine";
      o.frequency.value = hz(m);
      g.gain.setValueAtTime(0.0001, tt);
      g.gain.exponentialRampToValueAtTime(0.06, tt + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, tt + 1.1);
      o.connect(g);
      g.connect(f);
      o.start(tt);
      o.stop(tt + 1.2);
    }
  };

  return {
    start() {
      if (!ctx) {
        const AC =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0;
        filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.value = 1200;
        filter.connect(master);
        master.connect(ctx.destination);
      }
      void ctx.resume();
      master!.gain.cancelScheduledValues(ctx.currentTime);
      master!.gain.setTargetAtTime(0.9, ctx.currentTime, 0.4);
      if (!timer) {
        bar();
        timer = setInterval(bar, 4000);
      }
    },
    stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    },
    dispose() {
      if (timer) clearInterval(timer);
      timer = null;
      if (ctx) void ctx.close();
      ctx = null;
    },
  };
}

function init(el: HTMLDivElement, hand: string, cb: Cb) {
  const rand = mulberry32(11);
  const handFont = (px: number) => `${px}px ${hand}, cursive`;
  const music = createMusic();

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  let lite = window.matchMedia("(pointer: coarse)").matches || el.clientWidth < 700;
  renderer.setPixelRatio(lite ? 1 : Math.min(window.devicePixelRatio, 2));
  renderer.setSize(el.clientWidth, el.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  el.appendChild(renderer.domElement);
  const dom = renderer.domElement;
  dom.style.touchAction = "none";
  dom.style.cursor = "grab";

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14110e);

  const camera = new THREE.PerspectiveCamera(70, el.clientWidth / el.clientHeight, 0.05, 40);
  camera.rotation.order = "YXZ";
  camera.position.set(0, 1.55, 1.4);
  let yaw = 0;
  let pitch = -0.08;

  const hotRoots: THREE.Object3D[] = [];
  const blockers: THREE.Object3D[] = [];
  const mark = (o: THREE.Object3D, id: string) => {
    o.userData.hot = id;
    hotRoots.push(o);
  };

  /* ---------- lights ---------- */
  const ambient = new THREE.AmbientLight(0xffe2bd, 0.55);
  const hemi = new THREE.HemisphereLight(0xffe8c8, 0x3b2c20, 1.3);
  const sun = new THREE.DirectionalLight(0xffe6bd, 3);
  sun.castShadow = !lite;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -5;
  sun.shadow.camera.right = 5;
  sun.shadow.camera.top = 5;
  sun.shadow.camera.bottom = -5;
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 20;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(ambient, hemi, sun);

  const ceiling = new THREE.PointLight(0xffd7a0, 30, 0, 2);
  ceiling.position.set(0, 2.6, 0.3);
  scene.add(ceiling);

  const lamp = new THREE.PointLight(0xffb86b, 0, 0, 2);
  lamp.position.set(-0.85, 1.22, -2.6);
  scene.add(lamp);

  const screenLight = new THREE.PointLight(0xbfd8ff, 3, 0, 2);
  screenLight.position.set(0, 1.3, -2.2);
  scene.add(screenLight);

  /* ---------- room shell ---------- */
  const plaster = (base: string) =>
    canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = base;
      c.fillRect(0, 0, w, h);
      for (let i = 0; i < 3000; i++) {
        c.fillStyle = rand() > 0.5 ? "rgba(0,0,0,0.035)" : "rgba(255,255,255,0.05)";
        c.fillRect(rand() * w, rand() * h, 2, 2);
      }
    });

  const wall = (tex: THREE.Texture, x: number, y: number, z: number, ry: number) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 3),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 1 })
    );
    m.position.set(x, y, z);
    m.rotation.set(0, ry, 0);
    m.receiveShadow = true;
    scene.add(m);
    blockers.push(m);
  };
  const cream = plaster("#e3d7c1");
  wall(plaster("#9aa78f"), 0, 1.5, -3, 0);
  wall(cream, 0, 1.5, 3, Math.PI);
  wall(cream, -3, 1.5, 0, Math.PI / 2);

  const wallMat = new THREE.MeshStandardMaterial({ map: cream, roughness: 1 });
  /* right wall is built from boxes so the window really lets sunlight in */
  [
    addBox(scene, 0.1, 1.1, 6, wallMat, 3.05, 0.55, 0),
    addBox(scene, 0.1, 0.7, 6, wallMat, 3.05, 2.65, 0),
    addBox(scene, 0.1, 1.2, 2.93, wallMat, 3.05, 1.7, 1.535),
    addBox(scene, 0.1, 1.2, 1.53, wallMat, 3.05, 1.7, -2.235),
  ].forEach((m) => blockers.push(m));
  /* ceiling is a box so it also blocks the sun */
  blockers.push(addBox(scene, 6.2, 0.1, 6.2, new THREE.MeshStandardMaterial({ map: plaster("#efe8d8"), roughness: 1 }), 0, 3.05, 0));

  const floorTex = canvasTex(
    512,
    512,
    (c, w, h) => {
      const planks = 8;
      for (let i = 0; i < planks; i++) {
        const y = (i * h) / planks;
        c.fillStyle = `hsl(${26 + rand() * 6},${40 + rand() * 10}%,${34 + rand() * 10}%)`;
        c.fillRect(0, y, w, h / planks);
        for (let g = 0; g < 14; g++) {
          c.strokeStyle = `rgba(40,20,8,${0.05 + rand() * 0.08})`;
          c.beginPath();
          const gy = y + rand() * (h / planks);
          c.moveTo(0, gy);
          c.lineTo(w, gy + (rand() - 0.5) * 3);
          c.stroke();
        }
        c.fillStyle = "rgba(20,10,4,0.55)";
        c.fillRect(0, y, w, 2);
        c.fillRect(rand() * w, y, 2, h / planks);
      }
    },
    [2, 2]
  );
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(6, 6),
    new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const trim = std("#efe7d6");
  addBox(scene, 6, 0.12, 0.03, trim, 0, 0.06, -2.985);
  addBox(scene, 6, 0.12, 0.03, trim, 0, 0.06, 2.985);
  addBox(scene, 0.03, 0.12, 6, trim, -2.985, 0.06, 0);
  addBox(scene, 0.03, 0.12, 6, trim, 2.985, 0.06, 0);

  /* ---------- window (right wall) ---------- */
  const windowG = new THREE.Group();
  scene.add(windowG);
  mark(windowG, "window");

  const skyDayTex = canvasTex(512, 410, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#5aa9ec");
    g.addColorStop(0.7, "#bfe3ff");
    g.addColorStop(1, "#eaf6ff");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    const sg = c.createRadialGradient(w * 0.5, h * 0.55, 0, w * 0.5, h * 0.55, 120);
    sg.addColorStop(0, "rgba(255,248,210,1)");
    sg.addColorStop(0.25, "rgba(255,244,190,0.7)");
    sg.addColorStop(1, "rgba(255,244,190,0)");
    c.fillStyle = sg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#fffbe6";
    c.beginPath();
    c.arc(w * 0.5, h * 0.55, 24, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 7; i++) {
      const cx = rand() * w;
      const cy = h * (0.15 + rand() * 0.4);
      c.fillStyle = "rgba(255,255,255,0.85)";
      for (let k = 0; k < 5; k++) {
        c.beginPath();
        c.arc(cx + k * 22, cy + (k % 2) * 6, 18 + rand() * 14, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.fillStyle = "#a9c7d9";
    c.beginPath();
    c.moveTo(0, h);
    for (let x = 0; x <= w; x += 16) {
      c.lineTo(x, h * 0.72 + Math.sin(x * 0.02) * 14 + Math.sin(x * 0.05) * 6);
    }
    c.lineTo(w, h);
    c.fill();
    let x = 0;
    while (x < w) {
      const bw = 30 + rand() * 46;
      const bh = 40 + rand() * 90;
      c.fillStyle = rand() > 0.5 ? "#c9b8a2" : "#b7a690";
      c.fillRect(x, h - bh, bw, bh);
      c.fillStyle = "rgba(255,255,255,0.5)";
      for (let wy = h - bh + 8; wy < h - 10; wy += 16)
        for (let wx = x + 6; wx < x + bw - 8; wx += 14) c.fillRect(wx, wy, 6, 8);
      x += bw + 3;
    }
    for (let i = 0; i < 14; i++) {
      c.fillStyle = "#4d7a3c";
      c.beginPath();
      c.arc(rand() * w, h - 6, 16 + rand() * 14, 0, Math.PI * 2);
      c.fill();
    }
  });
  const skyNightTex = canvasTex(512, 410, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#0b1022");
    g.addColorStop(1, "#22305a");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 110; i++) {
      c.fillStyle = `rgba(255,255,255,${0.3 + rand() * 0.7})`;
      c.fillRect(rand() * w, rand() * h * 0.8, 2, 2);
    }
    c.fillStyle = "#f3ecd4";
    c.beginPath();
    c.arc(w * 0.5, h * 0.55, 26, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#0a0d1a";
    let x = 0;
    while (x < w) {
      const bw = 30 + rand() * 50;
      const bh = 50 + rand() * 100;
      c.fillRect(x, h - bh, bw, bh);
      if (rand() > 0.4) {
        c.fillStyle = "#e7b86a";
        c.fillRect(x + 8, h - bh + 12, 8, 10);
        c.fillStyle = "#0a0d1a";
      }
      x += bw + 4;
    }
  });
  const skyGeo = new THREE.PlaneGeometry(3.0, 2.4);
  const skyDay = new THREE.Mesh(
    skyGeo,
    new THREE.MeshBasicMaterial({ map: skyDayTex, toneMapped: false })
  );
  skyDay.position.set(3.15, 2.1, -0.7);
  skyDay.rotation.y = -Math.PI / 2;
  skyDay.renderOrder = 1;
  const nightMat = new THREE.MeshBasicMaterial({
    map: skyNightTex,
    transparent: true,
    toneMapped: false,
  });
  const skyNight = new THREE.Mesh(skyGeo, nightMat);
  skyNight.position.set(3.14, 2.1, -0.7);
  skyNight.rotation.y = -Math.PI / 2;
  skyNight.renderOrder = 2;
  windowG.add(skyDay, skyNight);

  const wf = std("#efe7d6");
  addBox(windowG, 0.08, 0.06, 1.62, wf, 2.95, 2.33, -0.7);
  addBox(windowG, 0.08, 0.06, 1.62, wf, 2.95, 1.07, -0.7);
  addBox(windowG, 0.08, 1.26, 0.06, wf, 2.95, 1.7, -1.5);
  addBox(windowG, 0.08, 1.26, 0.06, wf, 2.95, 1.7, 0.1);
  addBox(windowG, 0.06, 1.2, 0.03, wf, 2.95, 1.7, -0.7);
  addBox(windowG, 0.06, 0.03, 1.5, wf, 2.95, 1.7, -0.7);
  addBox(windowG, 0.22, 0.04, 1.8, wf, 2.88, 1.03, -0.7);
  const curtain = std("#b9832f");
  addBox(scene, 0.08, 1.7, 0.32, curtain, 2.9, 1.65, -1.7);
  addBox(scene, 0.08, 1.7, 0.32, curtain, 2.9, 1.65, 0.3);

  /* sunlight beam through the window (same direction as the sun) */
  const winCorners: [number, number][] = [
    [1.1, -1.47],
    [1.1, 0.07],
    [2.3, 0.07],
    [2.3, -1.47],
  ];
  const bv: THREE.Vector3[] = [];
  winCorners.forEach(([y, z]) => bv.push(new THREE.Vector3(2.96, y, z)));
  winCorners.forEach(([y, z]) => {
    const t = y / 3.4;
    bv.push(new THREE.Vector3(2.96 - 4.5 * t, 0.02, z + 0.9 * t));
  });
  const bp: number[] = [];
  const bc: number[] = [];
  const bpush = (v: THREE.Vector3, a: number) => {
    bp.push(v.x, v.y, v.z);
    bc.push(1, 0.9, 0.65, a);
  };
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    bpush(bv[i], 0.16);
    bpush(bv[j], 0.16);
    bpush(bv[4 + j], 0);
    bpush(bv[i], 0.16);
    bpush(bv[4 + j], 0);
    bpush(bv[4 + i], 0);
  }
  const beamGeo = new THREE.BufferGeometry();
  beamGeo.setAttribute("position", new THREE.Float32BufferAttribute(bp, 3));
  beamGeo.setAttribute("color", new THREE.Float32BufferAttribute(bc, 4));
  const beamMat = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  scene.add(beam);

  /* ---------- rug, pendant ---------- */
  addCyl(scene, 1.2, 1.2, 0.02, std("#a8553b"), 0, 0.011, 0.4, 56);
  addCyl(scene, 0.9, 0.9, 0.024, std("#d9b88a"), 0, 0.012, 0.4, 56);
  addCyl(scene, 0.7, 0.7, 0.028, std("#a8553b"), 0, 0.013, 0.4, 56);
  addCyl(scene, 0.01, 0.01, 0.4, std("#222"), 0, 2.8, 0.3, 6);
  const shadeMat = std("#fff1d0", { emissive: 0xffd9a0, emissiveIntensity: 1.4 });
  const shade = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), shadeMat);
  shade.position.set(0, 2.6, 0.3);
  scene.add(shade);

  /* ---------- desk ---------- */
  const wood = std("#8a5a3a");
  const woodDark = std("#6d4529");
  addBox(scene, 2.2, 0.06, 0.85, wood, 0, 0.75, -2.5);
  [[-1.05, -2.15], [1.05, -2.15], [-1.05, -2.85], [1.05, -2.85]].forEach(([x, z]) =>
    addBox(scene, 0.06, 0.72, 0.06, woodDark, x, 0.36, z)
  );
  addBox(scene, 0.5, 0.6, 0.75, woodDark, 0.8, 0.42, -2.5);
  addBox(scene, 0.12, 0.02, 0.02, std("#d8cfa8"), 0.8, 0.55, -2.12);

  /* monitor */
  const monitorG = new THREE.Group();
  scene.add(monitorG);
  mark(monitorG, "monitor");
  const dark = std("#1c1c1e", { roughness: 0.5 });
  addBox(monitorG, 0.3, 0.02, 0.2, dark, 0, 0.79, -2.6);
  addBox(monitorG, 0.05, 0.3, 0.04, dark, 0, 0.95, -2.62);
  addBox(monitorG, 1.0, 0.6, 0.05, dark, 0, 1.3, -2.64);
  const screenTex = canvasTex(1024, 640, (c, w) => {
    c.fillStyle = "#f4efe6";
    c.fillRect(0, 0, w, 640);
    c.fillStyle = "#d6cfbf";
    c.fillRect(0, 0, w, 70);
    ["#d9654f", "#d9b24f", "#7aa874"].forEach((col, i) => {
      c.fillStyle = col;
      c.beginPath();
      c.arc(34 + i * 30, 35, 10, 0, Math.PI * 2);
      c.fill();
    });
    c.fillStyle = "#e9e3d6";
    c.fillRect(150, 16, 760, 38);
    c.fillStyle = "#55503f";
    c.font = "22px system-ui, sans-serif";
    c.fillText("https://visheshmeena.vercel.app", 176, 42);
    c.fillStyle = "#1b1a17";
    c.font = "italic 118px Georgia, serif";
    c.fillText("Vishesh Meena", 64, 290);
    c.fillStyle = "#55503f";
    c.font = "32px system-ui, sans-serif";
    c.fillText("Building Krato. Solo, self-taught, Rajasthan.", 68, 356);
    c.fillStyle = "#b4442c";
    c.fillRect(68, 420, 290, 70);
    c.fillStyle = "#fff";
    c.font = "28px system-ui, sans-serif";
    c.fillText("click to open", 108, 464);
  });
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.94, 0.54),
    new THREE.MeshBasicMaterial({ map: screenTex })
  );
  screen.position.set(0, 1.3, -2.612);
  monitorG.add(screen);

  /* keyboard, mouse */
  const kbTex = canvasTex(256, 80, (c, w, h) => {
    c.fillStyle = "#d8d2c4";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#bdb6a4";
    for (let r = 0; r < 5; r++)
      for (let k = 0; k < 15; k++) c.fillRect(6 + k * 16.4, 6 + r * 14, 13, 11);
  });
  addBox(scene, 0.5, 0.02, 0.16, new THREE.MeshStandardMaterial({ map: kbTex, roughness: 0.8 }), 0, 0.79, -2.3);
  addBox(scene, 0.07, 0.025, 0.11, std("#d8d2c4"), 0.45, 0.79, -2.3);

  /* speakers + headphones */
  const speakersG = new THREE.Group();
  scene.add(speakersG);
  mark(speakersG, "speakers");
  const cones: THREE.Mesh[] = [];
  [-0.72, 0.72].forEach((x) => {
    addBox(speakersG, 0.14, 0.28, 0.14, std("#2a2623"), x, 0.92, -2.68);
    const cone = addCyl(speakersG, 0.045, 0.045, 0.01, std("#111"), x, 0.9, -2.605, 20);
    cone.rotation.x = Math.PI / 2;
    cones.push(cone);
  });
  const hp = new THREE.Group();
  const hpBand = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 10, 24, Math.PI), std("#222"));
  hp.add(hpBand);
  const cup = std("#b4442c");
  addCyl(hp, 0.035, 0.035, 0.03, cup, -0.09, 0, 0, 16).rotation.z = Math.PI / 2;
  addCyl(hp, 0.035, 0.035, 0.03, cup, 0.09, 0, 0, 16).rotation.z = Math.PI / 2;
  hp.position.set(-0.55, 0.9, -2.45);
  hp.rotation.set(0, 0.3, 0);
  speakersG.add(hp);

  /* mug, notebook, plant */
  addCyl(scene, 0.045, 0.04, 0.09, std("#efe9db"), -0.8, 0.825, -2.25, 20);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.025, 0.007, 8, 14), std("#efe9db"));
  handle.position.set(-0.75, 0.825, -2.25);
  scene.add(handle);
  const nb = addBox(scene, 0.22, 0.02, 0.3, std("#3f5f55"), 0.85, 0.79, -2.3);
  nb.rotation.y = 0.2;
  addCyl(scene, 0.005, 0.005, 0.16, std("#b4442c"), 0.86, 0.805, -2.28, 6).rotation.z = Math.PI / 2;
  addCyl(scene, 0.06, 0.045, 0.12, std("#b5703c"), 1.0, 0.84, -2.75, 18);
  [[0, 0.08, 0], [0.05, 0.06, 0.02], [-0.05, 0.07, -0.02], [0.02, 0.11, 0.03]].forEach(([x, y, z]) => {
    const l = addSphere(scene, 0.05, std("#4d6b3a"), 1.0 + x, 0.9 + y, -2.75 + z);
    l.scale.set(1, 1.3, 0.8);
  });

  /* desk lamp (clickable) */
  const lampG = new THREE.Group();
  scene.add(lampG);
  mark(lampG, "lamp");
  addCyl(lampG, 0.07, 0.08, 0.03, std("#222"), -0.95, 0.795, -2.75, 20);
  addCyl(lampG, 0.012, 0.012, 0.45, std("#222"), -0.95, 1.02, -2.75, 8);
  const lampHead = addCyl(lampG, 0.04, 0.11, 0.14, std("#c28a2c"), -0.88, 1.27, -2.7, 20);
  lampHead.rotation.z = 0.5;
  const bulbMat = std("#fff1d0", { emissive: 0xffc27a, emissiveIntensity: 0.05 });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), bulbMat);
  bulb.position.set(-0.85, 1.22, -2.68);
  lampG.add(bulb);

  /* ---------- chair + student ---------- */
  const chairMat = std("#2e2a28");
  addCyl(scene, 0.28, 0.28, 0.03, chairMat, 0, 0.05, -1.75, 5);
  addCyl(scene, 0.04, 0.04, 0.4, std("#222"), 0, 0.25, -1.75, 10);
  addBox(scene, 0.5, 0.07, 0.5, chairMat, 0, 0.5, -1.75);
  addBox(scene, 0.48, 0.55, 0.06, chairMat, 0, 0.82, -1.5);

  const student = new THREE.Group();
  scene.add(student);
  const hoodie = std("#b9832f");
  const skin = std("#c68e66");
  const pants = std("#2b3445");
  [-0.12, 0.12].forEach((x) => {
    addBox(student, 0.15, 0.15, 0.5, pants, x, 0.61, -1.97);
    addBox(student, 0.12, 0.5, 0.12, pants, x, 0.33, -2.2);
    addBox(student, 0.14, 0.07, 0.24, std("#e9e4da"), x, 0.035, -2.25);
  });
  const upper = new THREE.Group();
  upper.position.set(0, 0.7, -1.72);
  student.add(upper);
  addBox(upper, 0.42, 0.5, 0.24, hoodie, 0, 0.27, 0);
  addBox(upper, 0.3, 0.1, 0.1, hoodie, 0, 0.5, 0.1);
  addCyl(upper, 0.05, 0.05, 0.08, skin, 0, 0.55, 0, 12);
  const head = new THREE.Group();
  head.position.set(0, 0.67, 0);
  upper.add(head);
  addSphere(head, 0.115, skin, 0, 0, -0.01);
  const hair = addSphere(head, 0.123, std("#14110f"), 0, 0.012, 0.014);
  hair.scale.set(1, 0.96, 1);
  addSphere(head, 0.025, skin, -0.118, -0.01, 0);
  addSphere(head, 0.025, skin, 0.118, -0.01, 0);
  const forearms: THREE.Mesh[] = [];
  [-1, 1].forEach((s) => {
    addBox(upper, 0.1, 0.28, 0.1, hoodie, s * 0.27, 0.3, -0.02);
    forearms.push(addBox(upper, 0.085, 0.085, 0.5, hoodie, s * 0.24, 0.14, -0.3));
    addSphere(upper, 0.05, skin, s * 0.24, 0.13, -0.57);
  });

  const fadeMats: THREE.Material[] = [];
  student.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | undefined;
    if (m && (o as THREE.Mesh).isMesh) {
      m.transparent = true;
      fadeMats.push(m);
    }
  });
  let studentHide = 0;
  const applyFade = () => {
    fadeMats.forEach((m) => (m.opacity = 1 - studentHide));
    student.visible = studentHide < 0.98;
  };

  /* ---------- sign + wall clock ---------- */
  const signTex = canvasTex(1024, 300, (c, w, h) => {
    c.fillStyle = "#243a30";
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "rgba(239,233,218,0.35)";
    c.lineWidth = 4;
    c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = "#efe9da";
    c.textAlign = "center";
    c.font = handFont(130);
    c.fillText("vishesh's room", w / 2, 170);
    c.fillStyle = "#cdbf9f";
    c.font = handFont(52);
    c.fillText("(psst, click the computer)", w / 2, 250);
  });
  addBox(scene, 2.1, 0.64, 0.04, std("#6d4529"), 0, 2.2, -2.975);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 0.586),
    new THREE.MeshStandardMaterial({ map: signTex, roughness: 0.9 })
  );
  sign.position.set(0, 2.2, -2.952);
  scene.add(sign);

  const clockCv = document.createElement("canvas");
  clockCv.width = 256;
  clockCv.height = 256;
  const cctx = clockCv.getContext("2d")!;
  const clockTex = new THREE.CanvasTexture(clockCv);
  clockTex.colorSpace = THREE.SRGBColorSpace;
  const drawClock = () => {
    const d = new Date();
    cctx.clearRect(0, 0, 256, 256);
    cctx.fillStyle = "#f4efe6";
    cctx.beginPath();
    cctx.arc(128, 128, 126, 0, Math.PI * 2);
    cctx.fill();
    cctx.strokeStyle = "#2a2620";
    cctx.lineCap = "round";
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      cctx.lineWidth = i % 3 === 0 ? 6 : 3;
      cctx.beginPath();
      cctx.moveTo(128 + Math.sin(a) * 104, 128 - Math.cos(a) * 104);
      cctx.lineTo(128 + Math.sin(a) * 118, 128 - Math.cos(a) * 118);
      cctx.stroke();
    }
    const hand = (a: number, len: number, wd: number, col: string) => {
      cctx.strokeStyle = col;
      cctx.lineWidth = wd;
      cctx.beginPath();
      cctx.moveTo(128, 128);
      cctx.lineTo(128 + Math.sin(a) * len, 128 - Math.cos(a) * len);
      cctx.stroke();
    };
    const s = d.getSeconds();
    const m = d.getMinutes() + s / 60;
    const h = (d.getHours() % 12) + m / 60;
    hand((h * Math.PI) / 6, 62, 9, "#2a2620");
    hand((m * Math.PI) / 30, 92, 6, "#2a2620");
    hand((s * Math.PI) / 30, 100, 3, "#b4442c");
    clockTex.needsUpdate = true;
  };
  drawClock();
  let lastSec = Math.floor(Date.now() / 1000);
  const clockMesh = new THREE.Mesh(
    new THREE.CircleGeometry(0.22, 40),
    new THREE.MeshBasicMaterial({ map: clockTex })
  );
  clockMesh.position.set(-1.95, 2.1, -2.965);
  scene.add(clockMesh);
  const clockRim = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.018, 8, 40), std("#6d4529"));
  clockRim.position.set(-1.95, 2.1, -2.965);
  scene.add(clockRim);

  /* ---------- bed (left wall) + posters ---------- */
  const bedG = new THREE.Group();
  scene.add(bedG);
  mark(bedG, "bed");
  addBox(bedG, 2.1, 0.3, 1.1, std("#7a5233"), -1.95, 0.2, 0.9);
  addBox(bedG, 2.0, 0.18, 1.0, std("#e8e1d4"), -1.95, 0.43, 0.9);
  addBox(bedG, 1.3, 0.08, 1.04, std("#3f6b6b"), -1.55, 0.52, 0.9);
  addBox(bedG, 0.45, 0.12, 0.7, std("#f2ece0"), -2.7, 0.57, 0.9);
  const tp = addBox(bedG, 0.3, 0.1, 0.3, std("#b9832f"), -2.45, 0.6, 1.2);
  tp.rotation.y = 0.5;
  addBox(bedG, 0.08, 0.75, 1.15, std("#7a5233"), -2.97, 0.52, 0.9);

  const boxPoster = canvasTex(256, 340, (c, w, h) => {
    c.fillStyle = "#efe6d0";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#a3262a";
    c.beginPath();
    c.arc(w / 2, 130, 82, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#efe6d0";
    c.textAlign = "center";
    c.font = "bold 54px Georgia, serif";
    c.fillText("ROUND", w / 2, 128);
    c.fillText("12", w / 2, 180);
    c.fillStyle = "#1b1a17";
    c.font = "24px Georgia, serif";
    c.fillText("keep moving", w / 2, 290);
  });
  const musicPoster = canvasTex(256, 340, (c, w, h) => {
    c.fillStyle = "#1c2a38";
    c.fillRect(0, 0, w, h);
    for (let r = 100; r > 20; r -= 14) {
      c.strokeStyle = "rgba(239,230,208,0.5)";
      c.beginPath();
      c.arc(w / 2, 140, r, 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = "#c9a24a";
    c.beginPath();
    c.arc(w / 2, 140, 18, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#efe6d0";
    c.textAlign = "center";
    c.font = "italic 30px Georgia, serif";
    c.fillText("side A", w / 2, 290);
  });
  [
    { tex: boxPoster, z: 0.35 },
    { tex: musicPoster, z: 1.45 },
  ].forEach(({ tex, z }) => {
    const p = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 1.0),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 })
    );
    p.position.set(-2.985, 1.75, z);
    p.rotation.y = Math.PI / 2;
    bedG.add(p);
  });

  /* ---------- bookshelf (left wall, back corner) ---------- */
  const shelfG = new THREE.Group();
  scene.add(shelfG);
  mark(shelfG, "shelf");
  const shelfWood = std("#6d4529");
  addBox(shelfG, 0.03, 2.0, 1.2, shelfWood, -2.97, 1.0, -2.0);
  addBox(shelfG, 0.32, 2.0, 0.04, shelfWood, -2.82, 1.0, -2.6);
  addBox(shelfG, 0.32, 2.0, 0.04, shelfWood, -2.82, 1.0, -1.4);
  const palette = ["#8c3b2e", "#c9a24a", "#3f5f55", "#2f4058", "#b5703c", "#6b4a63", "#d8cdb5", "#4d6b3a"];
  [0.03, 0.42, 0.82, 1.22, 1.62, 1.99].forEach((y, si) => {
    addBox(shelfG, 0.32, 0.03, 1.2, shelfWood, -2.82, y, -2.0);
    if (si === 5) return;
    let z = -2.57;
    while (z < -1.45) {
      const bw = 0.03 + rand() * 0.035;
      const bh = 0.22 + rand() * 0.14;
      if (rand() > 0.12) {
        addBox(shelfG, 0.22, bh, bw, std(palette[Math.floor(rand() * palette.length)]), -2.82, y + 0.015 + bh / 2, z + bw / 2);
      }
      z += bw + 0.004;
    }
  });

  /* ---------- cork board (right wall, back) ---------- */
  const corkG = new THREE.Group();
  scene.add(corkG);
  mark(corkG, "notes");
  const corkTex = canvasTex(512, 360, (c, w, h) => {
    c.fillStyle = "#b88a5a";
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) {
      c.fillStyle = rand() > 0.5 ? "rgba(90,50,20,0.25)" : "rgba(255,230,190,0.2)";
      c.fillRect(rand() * w, rand() * h, 2, 2);
    }
    const notes: [string, string[], number, number, number][] = [
      ["#f2e07a", ["Journey", "Discovery", "= the moat"], 30, 40, -0.06],
      ["#f2b6a0", ["Talk to", "real users"], 200, 60, 0.05],
      ["#bcd9a8", ["First", "paying", "user"], 350, 30, -0.03],
    ];
    notes.forEach(([col, lines, x, y, rot]) => {
      c.save();
      c.translate(x + 60, y + 60);
      c.rotate(rot);
      c.fillStyle = col;
      c.fillRect(-60, -60, 130, 150);
      c.fillStyle = "#b4442c";
      c.beginPath();
      c.arc(5, -52, 6, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#2a2620";
      c.font = handFont(32);
      lines.forEach((ln, i) => c.fillText(ln, -52, -10 + i * 34));
      c.restore();
    });
  });
  const cork = new THREE.Mesh(
    new THREE.PlaneGeometry(1.2, 0.84),
    new THREE.MeshStandardMaterial({ map: corkTex, roughness: 1 })
  );
  cork.position.set(2.985, 1.6, -2.2);
  cork.rotation.y = -Math.PI / 2;
  corkG.add(cork);
  const cf = std("#6d4529");
  addBox(corkG, 0.04, 0.05, 1.3, cf, 2.975, 2.04, -2.2);
  addBox(corkG, 0.04, 0.05, 1.3, cf, 2.975, 1.16, -2.2);
  addBox(corkG, 0.04, 0.9, 0.05, cf, 2.975, 1.6, -2.82);
  addBox(corkG, 0.04, 0.9, 0.05, cf, 2.975, 1.6, -1.58);

  /* ---------- boxing: gloves + heavy bag ---------- */
  const red = std("#a3262a", { roughness: 0.55 });
  const glovesG = new THREE.Group();
  scene.add(glovesG);
  mark(glovesG, "gloves");
  addBox(glovesG, 0.06, 0.03, 0.4, std("#222"), 2.96, 1.95, 1.5);
  const makeGlove = (x: number, y: number, z: number) => {
    const g = new THREE.Group();
    const main = addSphere(g, 0.1, red, 0, 0, 0);
    main.scale.set(0.85, 1.15, 0.9);
    addSphere(g, 0.045, red, 0, -0.02, -0.08);
    addCyl(g, 0.062, 0.062, 0.1, std("#efe6d0"), 0, 0.14, 0, 14);
    addCyl(g, 0.006, 0.006, 0.3, std("#222"), 0, 0.34, 0, 6);
    g.position.set(x, y, z);
    glovesG.add(g);
  };
  makeGlove(2.92, 1.5, 1.38);
  makeGlove(2.92, 1.5, 1.62);

  const bagG = new THREE.Group();
  bagG.position.set(2.1, 3.0, 2.2);
  scene.add(bagG);
  mark(bagG, "bag");
  addCyl(bagG, 0.01, 0.01, 0.9, std("#333"), 0, -0.45, 0, 6);
  addCyl(bagG, 0.19, 0.19, 0.95, std("#7d2a24", { roughness: 0.6 }), 0, -1.38, 0, 28);
  let punches = 0;
  let swingAmp = 0;
  let swingT = 0;
  let swingDir = 0;
  const punch = () => {
    swingAmp = 0.5;
    swingT = 0;
    swingDir = Math.random() * Math.PI * 2;
  };

  /* ---------- user quote frame (back wall) ---------- */
  const quoteG = new THREE.Group();
  scene.add(quoteG);
  mark(quoteG, "quote");
  const wrapText = (
    c: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxW: number,
    lh: number
  ) => {
    const words = text.split(" ");
    let line = "";
    let yy = y;
    words.forEach((w) => {
      const test = line ? line + " " + w : w;
      if (c.measureText(test).width > maxW && line) {
        c.fillText(line, x, yy);
        line = w;
        yy += lh;
      } else {
        line = test;
      }
    });
    c.fillText(line, x, yy);
  };
  const quoteTex = canvasTex(800, 560, (c, w, h) => {
    c.fillStyle = "#f4efe6";
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "#b4442c";
    c.lineWidth = 6;
    c.strokeRect(20, 20, w - 40, h - 40);
    c.textAlign = "center";
    c.fillStyle = "#b4442c";
    c.font = "bold 120px Georgia, serif";
    c.fillText("\u201C", w / 2, 140);
    c.fillStyle = "#2a2620";
    if (CONTENT.quote.text) {
      c.font = "italic 40px Georgia, serif";
      wrapText(c, CONTENT.quote.text, w / 2, 210, w - 160, 54);
      c.fillStyle = "#6a6355";
      c.font = handFont(46);
      c.fillText("\u2014 " + CONTENT.quote.who, w / 2, h - 70);
    } else {
      c.font = handFont(64);
      wrapText(c, "Waiting for my first user quote.", w / 2, 230, w - 160, 70);
      c.fillStyle = "#6a6355";
      c.font = handFont(46);
      c.fillText("(try Krato and send me one)", w / 2, h - 80);
    }
  });
  addBox(quoteG, 1.12, 0.82, 0.04, std("#6d4529"), 2.0, 1.95, -2.975);
  const quotePlane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.0, 0.7),
    new THREE.MeshStandardMaterial({ map: quoteTex, roughness: 0.9 })
  );
  quotePlane.position.set(2.0, 1.95, -2.952);
  quoteG.add(quotePlane);

  /* ---------- resume sheet on the desk ---------- */
  const resumeG = new THREE.Group();
  scene.add(resumeG);
  mark(resumeG, "resume");
  const resumeTex = canvasTex(256, 360, (c, w, h) => {
    c.fillStyle = "#fbf8f1";
    c.fillRect(0, 0, w, h);
    c.fillStyle = "#1b1a17";
    c.font = "italic 30px Georgia, serif";
    c.fillText("Vishesh Meena", 18, 52);
    c.fillStyle = "#b4442c";
    c.fillRect(18, 66, 60, 4);
    c.fillStyle = "#c9c1b0";
    for (let i = 0; i < 14; i++) c.fillRect(18, 100 + i * 18, i % 4 === 3 ? 120 : 220, 6);
    c.fillStyle = "#1b1a17";
    c.font = "bold 22px system-ui, sans-serif";
    c.fillText("RESUME", 18, h - 22);
  });
  const sheetPad = addBox(resumeG, 0.2, 0.004, 0.28, std("#e8e1d0"), -0.4, 0.781, -2.25);
  sheetPad.rotation.y = 0.15;
  const sheet = new THREE.Mesh(
    new THREE.PlaneGeometry(0.2, 0.28),
    new THREE.MeshStandardMaterial({ map: resumeTex, roughness: 0.9 })
  );
  sheet.rotation.set(-Math.PI / 2, 0, 0.15);
  sheet.position.set(-0.4, 0.785, -2.25);
  sheet.receiveShadow = true;
  resumeG.add(sheet);

  /* ---------- door (front wall) ---------- */
  const doorG = new THREE.Group();
  scene.add(doorG);
  mark(doorG, "door");
  addBox(doorG, 1.05, 2.15, 0.04, std("#efe7d6"), 1.6, 1.075, 2.985);
  addBox(doorG, 0.92, 2.08, 0.05, std("#8d6b4a"), 1.6, 1.04, 2.96);
  addSphere(doorG, 0.035, std("#c9a24a", { metalness: 0.6, roughness: 0.3 }), 1.25, 1.0, 2.92);

  /* ---------- butterflies (day) ---------- */
  const wingTex = (a: string, b: string) =>
    canvasTex(128, 96, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = a;
      c.beginPath();
      c.ellipse(w * 0.52, h * 0.3, w * 0.46, h * 0.3, -0.25, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = b;
      c.beginPath();
      c.ellipse(w * 0.46, h * 0.72, w * 0.34, h * 0.24, 0.3, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = "rgba(25,18,12,0.75)";
      c.lineWidth = 4;
      c.beginPath();
      c.ellipse(w * 0.52, h * 0.3, w * 0.46, h * 0.3, -0.25, 0, Math.PI * 2);
      c.stroke();
      c.beginPath();
      c.ellipse(w * 0.46, h * 0.72, w * 0.34, h * 0.24, 0.3, 0, Math.PI * 2);
      c.stroke();
      c.fillStyle = "rgba(255,255,255,0.8)";
      [[0.7, 0.25], [0.58, 0.38], [0.5, 0.72]].forEach(([px, py]) => {
        c.beginPath();
        c.arc(w * px, h * py, 5, 0, Math.PI * 2);
        c.fill();
      });
    });
  const bfCols: [string, string][] = [
    ["#f2994a", "#f2c94c"],
    ["#56ccf2", "#2f80ed"],
    ["#f78fb3", "#c06c9a"],
    ["#f2c94c", "#e67e22"],
    ["#bb6bd9", "#7f4fb0"],
  ];
  const bf = new THREE.Group();
  scene.add(bf);
  const wingGeo = new THREE.PlaneGeometry(0.1, 0.08);
  wingGeo.rotateX(Math.PI / 2);
  wingGeo.translate(0.05, 0, 0);
  const bfs = bfCols.map(([a, b]) => {
    const mat = new THREE.MeshBasicMaterial({
      map: wingTex(a, b),
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.15,
    });
    const g = new THREE.Group();
    const pl = new THREE.Group();
    const pr = new THREE.Group();
    pr.scale.x = -1;
    pl.add(new THREE.Mesh(wingGeo, mat));
    pr.add(new THREE.Mesh(wingGeo, mat));
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.006, 0.006, 0.07, 6),
      new THREE.MeshBasicMaterial({ color: 0x1a1410 })
    );
    body.rotation.x = Math.PI / 2;
    g.add(pl, pr, body);
    g.scale.setScalar(1.3);
    bf.add(g);
    return { g, pl, pr };
  });
  const bfPath = [
    { c: [1.6, 1.5, -0.5], r: [0.9, 0.3, 0.9], f: 0.33, ph: 0 },
    { c: [0, 1.7, 0.6], r: [1.4, 0.4, 1.0], f: 0.27, ph: 1.7 },
    { c: [-1.3, 1.35, 1.0], r: [0.8, 0.3, 0.7], f: 0.38, ph: 3.1 },
    { c: [1.7, 1.2, 1.3], r: [0.7, 0.3, 0.8], f: 0.3, ph: 4.4 },
    { c: [0.2, 1.9, -1.2], r: [1.3, 0.3, 0.5], f: 0.35, ph: 5.2 },
  ];
  const bfPos = (i: number, t: number, out: THREE.Vector3) => {
    const p = bfPath[i];
    out.set(
      p.c[0] + p.r[0] * Math.sin(t * p.f + p.ph),
      p.c[1] + p.r[1] * Math.sin(t * p.f * 1.9 + p.ph * 2) + Math.sin(t * 4 + i) * 0.03,
      p.c[2] + p.r[2] * Math.cos(t * p.f * 1.3 + p.ph)
    );
  };

  /* ---------- fireflies (night) ---------- */
  const glow = canvasTex(64, 64, (c, w, h) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,244,170,1)");
    g.addColorStop(0.3, "rgba(255,230,120,0.5)");
    g.addColorStop(1, "rgba(255,220,100,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });
  const ff = new THREE.Group();
  scene.add(ff);
  const flies = Array.from({ length: 14 }, () => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glow,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    s.scale.setScalar(0.09);
    ff.add(s);
    return {
      s,
      cx: -1.5 + rand() * 3.8,
      cy: 0.9 + rand() * 1.2,
      cz: -1.8 + rand() * 3.6,
      ph: rand() * 6.28,
      sp: 0.2 + rand() * 0.3,
    };
  });

  /* ---------- state: day / lamp / music ---------- */
  let dayOn = true;
  let lampOn = false;
  let musicOn = false;
  let dayTarget = 1;
  let dayK = 1;
  const emit = () => cb.onState({ day: dayOn, lamp: lampOn, music: musicOn, lite });
  const setDay = (d: boolean) => {
    dayOn = d;
    dayTarget = d ? 1 : 0;
    lampOn = !d;
    emit();
  };
  const toggleLamp = () => {
    lampOn = !lampOn;
    emit();
  };
  const setLite = (l: boolean) => {
    lite = l;
    renderer.setPixelRatio(l ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(el.clientWidth, el.clientHeight);
    sun.castShadow = !l;
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (!m) return;
      (Array.isArray(m) ? m : [m]).forEach((mm) => {
        mm.needsUpdate = true;
      });
    });
    applyDay(dayK);
    emit();
  };
  const toggleMusic = () => {
    musicOn = !musicOn;
    if (musicOn) music.start();
    else music.stop();
    emit();
  };

  const cNightHemi = new THREE.Color(0xffe8c8);
  const cDayHemi = new THREE.Color(0xe6f2ff);
  const cNightSun = new THREE.Color(0x9fb4ff);
  const cDaySun = new THREE.Color(0xffe6bd);
  const applyDay = (k: number) => {
    ambient.intensity = lerp(0.55, 0.85, k);
    hemi.intensity = lerp(1.3, 1.6, k);
    hemi.color.lerpColors(cNightHemi, cDayHemi, k);
    sun.intensity = lerp(1.1, 3.0, k);
    sun.color.lerpColors(cNightSun, cDaySun, k);
    sun.position.set(lerp(4, 4.5, k), lerp(2.6, 3.4, k), lerp(-0.4, -0.9, k));
    ceiling.intensity = lerp(30, 4, k);
    shadeMat.emissiveIntensity = lerp(1.4, 0.15, k);
    screenLight.intensity = lerp(3, 1.2, k);
    renderer.toneMappingExposure = lerp(1.1, 1.0, k);
    nightMat.opacity = 1 - k;
    beamMat.opacity = k;
    bf.visible = k > 0.02 && !lite;
    bf.scale.setScalar(Math.max(0.001, k));
    ff.visible = k < 0.98 && !lite;
  };
  applyDay(1);

  /* ---------- camera moves ---------- */
  let mode: "free" | "busy" | "open" = "free";
  let tr: Tr | null = null;
  let saved = { pos: new THREE.Vector3(), yaw: 0, pitch: 0 };

  const flyTo = (
    pos: THREE.Vector3,
    y: number,
    p: number,
    dur: number,
    fadeTo: number | null,
    done: () => void
  ) => {
    tr = {
      fp: camera.position.clone(),
      tp: pos.clone(),
      fy: yaw,
      ty: yaw + wrapAngle(y - yaw),
      fpi: pitch,
      tpi: p,
      dur,
      t: 0,
      fadeTo,
      fadeFrom: studentHide,
      done,
    };
    mode = "busy";
  };

  const aim = (pos: THREE.Vector3, target: THREE.Vector3) => {
    const d = target.clone().sub(pos);
    return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
  };

  const views: Record<string, number[]> = {
    desk: [0, 1.55, 1.4, 0, 1.2, -2.5],
    shelf: [-1.0, 1.5, -0.7, -2.9, 1.1, -2.0],
    bed: [0.3, 1.6, 2.1, -2.5, 0.9, 0.9],
    notes: [1.0, 1.5, -0.9, 3, 1.55, -2.2],
    boxing: [0.5, 1.5, 0.5, 2.5, 1.3, 1.9],
    window: [0.9, 1.5, 0.8, 3, 1.7, -0.7],
    quote: [1.9, 1.75, -1.4, 2.0, 1.95, -3],
  };
  const look = (name: string) => {
    const v = views[name];
    if (!v || mode !== "free") return;
    const pos = new THREE.Vector3(v[0], v[1], v[2]);
    const a = aim(pos, new THREE.Vector3(v[3], v[4], v[5]));
    flyTo(pos, a.yaw, a.pitch, 1.3, null, () => {
      mode = "free";
    });
  };

  const lookThen = (name: string, after: () => void) => {
    if (mode !== "free") return;
    look(name);
    setTimeout(after, 1400);
  };

  const startZoom = (p: Page = "home") => {
    if (mode !== "free") return;
    cb.onPage(p);
    saved = { pos: camera.position.clone(), yaw, pitch };
    const aspect = el.clientWidth / el.clientHeight;
    flyTo(new THREE.Vector3(0, 1.3, -2.64 + (aspect < 1 ? 1.35 : 0.72)), 0, 0.02, 1.5, 1, () => {
      mode = "open";
      cb.onOpen();
    });
  };
  const close = () => {
    if (mode !== "open") return;
    flyTo(saved.pos, saved.yaw, saved.pitch, 1.3, 0, () => {
      mode = "free";
    });
  };

  const clampPos = () => {
    camera.position.x = Math.min(2.55, Math.max(-2.55, camera.position.x));
    camera.position.z = Math.min(2.55, Math.max(-1.25, camera.position.z));
  };
  const move = (forward: number, strafe = 0) => {
    camera.position.x += -Math.sin(yaw) * forward + Math.cos(yaw) * strafe;
    camera.position.z += -Math.cos(yaw) * forward - Math.sin(yaw) * strafe;
    clampPos();
  };

  /* ---------- interaction ---------- */
  const labels: Record<string, string> = {
    monitor: "Click to open the computer",
    door: "Click to knock (opens the contact page)",
    lamp: "Click to turn the lamp on or off",
    window: "Click to switch day and night",
    speakers: "Click to turn music on or off",
    bag: "Click to punch the bag",
    gloves: "Click to read about boxing",
    resume: "Click to open my resume",
    quote: "Click to read the quote",
    shelf: "Click to look at the bookshelf",
    notes: "Click to read the notes",
    bed: "Click to look at the bed",
  };
  const activate = (id: string) => {
    switch (id) {
      case "monitor":
        startZoom("home");
        break;
      case "door":
        startZoom("contact");
        break;
      case "lamp":
        toggleLamp();
        break;
      case "window":
        setDay(!dayOn);
        break;
      case "speakers":
        cb.onPanel("songs");
        break;
      case "bag":
        punch();
        cb.onPunch(++punches);
        break;
      case "shelf":
        lookThen("shelf", () => cb.onPanel("books"));
        break;
      case "notes":
        lookThen("notes", () => cb.onPanel("goals"));
        break;
      case "bed":
        look("bed");
        break;
      case "gloves":
        cb.onPanel("boxing");
        break;
      case "resume":
        window.open("/resume", "_blank");
        break;
      case "quote":
        look("quote");
        break;
    }
  };

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (e: PointerEvent): string | null => {
    const r = dom.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(hotRoots, true)[0];
    if (!hit) return null;
    const wallHit = raycaster.intersectObjects(blockers, false)[0];
    if (wallHit && wallHit.distance < hit.distance) return null;
    let o: THREE.Object3D | null = hit.object;
    while (o) {
      if (typeof o.userData.hot === "string") return o.userData.hot as string;
      o = o.parent;
    }
    return null;
  };

  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let moved = 0;
  let curLabel: string | null = null;
  const setLabel = (l: string | null) => {
    if (l === curLabel) return;
    curLabel = l;
    cb.onHover(l);
    dom.style.cursor = l ? "pointer" : "grab";
  };

  const onDown = (e: PointerEvent) => {
    dragging = true;
    moved = 0;
    lastX = e.clientX;
    lastY = e.clientY;
    dom.setPointerCapture(e.pointerId);
    dom.style.cursor = "grabbing";
  };
  const onMove = (e: PointerEvent) => {
    if (dragging && mode === "free") {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      yaw += dx * 0.0045;
      pitch = Math.max(-1.2, Math.min(1.2, pitch + dy * 0.0045));
      lastX = e.clientX;
      lastY = e.clientY;
    } else if (!dragging && e.pointerType === "mouse" && mode === "free") {
      const id = pick(e);
      setLabel(id ? labels[id] ?? null : null);
    }
  };
  const onUp = (e: PointerEvent) => {
    dragging = false;
    dom.style.cursor = curLabel ? "pointer" : "grab";
    if (moved < 6 && mode === "free") {
      const id = pick(e);
      if (id) activate(id);
    }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    if (mode === "free") move(-e.deltaY * 0.0025);
  };
  const keys = new Set<string>();
  const onKeyDown = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
  const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());

  dom.addEventListener("pointerdown", onDown);
  dom.addEventListener("pointermove", onMove);
  dom.addEventListener("pointerup", onUp);
  dom.addEventListener("pointercancel", () => (dragging = false));
  dom.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const ro = new ResizeObserver(() => {
    const w = el.clientWidth;
    const h = el.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });
  ro.observe(el);

  /* ---------- loop ---------- */
  let last = performance.now();
  let tt = 0;
  let raf = 0;
  const tmp = new THREE.Vector3();
  const tmp2 = new THREE.Vector3();

  const loop = () => {
    raf = requestAnimationFrame(loop);
    const now = performance.now();
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    tt += dt;

    if (mode === "free") {
      if (keys.has("w")) move(2 * dt);
      if (keys.has("s")) move(-2 * dt);
      if (keys.has("a")) move(0, -2 * dt);
      if (keys.has("d")) move(0, 2 * dt);
      if (keys.has("arrowleft")) yaw += 1.6 * dt;
      if (keys.has("arrowright")) yaw -= 1.6 * dt;
      if (keys.has("arrowup")) pitch = Math.min(1.2, pitch + 1.2 * dt);
      if (keys.has("arrowdown")) pitch = Math.max(-1.2, pitch - 1.2 * dt);
    }

    /* day / night blend */
    if (dayK !== dayTarget) {
      dayK += (dayTarget - dayK) * Math.min(1, dt * 2.5);
      if (Math.abs(dayTarget - dayK) < 0.002) dayK = dayTarget;
      applyDay(dayK);
    }

    /* lamp */
    const li = lampOn ? 14 + Math.sin(tt * 3) * 0.2 : 0;
    lamp.intensity += (li - lamp.intensity) * Math.min(1, dt * 8);
    bulbMat.emissiveIntensity += ((lampOn ? 2 : 0.05) - bulbMat.emissiveIntensity) * Math.min(1, dt * 8);

    /* clock */
    const sec = Math.floor(Date.now() / 1000);
    if (sec !== lastSec) {
      lastSec = sec;
      drawClock();
    }

    /* student */
    const br = Math.sin(tt * 1.6);
    upper.position.y = 0.7 + br * 0.004;
    upper.rotation.x = -0.05 + br * 0.01;
    head.rotation.y = Math.sin(tt * 0.45) * 0.18;
    head.rotation.x = Math.sin(tt * 0.3) * 0.04;
    forearms[0].rotation.x = Math.sin(tt * 9) * 0.02;
    forearms[1].rotation.x = Math.sin(tt * 7.3 + 1) * 0.02;

    /* speakers pulse */
    const pulse = musicOn ? 1 + Math.abs(Math.sin(tt * 8)) * 0.25 : 1;
    cones.forEach((c) => c.scale.set(pulse, 1, pulse));

    /* punching bag */
    if (swingAmp > 0) {
      swingT += dt;
      const a = swingAmp * Math.exp(-1.6 * swingT) * Math.sin(5.5 * swingT);
      bagG.rotation.z = a * Math.cos(swingDir);
      bagG.rotation.x = a * Math.sin(swingDir);
      if (swingT > 4) {
        swingAmp = 0;
        bagG.rotation.set(0, 0, 0);
      }
    }

    /* butterflies */
    if (bf.visible) {
      bfs.forEach((b, i) => {
        bfPos(i, tt, tmp);
        b.g.position.copy(tmp);
        bfPos(i, tt + 0.12, tmp2);
        b.g.lookAt(tmp2);
        const a = 0.25 + Math.sin(tt * 16 + i * 2) * 0.85;
        b.pl.rotation.z = a;
        b.pr.rotation.z = a;
      });
    }
    /* fireflies */
    if (ff.visible) {
      flies.forEach((f) => {
        f.s.position.set(
          f.cx + Math.sin(tt * f.sp + f.ph) * 0.5,
          f.cy + Math.sin(tt * f.sp * 1.7 + f.ph) * 0.25,
          f.cz + Math.cos(tt * f.sp * 1.3 + f.ph) * 0.5
        );
        f.s.material.opacity = (0.35 + 0.65 * Math.max(0, Math.sin(tt * 1.6 + f.ph * 3))) * (1 - dayK);
      });
    }

    /* camera transitions */
    if (tr) {
      tr.t += dt;
      const u = Math.min(1, tr.t / tr.dur);
      const k = ease(u);
      camera.position.lerpVectors(tr.fp, tr.tp, k);
      yaw = tr.fy + (tr.ty - tr.fy) * k;
      pitch = tr.fpi + (tr.tpi - tr.fpi) * k;
      if (tr.fadeTo !== null) {
        studentHide = tr.fadeFrom + (tr.fadeTo - tr.fadeFrom) * smooth(0.2, 0.8, k);
        applyFade();
      }
      if (u >= 1) {
        const done = tr.done;
        tr = null;
        done();
      }
    }

    camera.rotation.set(pitch, yaw, 0);
    renderer.render(scene, camera);
  };
  loop();
  emit();

  const api: Api = {
    close,
    move: (d: number) => {
      if (mode === "free") move(d);
    },
    setDay,
    toggleLamp,
    toggleMusic,
    look,
    openComputer: () => startZoom("home"),
    setLite,
  };

  const dispose = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    music.dispose();
    dom.removeEventListener("pointerdown", onDown);
    dom.removeEventListener("pointermove", onMove);
    dom.removeEventListener("pointerup", onUp);
    dom.removeEventListener("wheel", onWheel);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        mats.forEach((mm) => {
          const map = (mm as THREE.MeshStandardMaterial).map;
          if (map) map.dispose();
          mm.dispose();
        });
      }
    });
    renderer.dispose();
    if (dom.parentNode) dom.parentNode.removeChild(dom);
  };

  return { api, dispose };
}

const VIEWS = [
  { id: "shelf", label: "Bookshelf" },
  { id: "bed", label: "Bed and posters" },
  { id: "notes", label: "Cork board" },
  { id: "boxing", label: "Boxing corner" },
  { id: "window", label: "Window" },
  { id: "quote", label: "Wall quote" },
  { id: "desk", label: "Back to desk" },
];

const pill = "rounded-full px-3.5 py-1.5 text-[13px] whitespace-nowrap transition";
const pillOff = "bg-[#e8dcc6]/90 text-[#14110e] hover:bg-[#f4efe6]";
const pillOn = "bg-[#b4442c] text-white";

export default function Room() {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<Api | null>(null);
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<Page>("home");
  const [hover, setHover] = useState<string | null>(null);
  const [panel, setPanel] = useState<string | null>(null);
  const [punches, setPunches] = useState(0);
  const [st, setSt] = useState<RoomState>({ day: true, lamp: false, music: false, lite: false });

  useEffect(() => {
    const el = mountRef.current!;
    let cancelled = false;
    let dispose = () => {};
    (async () => {
      const raw = getComputedStyle(document.documentElement).getPropertyValue("--font-hand");
      const hand = raw.trim() || "cursive";
      try {
        await document.fonts.load(`48px ${hand}`);
      } catch {}
      if (cancelled) return;
      const r = init(el, hand, {
        onOpen: () => setOpen(true),
        onHover: (l) => setHover(l),
        onState: (s) => setSt(s),
        onPage: (p) => setPage(p),
        onPanel: (k) => setPanel(k),
        onPunch: (n) => setPunches(n),
      });
      apiRef.current = r.api;
      dispose = r.dispose;
    })();
    return () => {
      cancelled = true;
      dispose();
    };
  }, []);

  const close = () => {
    setOpen(false);
    apiRef.current?.close();
  };

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open]);

  const api = () => apiRef.current;
  const hint = hover
    ? hover
    : st.music
    ? "Now playing: a soft piano loop, generated live in your browser"
    : "Drag to look around · scroll or W A S D to walk · click things in the room";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#14110e]">
      <div ref={mountRef} className="absolute inset-0" />

      {!open && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-2 p-3 sm:p-4">
            <button
              onClick={() => api()?.openComputer()}
              className={`pointer-events-auto ${pill} bg-[#b4442c] text-white hover:bg-[#c9553a]`}
            >
              Open computer →
            </button>
            <div className="pointer-events-auto flex flex-wrap gap-2">
              <a
                href="/resume"
                target="_blank"
                rel="noreferrer"
                className={`${pill} ${pillOff}`}
              >
                Resume
              </a>
              <a href="/plain" className={`${pill} ${pillOff}`}>
                Plain version
              </a>
              <button
                onClick={() => api()?.setLite(!st.lite)}
                className={`${pill} ${st.lite ? pillOn : pillOff}`}
              >
                Lite mode: {st.lite ? "on" : "off"}
              </button>
              <div className="flex rounded-full bg-[#e8dcc6]/90 p-0.5">
                <button
                  onClick={() => api()?.setDay(true)}
                  className={`${pill} ${st.day ? pillOn : "text-[#14110e]"}`}
                >
                  Day
                </button>
                <button
                  onClick={() => api()?.setDay(false)}
                  className={`${pill} ${!st.day ? pillOn : "text-[#14110e]"}`}
                >
                  Night
                </button>
              </div>
              <button
                onClick={() => api()?.toggleMusic()}
                className={`${pill} ${st.music ? pillOn : pillOff}`}
              >
                Music: {st.music ? "on" : "off"}
              </button>
              <button
                onClick={() => api()?.toggleLamp()}
                className={`${pill} ${st.lamp ? pillOn : pillOff}`}
              >
                Lamp: {st.lamp ? "on" : "off"}
              </button>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 p-3 sm:p-4">
            <div className="hand pointer-events-none px-2 text-center text-xl text-[#e8dcc6] drop-shadow sm:text-2xl">
              {hint}
            </div>
            <div className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto pb-1">
              {VIEWS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => api()?.look(v.id)}
                  className={`${pill} ${pillOff}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>

          <div className="absolute bottom-28 right-4 flex flex-col gap-2 sm:hidden">
            <button
              onClick={() => api()?.move(0.4)}
              className="h-11 w-11 rounded-full bg-[#e8dcc6]/90 text-xl text-[#14110e]"
            >
              ↑
            </button>
            <button
              onClick={() => api()?.move(-0.4)}
              className="h-11 w-11 rounded-full bg-[#e8dcc6]/90 text-xl text-[#14110e]"
            >
              ↓
            </button>
          </div>
        </>
      )}

      {!open && punches > 0 && (
        <div className="hand pointer-events-none absolute left-4 top-16 text-2xl text-[#e8dcc6]">
          Punches: {punches}
        </div>
      )}
      {!open && panel && (
        <RoomPanel
          kind={panel}
          onClose={() => setPanel(null)}
          music={st.music}
          onToggleMusic={() => api()?.toggleMusic()}
        />
      )}
      {open && <Browser initial={page} onClose={close} />}
    </div>
  );
}