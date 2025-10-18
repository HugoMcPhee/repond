import { removeItemFromArrayInPlace } from "chootils/dist/arrays";
import { repondMeta as meta } from "../meta";
import { whenDoingEffectsRunAtStart, whenStartingEffects, whenStoppingEffects } from "../helpers/runWhens";
import { EffectDef, EffectPhase } from "../types";
import { forEach } from "chootils/dist/loops";

/**
 * Registers a new effect in the Repond system.
 *
 * Process:
 * 1. Determine phase (duringStep or endOfStep) and step name
 * 2. Generate effect ID if not provided
 * 3. Cache metadata about effect (item types, properties to watch, etc.)
 * 4. If runAtStart, queue to run immediately
 * 5. Register effect in liveEffectsMap and index by propId for fast lookup
 *
 * @param newEffectDef - The effect definition
 * @returns The effect ID
 */
export function _addEffect(newEffectDef: EffectDef) {
  const phase: EffectPhase = newEffectDef.atStepEnd ? "endOfStep" : "duringStep";
  const step = newEffectDef.step ?? "default";
  const effectId = newEffectDef.id ?? toSafeEffectId();

  // Cache metadata for performance (item types, props to watch, etc.)
  storeCachedValuesForEffect(newEffectDef);

  // If runAtStart: true, queue effect to run on next frame without waiting for changes
  if (newEffectDef.runAtStart) {
    whenDoingEffectsRunAtStart(() => runEffectWithoutChange(newEffectDef));
  }

  // Register effect in live effects map and index by property for fast lookup
  whenStartingEffects(() => {
    meta.liveEffectsMap[effectId] = newEffectDef;

    // Index effect by phase → step → propId for fast lookup in checkEffects
    const idsByStep = meta.effectIdsByPhaseByStepByPropId[phase];
    if (!idsByStep[step]) idsByStep[step] = {};

    forEach(newEffectDef.changes, (change) => {
      idsByStep[step][change] = idsByStep[step][change] || [];
      if (!idsByStep[step][change].includes(effectId)) {
        idsByStep[step][change].push(effectId);
      }
    });
  });

  return effectId;
}

/**
 * Runs an effect for all its relevant items without waiting for changes.
 * Used for runAtStart effects.
 *
 * @param effect - The effect to run
 */
export function runEffectWithoutChangeForItems(effect: EffectDef) {
  let itemIdsToRun = getItemIdsForEffect(effect);
  forEach(itemIdsToRun, (itemId) => effect.run(itemId, meta.diffInfo as any, 16.66666, true /* ranWithoutChange */));
}

/**
 * Runs an effect immediately without waiting for changes.
 * Handles both per-item and global effects.
 *
 * @param effect - The effect to run
 */
export function runEffectWithoutChange(effect: EffectDef) {
  if (effect.isPerItem) {
    runEffectWithoutChangeForItems(effect);
    return;
  }

  effect.run("", meta.diffInfo as any, 16.66666, true /* ranWithoutChange */);
}

/**
 * Extracts and caches which item types an effect watches.
 * Uses the effect's `changes` array to determine item types.
 *
 * Example: changes ["player.health", "player.position"] → itemTypes ["player"]
 *
 * @param effect - The effect definition
 * @returns Array of item type names
 */
export function getItemTypesFromEffect(effect: EffectDef): string[] {
  let itemIdsToRun: string[] = [];

  // Return cached value if available
  if (effect._itemTypes?.length) return effect._itemTypes;

  const changes = effect.changes;

  // Optimization: single change case
  if (changes.length === 1) {
    const itemType = meta.itemTypeByPropPathId[changes[0]];
    if (!itemType) {
      console.warn(`(one change) Effect ${effect.id} has no item types`);
      console.log("effect", effect.changes[0]);
      console.log(JSON.stringify(meta.itemTypeByPropPathId, null, 2));
      return [];
    }
    return [itemType];
  }

  // Extract unique item types from all changes
  const itemTypeMap = {};
  forEach(changes, (change) => {
    const itemType = meta.itemTypeByPropPathId[change];
    if (itemType && !itemTypeMap[itemType]) {
      itemTypeMap[itemType] = true;
    }
  });

  const itemTypes = Object.keys(itemTypeMap);
  if (!itemTypes.length) {
    console.warn(`Effect ${effect.id} has no item types`);
    console.warn(effect.changes);
    console.log("effect", effect);
  }

  return itemTypes;
}

/**
 * Gets all item IDs that an effect should run for.
 *
 * If effect specifies `itemIds`, returns those.
 * Otherwise, returns all items of the watched item types.
 *
 * @param effect - The effect definition
 * @returns Array of item IDs
 */
