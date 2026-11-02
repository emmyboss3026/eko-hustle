# Characters: what is in the game, and what a modern-quality version still needs

## What is integrated now
- **The library** (`public/assets/characters/`, 24 GLB files plus the library's own README and build script). All 24 files share one
  skeleton and one set of clips and differ only by skin and shirt colours, so the game loads one file and applies each citizen's palette
  (`src/data/citizens.ts`, `src/three/citizen.ts`).
- **From the library:** the 17-joint humanoid skeleton (Hips, Spine, Chest, Neck, Head, arms, legs) and the clips Idle, Walk, Run, Wave, Dance.
  The clips are used for the creator's preview. **Sit and Sleep are not used:** the library's own README says they do not reposition the body.
- **Not used:** the library's mesh. It is made of boxes, which is worse than the classic figure's rounded shapes. A smooth body is generated on
  the same skeleton instead: rounded tubes with vertex weights that blend between two bones at each elbow, knee, wrist, ankle and down the spine,
  so joints bend instead of folding blocks. Outfit shapes (t-shirt, long sleeves, tank, shorts, dress, kaftan), builds (slim, regular, strong,
  and a wrapper skirt), height and the face, hair and accessories (shared with the classic figure) are options.
- **Animation in the game:** `src/three/animator.ts` blends walk, run, idle, sit, sleep, use, drive and climb poses on the skeleton, bending
  knees and elbows. Both kinds of figure use it.

## What is still missing for modern life-simulator quality
The citizens are stylised and low-poly: no textures, no facial morphs or expressions, no cloth or hair simulation, one body mesh. To reach the
quality of a modern life simulator the game needs:
1. **Artist-made base bodies** (male, female and several builds) with proper topology, UVs and blend shapes, with face morph targets.
2. **Modular clothing and hair** as separate skinned meshes on the same skeleton (tops, bottoms, shoes, African hairstyles including braids,
   locs, afro, gele, hijab), with textures and normal maps.
3. **A motion library** with real keyframes for sitting down and standing up, lying down, eating, cooking, phone use, driving, gestures and
   social interactions, retargeted to the game's skeleton.
4. **Texture and skin shading**: skin tone maps, eyes, eyebrows and a basic subsurface look.

## Licences to check first (verify the current terms before shipping)
- **Quaternius, Universal Base Characters and Universal Animation Library:** listed as CC0 (public domain dedication). The free "standard"
  Animation Library has 45 animations; the full set is paid. Both use a universal humanoid rig. The best starting point for bodies and motion.
  Sources: https://quaternius.com/packs/universalbasecharacters.html , https://quaternius.com/packs/universalanimationlibrary.html
- **MakeHuman:** characters exported from an unmodified official build are covered by a CC0 exception (the program itself is AGPL).
  Check the current licence text if the exports or the build are modified.
- **Mixamo (Adobe):** community answers say its characters and animations are free to use in commercial games without attribution, but the raw
  files may not be redistributed or resold. A web game that ships the files to every player may count as distributing them, so read Adobe's
  current terms or ask Adobe before relying on it.
- **Kenney and KayKit packs:** usually CC0, but check each pack's page.
- **Paid stores** (Synty, Unity or Unreal marketplaces): licence terms usually restrict use to the buyer's own project and forbid reselling the
  raw files, so check that a web build that ships the files is allowed.

Do not mix an asset into the game until its licence is written down here with the source link and the date it was checked.
