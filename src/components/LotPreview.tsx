import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { buildPlace } from "../three/street.js";
import { buildVehicle } from "../three/vehicles";
import { PLACE_LOTS } from "../three/world.js";
import type { Property, Vehicle } from "../data/estate";

/** Your home lot in 3D, drawn with the real street models, with your cars in their spaces.
 *  Drag to turn it. Used by the Build screen to preview an upgrade before you pay for it. */
export default function LotPreview({ property, vehicles }: { property: Property; vehicles: Vehicle[] }) {
  const box = useRef<HTMLDivElement>(null);
  const update = useRef<(p: Property, v: Vehicle[]) => void>(() => {});

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      return; // no 3D on this device: the list below still works
    }
    const w = el.clientWidth || 320, h = el.clientHeight || 220;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = "none";

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#9fcbef");
    scene.fog = new THREE.Fog("#9fcbef", 90, 200);
    const camera = new THREE.PerspectiveCamera(42, w / h, 1, 400);
    camera.position.set(22, 22, -34);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 2, -6);
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.7;
    controls.minDistance = 20;
    controls.maxDistance = 90;
    controls.maxPolarAngle = 1.4;
    scene.add(new THREE.HemisphereLight("#ffffff", "#7d8f6a", 1.1));
    const sun = new THREE.DirectionalLight("#fff4e0", 2);
    sun.position.set(30, 50, -20);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    const sc = sun.shadow.camera;
    sc.left = sc.bottom = -40; sc.right = sc.top = 40; sc.far = 160;
    scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshStandardMaterial({ color: "#6fc468" }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    const road = new THREE.Mesh(new THREE.PlaneGeometry(400, 9), new THREE.MeshStandardMaterial({ color: "#3b3d43" }));
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.04, -30);
    scene.add(road);

    // Everything is placed in world coordinates, then the whole lot is slid to the middle of the preview
    const root = new THREE.Group();
    root.position.set(-PLACE_LOTS.home.cx, 0, -PLACE_LOTS.home.cz);
    scene.add(root);
    let lot: THREE.Object3D | null = null;
    const cars: THREE.Object3D[] = [];
    const clear = () => {
      if (lot) { root.remove(lot); lot.traverse((o: THREE.Object3D) => { if ((o as THREE.Mesh).geometry) (o as THREE.Mesh).geometry.dispose(); }); }
      for (const c of cars) root.remove(c);
      cars.length = 0;
    };
    update.current = (p, v) => {
      clear();
      lot = buildPlace("home", () => "", p) as THREE.Object3D;
      root.add(lot);
      for (const car of v) {
        const b = buildVehicle(car.model, car.color).group;
        b.position.set(car.x, 0, car.z);
        b.rotation.y = car.yaw;
        root.add(b);
        cars.push(b);
      }
    };
    update.current(property, vehicles);

    let raf = 0;
    const frame = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    const resize = () => {
      const nw = el.clientWidth || w, nh = el.clientHeight || h;
      renderer.setSize(nw, nh);
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
    };
    addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
      clear();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => update.current(property, vehicles), [property, vehicles]);
  return <div ref={box} className="lot-preview" aria-hidden />;
}
