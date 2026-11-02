// Adaptive quality. Phones and old laptops cannot all draw the town at full sharpness, so the game watches its own frame rate:
// if it stays low the picture gets a little less sharp (fewer pixels), and at the very bottom the shadows are switched off.
// If it runs smoothly for a while, quality creeps back up. Pure logic, so it can be tested; the 3D views call `apply`.

export const PIXEL_STEPS = [1.5, 1.25, 1, 0.85, 0.7];   // device pixel ratios, best first
const SLOW_MS = 1000 / 40;       // below 40 fps counts as slow
const FAST_MS = 1000 / 57;       // above about 57 fps counts as smooth
const DOWN_AFTER_S = 1.5;        // how long it must stay slow before we step down
const UP_AFTER_S = 8;            // how long it must stay smooth before we step up

export class QualityGovernor {
  /** Index into PIXEL_STEPS: 0 is the sharpest the device allows. */
  level: number;
  private best: number;
  private avg = 16;
  private slow = 0;
  private fast = 0;

  /** `maxRatio`: the device's own pixel ratio, so a 1x screen starts at step 2. */
  constructor(maxRatio = 2) {
    this.best = Math.max(0, PIXEL_STEPS.findIndex(r => r <= maxRatio));
    this.level = this.best;
  }

  get pixelRatio() {
    return PIXEL_STEPS[this.level];
  }

  /** Shadows are only dropped on the lowest step. */
  get shadows() {
    return this.level < PIXEL_STEPS.length - 1;
  }

  /** Feed one frame's time in milliseconds. Returns true when the quality changed. */
  sample(frameMs: number): boolean {
    if (frameMs > 500) return false;                           // a hiccup (tab switch, loading), not a trend
    this.avg += (frameMs - this.avg) * 0.08;
    const dt = frameMs / 1000;
    if (this.avg > SLOW_MS) { this.slow += dt; this.fast = 0; }
    else if (this.avg < FAST_MS) { this.fast += dt; this.slow = 0; }
    else { this.slow = Math.max(0, this.slow - dt); this.fast = Math.max(0, this.fast - dt); }
    if (this.slow > DOWN_AFTER_S && this.level < PIXEL_STEPS.length - 1) {
      this.level++;
      this.slow = 0;
      this.avg = 16;
      return true;
    }
    if (this.fast > UP_AFTER_S && this.level > this.best) {
      this.level--;
      this.fast = 0;
      return true;
    }
    return false;
  }
}
