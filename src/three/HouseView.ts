// The 3D view of your room (Three.js). It only draws what the game state says.
// The Sim walking around is for show: the rules have already happened in the engine.

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CATALOG, HOME, type FurnitureType, type HomePlan, type Placed } from "../data/home";
import { findPath, footprint, routeToObject, walkable, type Tile } from "../engine/path";
import { box, buildPiece, buildSim, daylight, mat, type Tick } from "./pieces";
import { buildCompound } from "./compound.js";
import type { Look } from "../data/characters";

export { daylight };

const HALF = HOME.size / 2;   // the anchor: the original flat, which the neighbours and the yard are drawn around
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
  private remotes = new Map<string, { fig: ReturnType<typeof buildSim>; x: number; z: number; yaw: number; tx: number; tz: number; tyaw: number; anim: number }>();
  private simPos: THREE.Vector3 | null = null;
  private simYaw = 0;
  private plan: HomePlan = HOME;
  private shellGroup: THREE.Group | null = null;
  private planKey = "";
  private shapeKey = "";   // size, rooms and floors: when only the walls change, only the inner walls are rebuilt
  private innerWalls = new THREE.Group();
  private fpInner = new THREE.Group();
  private wallGrid = new THREE.Group();   // faint lines between tiles, shown while you are moving walls
  private wallMode = false;
  private simTile: Tile = { ...HOME.door };
  private path: Tile[] = [];
  private activity: Activity = null;
  private marker: THREE.Mesh;
  private ghost = new THREE.Group();
  private ghostKey = "";
  private raycaster = new THREE.Raycaster();
  private windowMat!: THREE.MeshStandardMaterial;
  private backWall = new THREE.Group();
  private fpWalls = new THREE.Group(); // full-height walls and a ceiling, only in first person
  /** Called on each footstep while the Sim walks (for the sound). */
  onStep: (() => void) | null = null;
  private stepClock = 0;
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
  // First-person view: the camera at the Sim's eyes; drag to look around.
  private fp = false;
  private fpYaw = 0;
  private fpPitch = -0.15;
  private saved: { pos: THREE.Vector3; target: THREE.Vector3 } | null = null;
  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement, look?: Partial<Look>) {
    this.container = container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
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
    if (look) this.sim = buildSim(look);
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

  /** Switch between the overhead camera and the Sim's own eyes. */
  setFirstPerson(on: boolean) {
    if (on === this.fp) return;
    this.fp = on;
    this.controls.enabled = !on;
    this.camera.fov = on ? 75 : 45;
    this.fpWalls.visible = on;
    if (on) {
      this.saved = { pos: this.camera.position.clone(), target: this.controls.target.clone() };
      // Start by looking into the flat, not out of the door.
      const p = this.simPos ?? tileCenter(this.simTile.x, this.simTile.y);
      this.fpYaw = Math.atan2(-p.x, -p.z);
      this.fpPitch = -0.15;
    } else if (this.saved) {
      this.camera.position.copy(this.saved.pos);
      this.controls.target.copy(this.saved.target);
      this.camera.lookAt(this.saved.target);
    }
    this.camera.updateProjectionMatrix();
  }

  get firstPerson() {
    return this.fp;
  }

  /** Drag to look around in first person. */
  look(dx: number, dy: number) {
    if (!this.fp) return;
    this.fpYaw -= dx * 0.006;
    this.fpPitch = Math.max(-1.2, Math.min(0.6, this.fpPitch - dy * 0.005));
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
    const span = this.plan.size * 1.45;
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
    this.shellGroup = shell;
    const mid = this.plan.size / 2 - HALF; // the middle of the room, as an offset from the anchor
    const tileGeo = new THREE.BoxGeometry(0.98, 0.04, 0.98);
    for (let x = 0; x < this.plan.size; x++) {
      for (let y = 0; y < this.plan.size; y++) {
        const room = this.plan.rooms.find(r => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1);
        const even = (x + y) % 2 === 0;
        const color = room ? (even ? room.floor : room.floor2) : even ? this.plan.floor : this.plan.floor2;
        const t = new THREE.Mesh(tileGeo, mat(color, { roughness: 0.6 }));
        const c = tileCenter(x, y);
        t.position.set(c.x, -0.02, c.z);
        t.receiveShadow = true;
        shell.add(t);
      }
    }
    const base = box(this.plan.size + 0.3, 0.12, this.plan.size + 0.3, "#6b5b4b", mid, -0.1, mid);
    base.castShadow = false;
    shell.add(base);

    // The compound around your flat: the neighbours' block, the yard, the gate and the street.
    this.compound = buildCompound();
    shell.add(this.compound.group);

    const wallMat = mat(this.plan.wall);
    const accentMat = mat("#f7c59f"); // a warm feature wall at the back
    // Back wall (along x at z = -HALF) with a window over tiles 1..3.
    const z = -HALF - 0.05;
    this.backWall.add(box(1, WALL_H, 0.1, accentMat, -HALF + 0.5, WALL_H / 2, z));
    this.backWall.add(box(this.plan.size - 3, WALL_H, 0.1, accentMat, -HALF + 3 + (this.plan.size - 3) / 2, WALL_H / 2, z));
    this.backWall.add(box(2, 0.6, 0.1, accentMat, -HALF + 2, 0.3, z));
    this.backWall.add(box(2, 0.3, 0.1, accentMat, -HALF + 2, WALL_H - 0.15, z));
    // framed pictures and a skirting board along the back wall
    for (const [fx, c1, c2] of [[-HALF + 4.4, "#ff7eb6", "#fff4e2"], [-HALF + 5.4, "#4aa8ff", "#fff4e2"], [-HALF + 6.4, "#2ee6c5", "#fff4e2"]] as [number, string, string][]) {
      this.backWall.add(box(0.75, 0.55, 0.05, "#3b2f2a", fx, 1.0, z + 0.07));
      this.backWall.add(box(0.6, 0.4, 0.06, c1, fx, 1.0, z + 0.09));
      this.backWall.add(box(0.25, 0.4, 0.07, c2, fx + 0.12, 1.0, z + 0.1));
    }
    this.backWall.add(box(this.plan.size, 0.12, 0.14, "#fffaf0", mid, 0.06, z + 0.04));
    this.windowMat = new THREE.MeshStandardMaterial({ color: "#bfe3ff", transparent: true, opacity: 0.45, emissive: "#bfe3ff", emissiveIntensity: 0.3 });
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.6), this.windowMat);
    glass.position.set(-HALF + 2, 0.9, z + 0.02);
    this.backWall.add(glass);
    for (let i = 1; i < 4; i++) this.backWall.add(box(0.03, 0.6, 0.03, "#2d3436", -HALF + 1 + i * 0.5, 0.9, z + 0.06));
    // Left wall (along z at x = -HALF): shared with the neighbour's flat.
    const x = -HALF - 0.05;
    this.leftWall.add(box(0.1, WALL_H, this.plan.size, wallMat, x, WALL_H / 2, mid));
    shell.add(this.backWall, this.leftWall);
    // The front and right walls are cut down low so you can see into the rooms
    // (a dollhouse view). The front door is in the front wall.
    const stub = 0.42;
    const edge = this.plan.size - HALF;   // the front and right walls
    const dz = edge + 0.05;
    const doorX0 = this.plan.door.x - HALF;
    const doorX1 = doorX0 + 1;
    shell.add(box(doorX0 + HALF, stub, 0.1, wallMat, (-HALF + doorX0) / 2, stub / 2, dz));
    shell.add(box(edge - doorX1, stub, 0.1, wallMat, (doorX1 + edge) / 2, stub / 2, dz));
    shell.add(box(0.1, stub, this.plan.size + 0.1, wallMat, edge + 0.05, stub / 2, mid));
    for (const px of [doorX0, doorX1]) shell.add(box(0.08, stub + 0.12, 0.14, "#6d4c41", px, (stub + 0.12) / 2, dz));
    shell.add(box(1, 0.02, 0.14, "#6d4c41", (doorX0 + doorX1) / 2, 0.01, dz));

    // Inside walls, with gaps for doors: kept in their own groups so they can be rebuilt on their own
    this.innerWalls = new THREE.Group();
    this.fpInner = new THREE.Group();
    shell.add(this.innerWalls);
    this.fpWalls.add(this.fpInner);
    this.buildInner(wallMat);
    // First person: the front and right walls stand at full height (with the front door open)…
    const upH = WALL_H - stub;
    this.fpWalls.add(box(doorX0 + HALF, upH, 0.1, wallMat, (-HALF + doorX0) / 2, stub + upH / 2, dz));
    this.fpWalls.add(box(edge - doorX1, upH, 0.1, wallMat, (doorX1 + edge) / 2, stub + upH / 2, dz));
    this.fpWalls.add(box(1, WALL_H - 1.25, 0.1, wallMat, (doorX0 + doorX1) / 2, 1.25 + (WALL_H - 1.25) / 2, dz)); // over the door
    this.fpWalls.add(box(0.1, upH, this.plan.size + 0.1, wallMat, edge + 0.05, stub + upH / 2, mid));
    // …and there's a ceiling.
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(this.plan.size + 0.2, this.plan.size + 0.2), new THREE.MeshStandardMaterial({ color: "#f1ede4", side: THREE.DoubleSide }));
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(mid, WALL_H, mid);
    this.fpWalls.add(ceiling);
    this.fpWalls.traverse(o => {
      if (o instanceof THREE.Mesh) o.castShadow = false;
    });
    this.fpWalls.visible = false;
    this.scene.add(shell, this.fpWalls);

    // The lines between tiles, for moving walls
    const pts: number[] = [];
    const n = this.plan.size;
    for (let k = 1; k < n; k++) {
      pts.push(k - HALF, 0.07, -HALF, k - HALF, 0.07, n - HALF);   // vertical lines (x = k)
      pts.push(-HALF, 0.07, k - HALF, n - HALF, 0.07, k - HALF);   // horizontal lines (y = k)
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    this.wallGrid.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: "#2ee6c5", transparent: true, opacity: 0.7 })));
    this.wallGrid.visible = this.wallMode;
    shell.add(this.wallGrid);
  }

  /** The walls inside the flat, from the current plan. */
  private buildInner(wallMat: THREE.Material = mat(this.plan.wall)) {
    const topH = WALL_H - 1.1;
    for (const w of this.plan.walls) {
      for (let i = w.from; i < w.to; i++) {
        if (w.doors.includes(i)) continue;
        this.innerWalls.add(
          w.axis === "v"
            ? box(0.08, 1.1, 1, mat(this.plan.wall), w.at - HALF, 0.55, i + 0.5 - HALF)
            : box(1, 1.1, 0.08, mat(this.plan.wall), i + 0.5 - HALF, 0.55, w.at - HALF),
        );
        // In first person the inside walls go up to the ceiling.
        const up = w.axis === "v"
          ? box(0.08, topH, 1, wallMat, w.at - HALF, 1.1 + topH / 2, i + 0.5 - HALF)
          : box(1, topH, 0.08, wallMat, i + 0.5 - HALF, 1.1 + topH / 2, w.at - HALF);
        up.castShadow = false;
        this.fpInner.add(up);
      }
    }
  }

  /** Lock the camera while a wall is being dragged, so the drag does not turn the view. */
  setCameraLock(on: boolean) {
    this.controls.enabled = !on && !this.fp;
  }

  /** Where a screen point lands on the floor, in tile units (0 to the size of the flat), or null. */
  groundAt(clientX: number, clientY: number): { u: number; v: number } | null {
    this.ray(clientX, clientY);
    const p = this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), new THREE.Vector3());
    return p ? { u: p.x + HALF, v: p.z + HALF } : null;
  }

  /** Show the lines between tiles while you are moving walls. */
  setWallMode(on: boolean) {
    this.wallMode = on;
    this.wallGrid.visible = on;
  }

  /** The line between two tiles nearest a screen point (to add or take away a wall there), or null if it is not near one.
   *  Walls stand 1.1 tall, so a tap on an existing wall is read at wall height: pass the walls you have as `existing`. */
  edgeAt(clientX: number, clientY: number, existing: string[] = []): { axis: "v" | "h"; at: number; i: number } | null {
    this.ray(clientX, clientY);
    const n = this.plan.size;
    const nearest = (height: number) => {
      const p = this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), -height), new THREE.Vector3());
      if (!p) return null;
      const u = p.x + HALF, v = p.z + HALF;
      const vx = Math.round(u), hy = Math.round(v);
      const dv = Math.abs(u - vx), dh = Math.abs(v - hy);
      const vOk = vx >= 1 && vx < n && v >= 0 && v < n;
      const hOk = hy >= 1 && hy < n && u >= 0 && u < n;
      if (vOk && (!hOk || dv <= dh) && dv < 0.32) return { axis: "v" as const, at: vx, i: Math.floor(v) };
      if (hOk && dh < 0.32) return { axis: "h" as const, at: hy, i: Math.floor(u) };
      return null;
    };
    const wall = existing.length ? nearest(0.55) : null;
    if (wall && existing.includes(`${wall.axis}:${wall.at}:${wall.i}`)) return wall;
    return nearest(0);
  }

  /** Switch to a bigger (or smaller) flat after building an extension. Rebuilds the shell around the same tiles. */
  setPlan(plan: HomePlan) {
    const key = JSON.stringify([plan.size, plan.walls, plan.rooms, plan.floor, plan.floor2]);
    if (key === this.planKey) return;
    this.planKey = key;
    const shape = JSON.stringify([plan.size, plan.rooms, plan.floor, plan.floor2]);
    if (shape === this.shapeKey && this.shellGroup) {
      // Only the walls moved (you are dragging one): rebuild just the inside walls
      this.plan = plan;
      for (const g of [this.innerWalls, this.fpInner]) {
        g.traverse(o => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
        for (const c of [...g.children]) g.remove(c);
      }
      this.buildInner();
      return;
    }
    this.shapeKey = shape;
    this.plan = plan;
    if (this.shellGroup) {
      this.scene.remove(this.shellGroup);
      this.shellGroup.traverse(o => {
        if (o instanceof THREE.Mesh) o.geometry.dispose();
      });
    }
    this.scene.remove(this.fpWalls);
    for (const g of [this.backWall, this.leftWall, this.fpWalls, this.wallGrid]) for (const c of [...g.children]) g.remove(c);
    this.buildShell();
    this.fpWalls.visible = this.fp;
    const mid = plan.size / 2 - HALF;
    this.controls.target.set(mid, 0.3, mid);
    this.resize();
  }

  /** Feed the latest furniture and light. Rebuilds furniture only when something changed. */
  setState(objects: Placed[], info: ViewInfo, selected: number | null) {
    this.objects = objects;
    this.info = info;
    this.selected = selected;
    if (!info.home) {
      this.activity = null;
      this.path = [];
      this.simTile = { ...this.plan.door };
      this.simPos = null;
    }
    // Furniture may have moved where the Sim stands: step to a free tile.
    if (!walkable(this.plan, objects, this.simTile.x, this.simTile.y)) {
      this.simTile = { ...this.plan.door };
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
    const route = findPath(this.plan, this.objects, this.simTile, { x, y });
    if (!route) return false;
    this.activity = null;
    this.path = route;
    return true;
  }

  /** Walk to a piece of furniture and act out using it for a few seconds. */
  use(uid: number, action: string) {
    const obj = this.objects.find(o => o.uid === uid);
    if (!obj) return;
    const best = routeToObject(this.plan, this.objects, this.simTile, obj);
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
    // A neighbour's block folds away only when it really stands between the camera and your rooms. (It used to vanish as soon
    // as the camera moved left of the flat, even when it blocked nothing, leaving a hole in the compound.)
    const mid = this.plan.size / 2 - HALF;
    const aim = new THREE.Vector3(mid, 0.4, mid);
    const toward = aim.clone().sub(cam);
    const reach = toward.length();
    const ray = new THREE.Ray(cam.clone(), toward.normalize());
    const hit = new THREE.Vector3();
    const blocks = (box: THREE.Box3) => !!ray.intersectBox(box, hit) && hit.distanceTo(cam) < reach;
    this.compound.rearN.visible = !blocks(this.compound.blockers.rearN);
    this.compound.rearW.visible = !blocks(this.compound.blockers.rearW);
    this.compound.update(dt, t, { night: day < 0.35, grid: this.info.grid });

    // Redraw furniture when an activity ends, so the TV switches off and so on.
    if (this.activity && this.activity.until <= t && this.furnitureKey) {
      this.activity = null;
      this.furnitureKey = "";
      this.setState(this.objects, this.info, this.selected);
    }
    for (const tick of this.ticks) tick(dt, t);

    this.sim.root.visible = this.info.home && !this.fp;
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
      if (moving && pose === "walk") {
        this.stepClock -= dt;
        if (this.stepClock <= 0) {
          this.onStep?.();
          this.stepClock = 0.36;
        }
      } else this.stepClock = 0;
      const targetYaw = moving && dist > 0.15 ? Math.atan2(delta.x, delta.z) : yaw;
      let dy = targetYaw - this.simYaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      this.simYaw += dy * Math.min(1, dt * 12);
      this.sim.root.position.copy(this.simPos);
      this.sim.root.rotation.y = this.simYaw;
      this.pose(moving && pose !== "lie" && pose !== "sit" ? "walk" : pose, t);
    }

    if (this.fp && this.simPos) {
      // Walking somewhere turns your head that way.
      const head = this.path[0];
      if (head) {
        let d = this.simYaw - this.fpYaw;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        this.fpYaw += d * Math.min(1, dt * 4);
      }
      const eye = this.simPos.clone().setY(this.simPos.y > 0.01 ? this.simPos.y + 0.45 : 1.0); // standing, or sitting/lying
      const dir = new THREE.Vector3(Math.sin(this.fpYaw) * Math.cos(this.fpPitch), Math.sin(this.fpPitch), Math.cos(this.fpYaw) * Math.cos(this.fpPitch));
      this.camera.position.copy(eye);
      this.camera.lookAt(eye.clone().add(dir));
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.controls.update();
    const tg = this.controls.target;
    const lim = HALF + 1;
    const hi = this.plan.size - HALF + 1;
    const clamped = new THREE.Vector3(
      Math.max(-lim, Math.min(hi, tg.x)),
      Math.max(0, Math.min(1, tg.y)),
      Math.max(-lim, Math.min(hi, tg.z)),
    );
    if (!clamped.equals(tg)) {
      this.camera.position.add(clamped.clone().sub(tg));
      tg.copy(clamped);
    }
    this.updateRemotes(dt);
    this.renderer.render(this.scene, this.camera);
  }

  // ---- other real players in this room (see lib/multiplayer.ts). Positions are in tiles: tile (i, j) is exactly (i, j). ----

  /** Where you are, in the same tile units the server uses, and whether you are walking. */
  mySpot(): { x: number; z: number; yaw: number; moving: boolean } {
    const p = this.simPos ?? tileCenter(this.simTile.x, this.simTile.y);
    return { x: p.x + HALF - 0.5, z: p.z + HALF - 0.5, yaw: this.simYaw, moving: this.path.length > 0 };
  }

  addRemote(p: { id: string; look?: Partial<Look>; x: number; z: number; yaw: number; anim?: number }) {
    this.removeRemote(p.id);
    const fig = buildSim(p.look ?? {});
    this.scene.add(fig.root);
    this.remotes.set(p.id, { fig, x: p.x, z: p.z, yaw: p.yaw, tx: p.x, tz: p.z, tyaw: p.yaw, anim: p.anim ?? 0 });
  }

  moveRemote(id: string, x: number, z: number, yaw: number, anim: number) {
    const r = this.remotes.get(id);
    if (r) Object.assign(r, { tx: x, tz: z, tyaw: yaw, anim });
  }

  removeRemote(id: string) {
    const r = this.remotes.get(id);
    if (!r) return;
    this.scene.remove(r.fig.root);
    this.remotes.delete(id);
  }

  clearRemotes() {
    for (const id of [...this.remotes.keys()]) this.removeRemote(id);
  }

  private updateRemotes(dt: number) {
    const k = 1 - Math.exp(-dt * 10);
    for (const r of this.remotes.values()) {
      r.x += (r.tx - r.x) * k;
      r.z += (r.tz - r.z) * k;
      let dy = r.tyaw - r.yaw;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      r.yaw += dy * k;
      r.fig.root.position.set(r.x + 0.5 - HALF, 0, r.z + 0.5 - HALF);
      r.fig.root.rotation.y = r.yaw;
      const { body, legL, legR, armL, armR } = r.fig;
      const moving = r.anim > 0 || Math.hypot(r.tx - r.x, r.tz - r.z) > 0.03;
      const sw = moving ? Math.sin(this.time * 11) * 0.6 : 0;
      legL.rotation.x = sw; legR.rotation.x = -sw; armL.rotation.x = -sw * 0.8; armR.rotation.x = sw * 0.8;
      body.position.y = moving ? Math.abs(Math.sin(this.time * 11)) * 0.03 : Math.sin(this.time * 2) * 0.006;
    }
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
    if (x < 0 || y < 0 || x >= this.plan.size || y >= this.plan.size) return null;
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