export function getItemIdsForEffect(effect: EffectDef): string[] {
  // If specific item IDs specified, use those
  if (effect.itemIds) return effect.itemIds;

  let itemIdsToRun: string[] = [];
  const itemTypes = getItemTypesFromEffect(effect);

  // Cache item types on effect
  if (!effect._itemTypes) effect._itemTypes = itemTypes;

  const changes = effect.changes;

  // Optimization: single item type case
  if (itemTypes.length === 1) {
    const itemType = meta.itemTypeByPropPathId[changes[0]];
    return meta.itemIdsByItemType[itemType] ?? [];
  }

  // Collect all item IDs across all watched item types
  itemTypes.forEach((itemType) => {
    const itemIds = meta.itemIdsByItemType[itemType];
    if (itemIds) itemIdsToRun.push(...itemIds);
  });

  return itemIdsToRun;
}

/**
 * Caches metadata about an effect for performance.
 *
 * Caches:
 * - _itemTypes: Which item types this effect watches
 * - _allowedIdsMap: If itemIds specified, creates O(1) lookup map
 * - _propsByItemType: Which properties to watch per item type
 * - _checkAddedByItemType: Whether to watch item additions per type
 * - _checkRemovedByItemType: Whether to watch item removals per type
 *
 * This avoids recalculating this information on every frame.
 *
 * @param effect - The effect to cache metadata for
 */
export function storeCachedValuesForEffect(effect: EffectDef) {
  // Default to per-item effects
  if (effect.isPerItem === undefined) effect.isPerItem = true;

  // Skip if already cached (note: _allowedIdsMap can be undefined, so check isn't perfect)
  if (effect._allowedIdsMap && effect._itemTypes && effect._propsByItemType) return;

  let allowedIdsMap: { [itemId: string]: boolean } | undefined = undefined;

  // Cache item types
  const itemTypes = getItemTypesFromEffect(effect);
  if (!itemTypes?.length) {
    console.log(`Effect ${effect.id} has no item types`);
  }
  effect._itemTypes = itemTypes;

  // Create O(1) lookup map for allowed item IDs
  const ids = effect.itemIds;
  if (ids) {
    allowedIdsMap = {};
    forEach(ids, (itemId) => (allowedIdsMap![itemId] = true));
  }
  effect._allowedIdsMap = allowedIdsMap;

  // Parse changes array to extract properties and special keys (__added, __removed)
  const propsByItemType = {};
  const checkAddedByItemType = {};
  const checkRemovedByItemType = {};

  forEach(effect.changes, (change) => {
    const itemType = meta.itemTypeByPropPathId[change];
    if (!propsByItemType[itemType]) propsByItemType[itemType] = [];

    const foundPropName = meta.propKeyByPropPathId[change];
    if (foundPropName) {
      // Regular property (e.g., "player.health" → "health")
      propsByItemType[itemType].push(foundPropName);
    } else {
      // Special key (e.g., "player.*.added" → "__added")
      const foundSpecialPropName = meta.specialKeyByPropPathId[change];
      if (foundSpecialPropName === "__added") checkAddedByItemType[itemType] = true;
      if (foundSpecialPropName === "__removed") checkRemovedByItemType[itemType] = true;
    }
  });

  effect._propsByItemType = propsByItemType;
  effect._checkAddedByItemType = checkAddedByItemType;
  effect._checkRemovedByItemType = checkRemovedByItemType;
}

/**
 * Unregisters an effect from the Repond system.
 *
 * Removes effect from:
 * - liveEffectsMap
 * - effectIdsByPhaseByStepByPropId index
 *
 * @param effectId - The ID of the effect to stop
 */
export function _stopEffect(effectId: string) {
  whenStoppingEffects(() => {
    const effect = meta.liveEffectsMap[effectId];
    if (!effect) return;

    const phase: EffectPhase = !!effect.atStepEnd ? "endOfStep" : "duringStep";
    const step = effect.step ?? "default";

    // Remove from propId index
    forEach(effect.changes, (propId) => {
      removeItemFromArrayInPlace(meta.effectIdsByPhaseByStepByPropId[phase]?.[step]?.[propId] ?? [], effect.id);
    });

    // Remove from live effects map
    delete meta.liveEffectsMap[effectId];
  });
}

/**
 * Generates a unique effect ID using an auto-incrementing counter.
 * Used when effect doesn't specify an ID.
 *
 * @param prefix - Optional prefix (defaults to "autoEffect")
 * @returns A unique effect ID
 */
export function toSafeEffectId(prefix?: string): string {
  const counterNumber = meta.autoEffectIdCounter;
  meta.autoEffectIdCounter += 1;
  return (prefix || "autoEffect") + "_" + counterNumber;
}
