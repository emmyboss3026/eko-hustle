# Life Sim Character Library — 24 procedural rigged characters

This library contains **24 original stylized low-poly humanoid GLB assets**, generated with Python. They are not photorealistic or production-quality skinned humans. Each model has a 17-joint humanoid rig, mesh skin attributes, and seven starter clips: Idle, Walk, Run, Wave, Sit, Sleep, Dance. Clips are procedural placeholders and **Sit/Sleep do not yet reposition the body naturally**; these require animation retargeting or new keyframes.

## What differs
Six skin-color palettes × four clothing palettes = 24 selectable appearances. Body shapes and faces are currently similar, with no facial morphs, hair variations, accessories or detailed textures. This is a **working technical foundation**, not a finished character-creator library.

## Claude instructions
1. Extract this ZIP into your repository (e.g. `public/assets/characters/`).
2. Use your existing Three.js + React + Vite setup. Do not migrate to React Three Fiber.
3. Load GLB with `GLTFLoader`, and clone animated/skinned instances using `SkeletonUtils.clone` from `three/addons/utils/SkeletonUtils.js`.
4. Create one `AnimationMixer` per character instance; inspect `gltf.animations` and cross-fade Idle/Walk/Run based on actual movement speed.
5. Preserve existing movement, physics, missions, save data, NPC identities, and cameras.
6. Add a selection UI showing all 24 models; ensure only visible models load eagerly, cache shared assets, and use instancing/LOD where appropriate.
7. Verify the rig deforms correctly at joints and verify every animation visually. Replace placeholder clips with artist-authored or properly retargeted animations before shipping.
8. For high fidelity, source properly licensed humanoid GLB/GLTF models and animations with documented licenses; this pack is not a substitute for that artwork.

## Minimal example
```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import * as THREE from 'three';

const gltf = await new GLTFLoader().loadAsync('/assets/characters/humanoid_citizen_01.glb');
const character = clone(gltf.scene);
scene.add(character);
const mixer = new THREE.AnimationMixer(character);
const idle = mixer.clipAction(gltf.animations.find(a => a.name === 'Idle'));
idle.play();
// In your frame loop: mixer.update(deltaSeconds)
```

Generated with `python build.py` (requires NumPy). Units approximately meters, Y up. Test model scale, floor contact, and facing direction against your existing world.
