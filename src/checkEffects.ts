import { repondMeta as meta } from "./meta";
import { EffectDef, EffectPhase } from "./types";
import { getState } from "./usable/getSet";

/**
 * Reusable empty array to avoid allocating new arrays.
 * Used when no effects are registered for a property.
 */
const EMPTY_ARRAY: string[] = [];

/**
 * Reusable array for collecting effect IDs that should run.
 * Cleared and reused each time to minimize garbage collection.
 */
const changedEffectIds: string[] = [];

/**
 * Tracks which effect IDs have already been checked this cycle.
 * Prevents checking the same effect multiple times when it watches multiple properties
 * that all changed in the same frame.
 */
let alreadyCheckedEffectIdsMap: Record<string, boolean> = {};

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
export default function checkEffects(phase: EffectPhase = "endOfStep", stepName: string = "default"): string[] {
  changedEffectIds.length = 0; // Clear from previous call

  // Get mapping of propId → effect IDs for this phase/step
  let effectIdsByPropId = meta.effectIdsByPhaseByStepByPropId[phase][stepName] ?? {};

  // On first duringStep loop, check endOfStep changes from previous step
  const phaseToCheck = meta.isFirstDuringPhaseLoop ? "endOfStep" : phase;
  const propsChanged = Object.keys(meta.recordedPropIdsChangedMap[phaseToCheck]);

  // For each property that changed
  for (let i = 0; i < propsChanged.length; i++) {
    const propId = propsChanged[i];
    const effectIdsForProp = effectIdsByPropId[propId] ?? EMPTY_ARRAY;

    if (!effectIdsForProp.length) continue;

    // Check each effect watching this property
    for (let idIndex = 0; idIndex < effectIdsForProp.length; idIndex++) {
      const effectId = effectIdsForProp[idIndex];

      // Skip if already checked (effect watches multiple props that all changed)
      if (alreadyCheckedEffectIdsMap[effectId]) continue;
      alreadyCheckedEffectIdsMap[effectId] = true;

      const effect = meta.liveEffectsMap[effectId];

      // Check if effect's conditions are met (allowed IDs, becomes value, etc.)
      if (checkEffectForChanges(effect, meta.diffInfo)) {
        changedEffectIds.push(effectId!);
      }
    }
  }

  alreadyCheckedEffectIdsMap = {}; // Reset for next call

  return changedEffectIds;
}

/**
 * Checks if an individual effect's conditions are met based on the diff.
 *
 * An effect should run if ANY of these are true:
 * 1. Items were added (and effect watches additions via "itemType.*.added")
 * 2. Items were removed (and effect watches removals via "itemType.*.removed")
 * 3. Watched properties changed (and pass allowedIds/becomes filters)
 *
 * Optimizations:
 * - Early returns as soon as a condition is met
 * - Checks item type level first (itemsAddedBool) before iterating items
 * - Checks allowedIdsMap to filter which specific items trigger the effect
 * - Uses __all property to check if any item had a property change before iterating
 *
 * @param effect - The effect definition to check
 * @param diffInfo - Information about what changed this frame
 * @returns true if effect should run, false otherwise
 */
function checkEffectForChanges(effect: EffectDef, diffInfo: typeof meta.diffInfo) {
  const itemTypes = effect._itemTypes;
  const allowedIdsMap = effect._allowedIdsMap;
  const propsByItemType = effect._propsByItemType;
  const checkAddedByItemType = effect._checkAddedByItemType;
  const checkRemovedByItemType = effect._checkRemovedByItemType;

  // If no allowedIdsMap, effect watches ALL items of the type
  const shouldCheckAnyId = !allowedIdsMap;

  // Validation: ensure cached data exists
  if (!itemTypes || !checkAddedByItemType || !checkRemovedByItemType) {
    console.warn(`Effect ${effect.id} has no cached data, skipping check`);
    return false;
  }

  if (!itemTypes.length) {
    console.warn(`Effect ${effect.id} has no item types, skipping check`);
    console.log(effect);
    return false;
  }

  // Check each item type this effect watches
  for (let typesIndex = 0; typesIndex < itemTypes.length; typesIndex++) {
    const type = itemTypes[typesIndex];

    const shouldCheckAdded = checkAddedByItemType[type];
    const shouldCheckRemoved = checkRemovedByItemType[type];
    const propsToCheck = propsByItemType?.[type];
    const shouldCheckBecomes = effect.becomes !== undefined;

    // 1. Check if items were added
    if (shouldCheckAdded && diffInfo.itemsAddedBool[type]) {
      if (shouldCheckAnyId) {
        return true; // Any item added triggers effect
      } else {
        // Check if any added item is in allowedIdsMap
        for (let itemIdIndex = 0; itemIdIndex < diffInfo.itemsAdded[type].length; itemIdIndex++) {
          const itemId = diffInfo.itemsAdded[type][itemIdIndex];
          if (allowedIdsMap![itemId]) return true;
        }
      }
    }

    // 2. Check if items were removed
    if (shouldCheckRemoved && diffInfo.itemsRemovedBool[type]) {
      if (shouldCheckAnyId) {
        return true; // Any item removed triggers effect
      } else {
        // Check if any removed item is in allowedIdsMap
        for (let itemIdIndex = 0; itemIdIndex < diffInfo.itemsRemoved[type].length; itemIdIndex++) {
          const itemId = diffInfo.itemsRemoved[type][itemIdIndex];
          if (allowedIdsMap![itemId]) return true;
        }
      }
    }

    // 3. Check if watched properties changed
    if (propsToCheck) {
      for (let propNameIndex = 0; propNameIndex < propsToCheck.length; propNameIndex++) {
        const propName = propsToCheck[propNameIndex];

        // Quick check: did this property change for ANY item?
        const propChangedForAnyItem = diffInfo.propsChangedBool[type].__all[propName];

        if (propChangedForAnyItem) {
          // If watching all IDs and no "becomes" filter, trigger immediately
          if (shouldCheckAnyId && !shouldCheckBecomes) {
            return true;
          } else {
            // Check each changed item to see if it matches allowedIds/becomes
            for (let itemIdIndex = 0; itemIdIndex < diffInfo.itemsChanged[type].length; itemIdIndex++) {
              const itemId = diffInfo.itemsChanged[type][itemIdIndex];

              // Check if item is in allowed list (or no filter exists)
              if (!allowedIdsMap || allowedIdsMap![itemId]) {
                // Check if this specific property changed for this item
                if (diffInfo.propsChangedBool[type][itemId][propName]) {
                  if (shouldCheckBecomes) {
                    // "becomes" filter: only trigger if property equals specific value
                    if (getState(type, itemId)?.[propName] === effect.becomes) {
                      return true; // Value matches "becomes" condition
                    } else {
                      continue; // Value doesn't match, keep checking
                    }
                  } else {
                    return true; // No "becomes" filter, property changed is enough
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return false; // No conditions met, effect should not run
}
