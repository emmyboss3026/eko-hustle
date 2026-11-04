// Surface realism for the 3D scenes, without textures to download:
//  - grain(): world-space noise on a material's colour (patches and speckle), so flat colours read as concrete, asphalt, grass and paint;
//  - addEnvironment(): soft image-based light, so shiny and painted surfaces pick up sky and bounce light instead of looking flat;
//  - setEnvironmentLevel(): dims that light at night.
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Opts = { strength?: number; scale?: number; env?: number };

const lit: { m: THREE.MeshStandardMaterial; base: number }[] = [];

const NOISE = /* glsl */ `
varying vec3 vWorld;
float eh(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float en(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(eh(i), eh(i + vec3(1, 0, 0)), f.x), mix(eh(i + vec3(0, 1, 0)), eh(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(eh(i + vec3(0, 0, 1)), eh(i + vec3(1, 0, 1)), f.x), mix(eh(i + vec3(0, 1, 1)), eh(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
`;

/** Add grain to a material. `strength` is how far the colour wanders (0.1 is subtle), `scale` stretches the patches. Returns the material. */
export function grain<T extends THREE.MeshStandardMaterial>(material: T, { strength = 0.12, scale = 1, env = 0.5 }: Opts = {}): T {
  material.onBeforeCompile = shader => {
    shader.uniforms.uGrain = { value: new THREE.Vector2(strength, scale) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform vec2 uGrain;\n${NOISE}`)
      .replace("#include <color_fragment>", `#include <color_fragment>
        float big = en(vWorld * 0.22 * uGrain.y) * 0.65 + en(vWorld * 0.9 * uGrain.y) * 0.35;
        float fine = en(vWorld * 5.0 * uGrain.y);
        diffuseColor.rgb *= 1.0 + uGrain.x * ((big - 0.5) * 2.0 + (fine - 0.5) * 0.9);`);
  };
  material.customProgramCacheKey = () => `grain${strength}-${scale}`;
  material.envMapIntensity = env;
  if (env > 0) lit.push({ m: material, base: env });
  return material;
}

/** Soft environment light for a scene (made once from a plain studio-style room, so nothing is downloaded). */
export function addEnvironment(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  pmrem.dispose();
  room.dispose();
}

let level = 1;
/** 0 (night) to 1 (full day): scales the environment light on every grained material. Cheap when the value has not moved. */
export function setEnvironmentLevel(v: number) {
  if (Math.abs(v - level) < 0.02) return;
  level = v;
  for (const { m, base } of lit) m.envMapIntensity = base * v;
}
