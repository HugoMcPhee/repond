/**
 * Schedules the next Repond update using requestAnimationFrame.
 * This is the entry point for frame-based updates.
 *
 * @returns The requestAnimationFrame ID
 */
export declare function updateRepondNextFrame(): number;
/**
 * Conditionally schedules the next frame update.
 *
 * Logic:
 * - If next frame is first and waiting for updates: schedule immediately and change phase
 * - Otherwise: mark that update should run at end of current update cycle
 *
 * This prevents duplicate requestAnimationFrame calls and ensures updates happen when needed.
 */
export declare function runNextFrameIfNeeded(): void;
