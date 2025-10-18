import { repondMeta as meta } from "../meta";
import { _updateRepond } from "../updating";

/**
 * Schedules the next Repond update using requestAnimationFrame.
 * This is the entry point for frame-based updates.
 *
 * @returns The requestAnimationFrame ID
 */
export function updateRepondNextFrame() {
  return requestAnimationFrame(_updateRepond);
}

/**
 * Conditionally schedules the next frame update.
 *
 * Logic:
 * - If next frame is first and waiting for updates: schedule immediately and change phase
 * - Otherwise: mark that update should run at end of current update cycle
 *
 * This prevents duplicate requestAnimationFrame calls and ensures updates happen when needed.
 */
export function runNextFrameIfNeeded() {
  if (!meta.shouldRunUpdateAtEndOfUpdate) {
    if (meta.nextFrameIsFirst && meta.nowMetaPhase === "waitingForFirstUpdate") {
      updateRepondNextFrame();
      meta.nowMetaPhase = "waitingForMoreUpdates";
    } else {
      meta.shouldRunUpdateAtEndOfUpdate = true;
    }
  }
}
