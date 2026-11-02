// Character animation with blending. A figure's joints (body, legs, arms, head) are driven toward the pose they should be in
// (idle, walk, run, sit, lie, use, drive, climb) a little each frame, instead of snapping: stopping eases into standing,
// walking speeds up into a run, sitting down bends the legs gradually. The walk cycle keeps one continuous phase, so changing
// speed never makes the legs jump. Pure maths on joints, so it works for any figure and can be tested without a screen.

export type PoseName = "idle" | "walk" | "run" | "sit" | "lie" | "use" | "drive" | "climb";

export type Channels = {
  bodyRotX: number; bodyRotZ: number; bodyPosY: number; bodyPosZ: number;
  legLX: number; legRX: number; armLX: number; armRX: number; armLZ: number; armRZ: number;
  headX: number; headY: number;
  kneeLX: number; kneeRX: number; elbowLX: number; elbowRX: number;   // bends: only figures with knee and elbow joints use them
};

export const REST: Channels = {
  bodyRotX: 0, bodyRotZ: 0, bodyPosY: 0, bodyPosZ: 0, legLX: 0, legRX: 0, armLX: 0, armRX: 0, armLZ: 0, armRZ: 0, headX: 0, headY: 0,
  kneeLX: 0, kneeRX: 0, elbowLX: 0, elbowRX: 0,
};

/** How fast the walk cycle turns, in radians a second, per pose. */
export const CYCLE_RATE: Record<PoseName, number> = { idle: 2, walk: 11, run: 16, sit: 2, lie: 1.4, use: 6, drive: 2, climb: 9 };

/** The joints a pose wants at this point of the cycle (`phase`) and time (`t`, for slow drifts like breathing). */
export function poseValues(name: PoseName, phase: number, t: number): Channels {
  const sw = Math.sin(phase);
  switch (name) {
    case "walk":
      return { ...REST, legLX: sw * 0.6, legRX: -sw * 0.6, armLX: -sw * 0.48, armRX: sw * 0.48, bodyPosY: Math.abs(sw) * 0.03, bodyRotX: 0.03, headY: sw * 0.04,
        kneeLX: Math.max(0, sw) * 0.9 + 0.05, kneeRX: Math.max(0, -sw) * 0.9 + 0.05, elbowLX: -0.3 - Math.max(0, sw) * 0.2, elbowRX: -0.3 - Math.max(0, -sw) * 0.2 };
    case "run":
      return { ...REST, legLX: sw * 0.95, legRX: -sw * 0.95, armLX: -sw * 1.0 - 0.3, armRX: sw * 1.0 - 0.3, armLZ: 0.1, armRZ: -0.1, bodyPosY: Math.abs(sw) * 0.07, bodyRotX: 0.2, headX: -0.1, headY: sw * 0.05,
        kneeLX: Math.max(0, sw) * 1.5 + 0.2, kneeRX: Math.max(0, -sw) * 1.5 + 0.2, elbowLX: -1.1, elbowRX: -1.1 };
    case "climb":
      return { ...REST, legLX: sw * 0.75, legRX: -sw * 0.75, armLX: -sw * 0.5 - 0.3, armRX: sw * 0.5 - 0.3, bodyPosY: Math.abs(sw) * 0.05, bodyRotX: 0.12,
        kneeLX: 0.9 + Math.max(0, sw) * 0.5, kneeRX: 0.9 + Math.max(0, -sw) * 0.5, elbowLX: -0.4, elbowRX: -0.4 };
    case "sit":
      return { ...REST, legLX: -Math.PI / 2, legRX: -Math.PI / 2, bodyPosZ: -0.05, armLX: -0.4, armRX: -0.4, headX: Math.sin(t * 0.6) * 0.03,
        kneeLX: Math.PI / 2, kneeRX: Math.PI / 2, elbowLX: -0.5, elbowRX: -0.5 };
    case "drive":
      return { ...REST, legLX: -1.25, legRX: -1.15, bodyPosZ: -0.04, armLX: -1.15, armRX: -1.15, headY: Math.sin(t * 0.8) * 0.06,
        kneeLX: 1.25, kneeRX: 1.15, elbowLX: -0.35, elbowRX: -0.35 };
    case "lie":
      return { ...REST, bodyRotX: -Math.PI / 2, bodyPosY: 0.1 + Math.sin(t * 1.4) * 0.008, bodyPosZ: 0.5, headY: 0.3, kneeLX: 0.25, kneeRX: 0.15, elbowLX: -0.3, elbowRX: -0.2 };
    case "use":
      return { ...REST, armLX: -1.0 + Math.sin(phase) * 0.25, armRX: -1.0 - Math.sin(phase) * 0.25, bodyRotX: 0.05, headX: 0.12, elbowLX: -0.7, elbowRX: -0.7 };
    default:
      // idle: breathing and a slow sway of the arms
      return { ...REST, bodyPosY: Math.sin(t * 2) * 0.006, armLX: Math.sin(t * 1.3) * 0.04, armRX: -Math.sin(t * 1.3) * 0.04, headY: Math.sin(t * 0.7) * 0.05, elbowLX: -0.12, elbowRX: -0.12 };
  }
}

export type Joint = { rotation: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => unknown }; position: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => unknown } };
export type Rig = { body: Joint; legL: Joint; legR: Joint; armL: Joint; armR: Joint; head: Joint; kneeL?: Joint; kneeR?: Joint; elbowL?: Joint; elbowR?: Joint };

const KEYS = Object.keys(REST) as (keyof Channels)[];

/** Blends a figure from pose to pose. Call `update` once a frame. */
export class Animator {
  phase = 0;
  readonly current: Channels = { ...REST };
  private rig: Rig;
  /** How quickly joints settle onto the pose (higher is snappier). */
  blend = 11;

  constructor(rig: Rig) {
    this.rig = rig;
  }

  /** `speed` stretches the walk cycle (1 is normal), for slow steps while the Sim speeds up or slows down. */
  update(dt: number, name: PoseName, t: number, speed = 1) {
    this.phase += dt * CYCLE_RATE[name] * Math.max(0.3, speed);
    const target = poseValues(name, this.phase, t);
    const k = 1 - Math.exp(-dt * this.blend);
    for (const key of KEYS) this.current[key] += (target[key] - this.current[key]) * k;
    this.apply();
  }

  private apply() {
    const c = this.current, r = this.rig;
    r.body.rotation.set(c.bodyRotX, 0, c.bodyRotZ);
    r.body.position.set(0, c.bodyPosY, c.bodyPosZ);
    r.legL.rotation.set(c.legLX, 0, 0);
    r.legR.rotation.set(c.legRX, 0, 0);
    r.armL.rotation.set(c.armLX, 0, c.armLZ);
    r.armR.rotation.set(c.armRX, 0, c.armRZ);
    r.head.rotation.set(c.headX, c.headY, 0);
    // Figures with real knees and elbows bend them; the little procedural figure has none
    r.kneeL?.rotation.set(c.kneeLX, 0, 0);
    r.kneeR?.rotation.set(c.kneeRX, 0, 0);
    r.elbowL?.rotation.set(c.elbowLX, 0, 0);
    r.elbowR?.rotation.set(c.elbowRX, 0, 0);
  }
}
