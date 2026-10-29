// The 3D view of your room (Three.js). It only draws what the game state says.
// The Sim walking around is for show: the rules have already happened in the engine.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CATALOG, HOME, type FurnitureType, type Placed } from "../data/home";
import { findPath, footprint, routeToObject, walkable, type Tile } from "../engine/path";
import { box, buildPiece, buildSim, daylight, mat, type Tick } from "./pieces";
import { buildCompound } from "./compound.js";

export { daylight };

const HALF = HOME.size / 2;
const WALL_H = 1.5;
const tileCenter = (x: number, y: number) => new THREE.Vector3(x + 0.5 - HALF, 0, y + 0.5 - HALF);


export type ViewInfo = { hour: number; powered: boolean; grid: boolean; genRunning: boolean; home: boolean };
export type Ghost = { type: FurnitureType; x: number; y: number; rot: number; valid: boolean } | null;
export type Hit = { kind: "object"; uid: number } | { kind: "tile"; x: number; y: number } | null;

type Pose = "walk" | "stand" | "sit" | "lie" | "use";
type Activity = { uid: number; action: string; until: number } | null;

const SLEEPS = new Set(["sleep", "sleep-bed", "nap"]);
const SITS = new Set(["relax", "host", "tv", "radio"]);

export class HouseView {
  readonly renderer: THREE.WebGLRenderer;
  private container: HTMLElement;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  private controls: OrbitControls;
  private hemi = new THREE.HemisphereLight("#dfefff", "#8a7660", 1);
  private sun = new THREE.DirectionalLight("#fff4e0", 1.5);
  private bulb = new THREE.PointLight("#ffd59a", 0, 12, 1.4);
  private furniture = new THREE.Group();
  private furnitureKey = "";
  private ticks: Tick[] = [];
  private sim = buildSim();
  private simPos: THREE.Vector3 | null = null;
  private simYaw = 0;
  private simTile: Tile = { ...HOME.door };
  private path: Tile[] = [];
  private activity: Activity = null;
  private marker: THREE.Mesh;
  private ghost = new THREE.Group();
  private ghostKey = "";
  private raycaster = new THREE.Raycaster();
  private windowMat!: THREE.MeshStandardMaterial;
  private backWall = new THREE.Group();
  private leftWall = new THREE.Group();
  private compound!: ReturnType<typeof buildCompound>;
  private objects: Placed[] = [];
  private selected: number | null = null;
  private info: ViewInfo = { hour: 12, powered: true, grid: true, genRunning: false, home: true };
  private time = 0;
  private last = performance.now();
  private raf = 0;
  private onResize = () => this.resize();
  private shift = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement, shirtColor?: string) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.touchAction = "none";

    this.camera.position.set(7.5, 8.5, 9.5);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.3, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.1;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 20;
    this.controls.maxPolarAngle = 1.3;
    this.controls.screenSpacePanning = false;
    this.controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };

    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    const sc = this.sun.shadow.camera;
    sc.left = sc.bottom = -18;
    sc.right = sc.top = 18;
    sc.near = 1;
    sc.far = 60;
    this.sun.shadow.bias = -0.0005;
    this.bulb.position.set(-0.5, 1.7, 0.5);
    this.scene.add(this.hemi, this.sun, this.sun.target, this.bulb);

    this.buildShell();
    this.scene.add(this.furniture);
    if (shirtColor) this.sim = buildSim(shirtColor);
    this.scene.add(this.sim.root);

    this.marker = new THREE.Mesh(
      new THREE.RingGeometry(0.2, 0.3, 32),
      new THREE.MeshBasicMaterial({ color: "#00cec9", transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
    );
    this.marker.rotation.x = -Math.PI / 2;
    this.marker.visible = false;
    this.scene.add(this.marker, this.ghost);

    this.resize();
    addEventListener("resize", this.onResize);
    if ("ResizeObserver" in window) {
      this.resizeObserver = new ResizeObserver(this.onResize);
      this.resizeObserver.observe(container);
    }
    this.raf = requestAnimationFrame(this.frame);
  }

  /** Draw the room higher up the screen (0 = centred), e.g. while a panel covers the bottom. */
  setViewShift(fraction: number) {
    if (fraction === this.shift) return;
    this.shift = fraction;
    this.applyShift();
  }

  private applyShift() {
    const w = this.container.clientWidth || innerWidth;
    const h = this.container.clientHeight || innerHeight;
    if (this.shift) this.camera.setViewOffset(w, h, 0, h * this.shift, w, h);
    else this.camera.clearViewOffset();
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    removeEventListener("resize", this.onResize);
    this.resizeObserver?.disconnect();
    this.controls.dispose();
    this.scene.traverse(o => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  private resize() {
    const w = this.container.clientWidth || innerWidth;
    const h = this.container.clientHeight || innerHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    // Frame the whole room for this screen shape: narrow screens need the camera further back.
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const span = HOME.size * 1.45;
    const fitV = span / 2 / Math.tan(halfFov);
    const fitH = span / 2 / (Math.tan(halfFov) * this.camera.aspect);
    const fit = Math.max(fitV, fitH) * 0.95;
    // Start zoomed in on the rooms; zoom out to see the compound and the street.
    this.controls.maxDistance = Math.max(34, fit * 2.2);
    const dir = this.camera.position.clone().sub(this.controls.target).normalize();
    this.camera.position.copy(this.controls.target).addScaledVector(dir, fit * 0.85);
    this.camera.updateProjectionMatrix();
    this.applyShift();
  }

  private buildShell() {
    const shell = new THREE.Group();
    const tileGeo = new THREE.BoxGeometry(0.98, 0.04, 0.98);
    for (let x = 0; x < HOME.size; x++) {
      for (let y = 0; y < HOME.size; y++) {
        const room = HOME.rooms.find(r => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1);
        const even = (x + y) % 2 === 0;
        const color = room ? (even ? room.floor : room.floor2) : even ? HOME.floor : HOME.floor2;
        const t = new THREE.Mesh(tileGeo, mat(color, { roughness: 0.6 }));
        const c = tileCenter(x, y);
        t.position.set(c.x, -0.02, c.z);
        t.receiveShadow = true;
        shell.add(t);
      }
    }
    const base = box(HOME.size + 0.3, 0.12, HOME.size + 0.3, "#6b5b4b", 0, -0.1, 0);
    base.castShadow = false;
    shell.add(base);

    // The compound around your flat: the neighbours' block, the yard, the gate and the street.
    this.compound = buildCompound();
    shell.add(this.compound.group);

    const wallMat = mat(HOME.wall);
    // Back wall (along x at z = -HALF) with a window over tiles 1..3.
    const z = -HALF - 0.05;
    this.backWall.add(box(1, WALL_H, 0.1, wallMat, -HALF + 0.5, WALL_H / 2, z));
    this.backWall.add(box(HOME.size - 3, WALL_H, 0.1, wallMat, -HALF + 3 + (HOME.size - 3) / 2, WALL_H / 2, z));
    this.backWall.add(box(2, 0.6, 0.1, wallMat, -HALF + 2, 0.3, z));
    this.backWall.add(box(2, 0.3, 0.1, wallMat, -HALF + 2, WALL_H - 0.15, z));
    this.windowMat = new THREE.MeshStandardMaterial({ color: "#bfe3ff", transparent: true, opacity: 0.45, emissive: "#bfe3ff", emissiveIntensity: 0.3 });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.6), this.windowMat);
    glass.position.set(-HALF + 2, 0.9, z + 0.02);
    this.backWall.add(glass);
    for (let i = 1; i < 4; i++) this.backWall.add(box(0.03, 0.6, 0.03, "#2d3436", -HALF + 1 + i * 0.5, 0.9, z + 0.06));
    // Left wall (along z at x = -HALF): shared with the neighbour's flat.
    const x = -HALF - 0.05;
    this.leftWall.add(box(0.1, WALL_H, HOME.size, wallMat, x, WALL_H / 2, 0));
    shell.add(this.backWall, this.leftWall);
    // The front and right walls are cut down low so you can see into the rooms
    // (a dollhouse view). The front door is in the front wall.
    const stub = 0.42;
    const dz = HALF + 0.05;
    const doorX0 = HOME.door.x - HALF;
    const doorX1 = doorX0 + 1;
    shell.add(box(doorX0 + HALF, stub, 0.1, wallMat, (-HALF + doorX0) / 2, stub / 2, dz));
    shell.add(box(HALF - doorX1, stub, 0.1, wallMat, (doorX1 + HALF) / 2, stub / 2, dz));
    shell.add(box(0.1, stub, HOME.size + 0.1, wallMat, HALF + 0.05, stub / 2, 0));
    for (const px of [doorX0, doorX1]) shell.add(box(0.08, stub + 0.12, 0.14, "#6d4c41", px, (stub + 0.12) / 2, dz));
    shell.add(box(1, 0.02, 0.14, "#6d4c41", (doorX0 + doorX1) / 2, 0.01, dz));

    // Inside walls, with gaps for doors.
    for (const w of HOME.walls) {
      for (let i = w.from; i < w.to; i++) {
        if (w.doors.includes(i)) continue;
        shell.add(
          w.axis === "v"
            ? box(0.08, 1.1, 1, mat(HOME.wall), w.at - HALF, 0.55, i + 0.5 - HALF)
            : box(1, 1.1, 0.08, mat(HOME.wall), i + 0.5 - HALF, 0.55, w.at - HALF),
        );
      }
    }
    this.scene.add(shell);
  }

  /** Feed the latest furniture and light. Rebuilds furniture only when something changed. */
  setState(objects: Placed[], info: ViewInfo, selected: number | null) {
    this.objects = objects;
    this.info = info;
    this.selected = selected;
    if (!info.home) {
      this.activity = null;
      this.path = [];
      this.simTile = { ...HOME.door };
      this.simPos = null;
    }
    // Furniture may have moved where the Sim stands: step to a free tile.
    if (!walkable(HOME, objects, this.simTile.x, this.simTile.y)) {
      this.simTile = { ...HOME.door };
      this.simPos = null;
      this.path = [];
    }
    const activeUid = this.activity && this.activity.until > this.time ? this.activity.uid : null;
    const key = JSON.stringify([objects, info.powered, info.genRunning, activeUid, selected]);
    if (key === this.furnitureKey) return;
    this.furnitureKey = key;
    for (const child of [...this.furniture.children]) {
      child.traverse(o => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      this.furniture.remove(child);
    }
    this.ticks = [];
    for (const obj of objects) {
      const [w, d] = footprint(obj);
      const active = obj.uid === activeUid || (obj.type === "generator" && info.genRunning);
      const { group, tick } = buildPiece(obj.type, { powered: info.powered, active });
      group.rotation.y = -(obj.rot ?? 0) * (Math.PI / 2);
      const holder = new THREE.Group();
      holder.position.set(obj.x + w / 2 - HALF, 0, obj.y + d / 2 - HALF);
      holder.add(group);
      holder.userData.uid = obj.uid;
      if (selected === obj.uid) {
        const hl = new THREE.Mesh(
          new THREE.PlaneGeometry(w - 0.04, d - 0.04),
          new THREE.MeshBasicMaterial({ color: "#0984e3", transparent: true, opacity: 0.35 }),
        );
        hl.rotation.x = -Math.PI / 2;
        hl.position.y = 0.025;
        holder.add(hl);
      }
      this.furniture.add(holder);
      if (tick) this.ticks.push(tick);
    }
  }

  /** Walk the Sim to a floor tile (just for show). */
  walkTo(x: number, y: number): boolean {
    const route = findPath(HOME, this.objects, this.simTile, { x, y });
    if (!route) return false;
    this.activity = null;
    this.path = route;
    return true;
  }

  /** Walk to a piece of furniture and act out using it for a few seconds. */
  use(uid: number, action: string) {
    const obj = this.objects.find(o => o.uid === uid);
    if (!obj) return;
    const best = routeToObject(HOME, this.objects, this.simTile, obj);
    this.path = best?.route ?? [];
    const walkSeconds = this.path.length / 3;
    this.activity = { uid, action, until: this.time + walkSeconds + (SLEEPS.has(action) ? 4 : 2.5) };
    this.furnitureKey = ""; // redraw so the item shows it's in use
    this.setState(this.objects, this.info, this.selected);
  }

  private simTarget(): { pos: THREE.Vector3; yaw: number; pose: Pose } {
    const head = this.path[0];
    if (head) return { pos: tileCenter(head.x, head.y), yaw: this.simYaw, pose: "walk" };
    const c = tileCenter(this.simTile.x, this.simTile.y);
    const act = this.activity && this.activity.until > this.time ? this.activity : null;
    const obj = act && this.objects.find(o => o.uid === act.uid);
    if (!act || !obj) return { pos: c, yaw: this.simYaw, pose: "stand" };
    const [w, d] = footprint(obj);
    const centre = new THREE.Vector3(obj.x + w / 2 - HALF, 0, obj.y + d / 2 - HALF);
    const turn = -(obj.rot ?? 0) * (Math.PI / 2);
    const face = Math.atan2(centre.x - c.x, centre.z - c.z);
    if (SLEEPS.has(act.action) && (obj.type === "mattress" || obj.type === "bed")) {
      const pos = centre.clone();
      pos.y = obj.type === "bed" ? 0.48 : 0.2;
      return { pos, yaw: turn, pose: "lie" };
    }
    if (SLEEPS.has(act.action)) {
      const pos = centre.clone();
      pos.y = 0.42;
      return { pos, yaw: turn + Math.PI / 2, pose: "lie" };
    }
    if (SITS.has(act.action) && (obj.type === "chair" || obj.type === "sofa")) {
      const pos = centre.clone();
      pos.y = obj.type === "sofa" ? 0 : 0.05;
      return { pos, yaw: turn, pose: "sit" };
    }
    if (act.action === "shower") return { pos: centre.clone(), yaw: turn, pose: "use" };
    return { pos: c, yaw: face, pose: "use" };
  }

  private frame = (now: number) => {
    const dt = Math.min(0.1, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    this.update(dt);
    this.raf = requestAnimationFrame(this.frame);
  };

  private update(dt: number) {
    const t = this.time;
    const day = daylight(this.info.hour);
    const angle = ((this.info.hour - 6) / 13) * Math.PI;
    this.sun.position.set(Math.cos(angle) * 10, Math.max(1.5, Math.sin(angle) * 12), 6);
    this.sun.intensity = 0.15 + 1.8 * day;
    this.sun.color.set(day < 0.5 ? "#ffb27a" : "#fff4e0");
    this.hemi.intensity = 0.22 + 0.85 * day;
    this.scene.background = new THREE.Color("#0b1430").lerp(new THREE.Color("#9fcbef"), day);
    this.bulb.intensity = this.info.powered && day < 0.45 ? 9 * (1 - day) : 0;
    this.windowMat.emissiveIntensity = 0.1 + 0.6 * day;

    // Hide the outer walls that stand between the camera and the room.
    const cam = this.camera.position;
    this.backWall.visible = cam.z > -HALF;
    this.leftWall.visible = cam.x > -HALF;
    // The neighbours' units behind and to the left fold away when the camera swings behind them.
    this.compound.rearN.visible = cam.z > -HALF - 0.2;
    this.compound.rearW.visible = cam.x > -HALF - 0.2;
    this.compound.update(dt, t, { night: day < 0.35, grid: this.info.grid });

    // Redraw furniture when an activity ends, so the TV switches off and so on.
    if (this.activity && this.activity.until <= t && this.furnitureKey) {
      this.activity = null;
      this.furnitureKey = "";
      this.setState(this.objects, this.info, this.selected);
    }
    for (const tick of this.ticks) tick(dt, t);

    this.sim.root.visible = this.info.home;
    this.marker.visible = this.info.home && this.path.length > 0;
    if (this.marker.visible) {
      const end = this.path[this.path.length - 1];
      const c = tileCenter(end.x, end.y);
      this.marker.position.set(c.x, 0.02, c.z);
    }
    if (this.info.home) {
      const { pos, yaw, pose } = this.simTarget();
      if (!this.simPos) this.simPos = pos.clone();
      const delta = pos.clone().sub(this.simPos);
      const dist = delta.length();
      const step = 3 * dt;
      if (dist > 3) this.simPos.copy(pos);
      else if (dist > step) this.simPos.addScaledVector(delta.normalize(), step);
      else {
        this.simPos.copy(pos);
        const head = this.path[0];
        if (head) {
          this.simTile = head;
          this.path.shift();
        }
      }
      const moving = dist > 0.02;
      const targetYaw = moving && dist > 0.15 ? Math.atan2(delta.x, delta.z) : yaw;
      let dy = targetYaw - this.simYaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      this.simYaw += dy * Math.min(1, dt * 12);
      this.sim.root.position.copy(this.simPos);
      this.sim.root.rotation.y = this.simYaw;
      this.pose(moving && pose !== "lie" && pose !== "sit" ? "walk" : pose, t);
    }

    this.controls.update();
    const tg = this.controls.target;
    const lim = HALF + 1;
    const clamped = new THREE.Vector3(
      Math.max(-lim, Math.min(lim, tg.x)),
      Math.max(0, Math.min(1, tg.y)),
      Math.max(-lim, Math.min(lim, tg.z)),
    );
    if (!clamped.equals(tg)) {
      this.camera.position.add(clamped.clone().sub(tg));
      tg.copy(clamped);
    }
    this.renderer.render(this.scene, this.camera);
  }

  private pose(name: Pose, t: number) {
    const { body, legL, legR, armL, armR, head } = this.sim;
    body.rotation.set(0, 0, 0);
    body.position.set(0, 0, 0);
    legL.rotation.set(0, 0, 0);
    legR.rotation.set(0, 0, 0);
    armL.rotation.set(0, 0, 0);
    armR.rotation.set(0, 0, 0);
    head.rotation.set(0, 0, 0);
    if (name === "walk") {
      const sw = Math.sin(t * 11) * 0.6;
      legL.rotation.x = sw;
      legR.rotation.x = -sw;
      armL.rotation.x = -sw * 0.8;
      armR.rotation.x = sw * 0.8;
      body.position.y = Math.abs(Math.sin(t * 11)) * 0.03;
    } else if (name === "sit") {
      legL.rotation.x = legR.rotation.x = -Math.PI / 2;
      body.position.z = -0.05;
      armL.rotation.x = armR.rotation.x = -0.4;
    } else if (name === "lie") {
      body.rotation.x = -Math.PI / 2;
      body.position.set(0, 0.1, 0.5);
      head.rotation.y = 0.3;
    } else if (name === "use") {
      armL.rotation.x = -1.0 + Math.sin(t * 6) * 0.25;
      armR.rotation.x = -1.0 - Math.sin(t * 6) * 0.25;
    } else {
      body.position.y = Math.sin(t * 2) * 0.006;
    }
  }

  private ray(clientX: number, clientY: number) {
    const r = this.renderer.domElement.getBoundingClientRect();
    const v = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(v, this.camera);
  }

  /** The floor tile under a screen point, or null. */
  tileAt(clientX: number, clientY: number): Tile | null {
    this.ray(clientX, clientY);
    const p = this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    if (!p) return null;
    const x = Math.floor(p.x + HALF);
    const y = Math.floor(p.z + HALF);
    if (x < 0 || y < 0 || x >= HOME.size || y >= HOME.size) return null;
    return { x, y };
  }

  /** What a tap hit: a piece of furniture, else a floor tile. */
  pick(clientX: number, clientY: number): Hit {
    this.ray(clientX, clientY);
    for (const h of this.raycaster.intersectObject(this.furniture, true)) {
      for (let n: THREE.Object3D | null = h.object; n; n = n.parent) {
        if (n.userData.uid != null) return { kind: "object", uid: n.userData.uid as number };
      }
    }
    const tile = this.tileAt(clientX, clientY);
    return tile ? { kind: "tile", ...tile } : null;
  }

  /** Show where an item being placed would go (green fits, red doesn't). */
  setGhost(g: Ghost) {
    const key = g ? JSON.stringify(g) : "";
    if (key === this.ghostKey) return;
    this.ghostKey = key;
    for (const c of [...this.ghost.children]) this.ghost.remove(c);
    if (!g) return;
    const [w, d] = footprint(g);
    const pad = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.04, 0.03, d - 0.04),
      new THREE.MeshBasicMaterial({ color: g.valid ? "#00b894" : "#d63031", transparent: true, opacity: 0.5 }),
    );
    pad.position.set(g.x + w / 2 - HALF, 0.03, g.y + d / 2 - HALF);
    this.ghost.add(pad);
    const { group } = buildPiece(g.type, { powered: true, active: false });
    group.traverse(o => {
      if (o instanceof THREE.Mesh) {
        o.material = (o.material as THREE.Material).clone();
        o.material.transparent = true;
        o.material.opacity = 0.55;
        o.castShadow = false;
      }
    });
    group.rotation.y = -(g.rot % 4) * (Math.PI / 2);
    group.position.copy(pad.position).setY(0);
    this.ghost.add(group);
  }
}

export const isFurniture = (t: string): t is FurnitureType => t in CATALOG;
