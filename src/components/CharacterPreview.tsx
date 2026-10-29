import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildSim } from "../three/pieces";
import type { Look } from "../data/characters";

/** A small turning 3D preview of your character. */
export default function CharacterPreview({ look }: { look: Look }) {
  const box = useRef<HTMLDivElement>(null);
  const setLook = useRef<(l: Look) => void>(() => {});

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no 3D on this device: the preview just stays empty
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(el.clientWidth || 160, el.clientHeight || 200);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, (el.clientWidth || 160) / (el.clientHeight || 200), 0.1, 20);
    camera.position.set(0, 0.85, 3.2);
    camera.lookAt(0, 0.62, 0);
    scene.add(new THREE.HemisphereLight("#ffffff", "#8a7660", 1.4));
    const sun = new THREE.DirectionalLight("#fff4e0", 1.6);
    sun.position.set(2, 3, 3);
    scene.add(sun);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshStandardMaterial({ color: "#d9ad00" }));
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);
    let sim = buildSim(look);
    scene.add(sim.root);
    setLook.current = (l: Look) => {
      scene.remove(sim.root);
      sim.root.traverse(o => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      sim = buildSim(l);
      scene.add(sim.root);
    };
    let raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      sim.root.rotation.y = Math.sin((now - t0) / 1600) * 0.9;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      scene.traverse(o => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          (o.material as THREE.Material).dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setLook.current(look);
  }, [look]);

  return <div ref={box} className="char-preview" aria-hidden />;
}
