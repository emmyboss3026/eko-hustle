import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildVehicle } from "../three/vehicles";
import type { CarId } from "../data/estate";

/** A showroom turntable: the car turns slowly on a lit platform. */
export default function CarPreview({ model, color }: { model: CarId; color: string }) {
  const box = useRef<HTMLDivElement>(null);
  const set = useRef<(m: CarId, c: string) => void>(() => {});

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }
    const w = el.clientWidth || 320, h = el.clientHeight || 220;
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, w / h, 0.1, 60);
    camera.position.set(0, 3.2, 9.5);
    camera.lookAt(0, 0.8, 0);
    scene.add(new THREE.HemisphereLight("#ffffff", "#6a5acd", 1.2));
    const key = new THREE.DirectionalLight("#fff4e0", 2.2);
    key.position.set(4, 7, 5);
    key.castShadow = true;
    scene.add(key);
    const rim = new THREE.DirectionalLight("#9b6bff", 1.6);
    rim.position.set(-5, 3, -4);
    scene.add(rim);
    const plate = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.2, 40), new THREE.MeshStandardMaterial({ color: "#2ee6c5", emissive: "#14a58c", emissiveIntensity: 0.8, roughness: 0.4 }));
    plate.position.y = -0.1;
    plate.receiveShadow = true;
    scene.add(plate);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(3.5, 0.05, 8, 60), new THREE.MeshBasicMaterial({ color: "#9b6bff" }));
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);
    let car = buildVehicle(model, color);
    const turn = new THREE.Group();
    turn.add(car.group);
    scene.add(turn);
    set.current = (m, c) => {
      turn.remove(car.group);
      car = buildVehicle(m, c);
      turn.add(car.group);
    };
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      turn.rotation.y = ((now - t0) / 1000) * 0.55;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => set.current(model, color), [model, color]);
  return <div ref={box} className="car-preview" aria-hidden />;
}
