import { RecordedChanges } from "./meta";
/**
 * Initializes the recordedChanges data structure.
 * This tracks which items/props changed during setState operations.
 * Used to optimize diff calculation (only check what was actually modified).
 */
export declare function createRecordedChanges(recordedChanges: RecordedChanges): void;
/**
 * Main update function called by requestAnimationFrame.
 * This orchestrates the entire Repond update cycle.
 *
 * Update flow:
 * 1. Update frame timing
 * 2. Save current state to prevState
 * 3. Run all steps (physics → logic → rendering, etc.)
 * 4. Run onNextTick callbacks
 * 5. Clean up removed item refs
 * 6. Schedule next frame if needed
 *
 * @param animationFrameTime - Timestamp from requestAnimationFrame (DOMHighResTimeStamp)
 */
export declare function _updateRepond(animationFrameTime: number): void;
