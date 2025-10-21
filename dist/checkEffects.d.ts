import { EffectPhase } from "./types";
/**
 * Determines which effects should run based on what changed.
 *
 * This is a key optimization: instead of checking all effects, it only checks
 * effects that watch properties that actually changed.
 *
 * Process:
 * 1. Get list of properties that changed this phase
 * 2. For each changed property, get effects watching it
 * 3. Check each effect to see if its conditions are met (allowedIds, becomes, etc.)
 * 4. Return array of effect IDs that should run
 *
 * @param phase - "duringStep" or "endOfStep"
 * @param stepName - Current step (e.g., "default", "physics", "rendering")
 * @returns Array of effect IDs that should run
 */
export default function checkEffects(phase?: EffectPhase, stepName?: string): string[];
