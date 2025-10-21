import { removeItemFromArrayInPlace } from "chootils/dist/arrays";
import { repondMeta as meta } from "../meta";
import { whenDoingEffectsRunAtStart, whenStartingEffects, whenStoppingEffects } from "../helpers/runWhens";
import { forEach } from "chootils/dist/loops";
import { warn } from "./logging";
/**
 * Registers a new effect in the Repond system.
 *
 * Process:
 * 1. Generate effect ID if not provided
 * 2. Check for existing effect with same ID (pending or indexed)
 * 3. If pending: update effect definition, existing callback will use new version
 * 4. If indexed: stop and restart to reindex with new properties
 * 5. Store effect in liveEffectsMap immediately
 * 6. Mark as pending indexing
 * 7. Queue indexing callback (stateless, looks up from liveEffectsMap)
 *
 * @param newEffectDef - The effect definition
 * @returns The effect ID
 */
export function _addEffect(newEffectDef) {
    const effectId = newEffectDef.id ?? toSafeEffectId();
    // Cache metadata for performance (item types, props to watch, etc.)
    storeCachedValuesForEffect(newEffectDef);
    // Check if effect already exists
    const isPending = meta.pendingEffectIndexIds.has(effectId);
    const alreadyInMap = !!meta.liveEffectsMap[effectId];
    const isIndexed = alreadyInMap && !isPending;
    if (isPending) {
        // Effect is pending (not yet indexed)
        // Update the map, existing callbacks will use the updated version
        meta.liveEffectsMap[effectId] = newEffectDef;
        warn(`Effect "${effectId}" is already pending indexing. ` +
            `Updating to new definition (existing queued callback will use updated version).`);
        // Don't queue new callbacks
        return effectId;
    }
    if (isIndexed) {
        // Effect is already indexed (active)
        // Need to fully stop and restart to reindex
        warn(`Effect "${effectId}" is already active. ` + `Replacing with new definition (will be reindexed).`);
        _stopEffect(effectId); // Synchronous removal
        // Fall through to normal add
    }
    // Store effect immediately in liveEffectsMap
    meta.liveEffectsMap[effectId] = newEffectDef;
    // Mark as pending indexing
    meta.pendingEffectIndexIds.add(effectId);
    // If runAtStart: true, queue effect to run (callback looks up from map)
    if (newEffectDef.runAtStart) {
        whenDoingEffectsRunAtStart(() => {
            const effectDef = meta.liveEffectsMap[effectId];
            if (!effectDef)
                return; // Cancelled
            runEffectWithoutChange(effectDef);
        });
    }
    // Queue the indexing (callback looks up from map, not closure)
    whenStartingEffects(() => {
        // Check if effect was cancelled
        if (!meta.pendingEffectIndexIds.has(effectId)) {
            return; // Cancelled, skip indexing
        }
        // Look up current effect from map
        const effectDef = meta.liveEffectsMap[effectId];
        if (!effectDef) {
            // Effect was removed, clean up pending flag
            meta.pendingEffectIndexIds.delete(effectId);
            return;
        }
        // Remove from pending
        meta.pendingEffectIndexIds.delete(effectId);
        // Calculate phase/step from current effect (not closure)
        const phase = effectDef.atStepEnd ? "endOfStep" : "duringStep";
        const step = effectDef.step ?? "default";
        // Index effect by phase → step → propId for fast lookup in checkEffects
        const idsByStep = meta.effectIdsByPhaseByStepByPropId[phase];
        if (!idsByStep[step])
            idsByStep[step] = {};
        forEach(effectDef.changes, (change) => {
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
export function runEffectWithoutChangeForItems(effect) {
    let itemIdsToRun = getItemIdsForEffect(effect);
    forEach(itemIdsToRun, (itemId) => effect.run(itemId, meta.diffInfo, 16.66666, true /* ranWithoutChange */));
}
/**
 * Runs an effect immediately without waiting for changes.
 * Handles both per-item and global effects.
 *
 * @param effect - The effect to run
 */
export function runEffectWithoutChange(effect) {
    if (effect.isPerItem) {
        runEffectWithoutChangeForItems(effect);
        return;
    }
    effect.run("", meta.diffInfo, 16.66666, true /* ranWithoutChange */);
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
export function getItemTypesFromEffect(effect) {
    let itemIdsToRun = [];
    // Return cached value if available
    if (effect._itemTypes?.length)
        return effect._itemTypes;
    const changes = effect.changes;
    // Optimization: single change case
    if (changes.length === 1) {
        const itemType = meta.itemTypeByPropPathId[changes[0]];
        if (!itemType) {
            warn(`(one change) Effect ${effect.id} has no item types`);
            warn("effect", effect.changes[0]);
            warn(JSON.stringify(meta.itemTypeByPropPathId, null, 2));
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
        warn(`Effect ${effect.id} has no item types`);
        warn(effect.changes);
        warn("effect", effect);
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
export function getItemIdsForEffect(effect) {
    // If specific item IDs specified, use those
    if (effect.itemIds)
        return effect.itemIds;
    let itemIdsToRun = [];
    const itemTypes = getItemTypesFromEffect(effect);
    // Cache item types on effect
    if (!effect._itemTypes)
        effect._itemTypes = itemTypes;
    const changes = effect.changes;
    // Optimization: single item type case
    if (itemTypes.length === 1) {
        const itemType = meta.itemTypeByPropPathId[changes[0]];
        return meta.itemIdsByItemType[itemType] ?? [];
    }
    // Collect all item IDs across all watched item types
    itemTypes.forEach((itemType) => {
        const itemIds = meta.itemIdsByItemType[itemType];
        if (itemIds)
            itemIdsToRun.push(...itemIds);
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
export function storeCachedValuesForEffect(effect) {
    // Default to per-item effects
    if (effect.isPerItem === undefined)
        effect.isPerItem = true;
    // Skip if already cached (note: _allowedIdsMap can be undefined, so check isn't perfect)
    if (effect._allowedIdsMap && effect._itemTypes && effect._propsByItemType)
        return;
    let allowedIdsMap = undefined;
    // Cache item types
    const itemTypes = getItemTypesFromEffect(effect);
    if (!itemTypes?.length) {
        warn(`Effect ${effect.id} has no item types`);
    }
    effect._itemTypes = itemTypes;
    // Create O(1) lookup map for allowed item IDs
    const ids = effect.itemIds;
    if (ids) {
        allowedIdsMap = {};
        forEach(ids, (itemId) => (allowedIdsMap[itemId] = true));
    }
    effect._allowedIdsMap = allowedIdsMap;
    // Parse changes array to extract properties and special keys (__added, __removed)
    const propsByItemType = {};
    const checkAddedByItemType = {};
    const checkRemovedByItemType = {};
    forEach(effect.changes, (change) => {
        const itemType = meta.itemTypeByPropPathId[change];
        if (!propsByItemType[itemType])
            propsByItemType[itemType] = [];
        const foundPropName = meta.propKeyByPropPathId[change];
        if (foundPropName) {
            // Regular property (e.g., "player.health" → "health")
            propsByItemType[itemType].push(foundPropName);
        }
        else {
            // Special key (e.g., "player.*.added" → "__added")
            const foundSpecialPropName = meta.specialKeyByPropPathId[change];
            if (foundSpecialPropName === "__added")
                checkAddedByItemType[itemType] = true;
            if (foundSpecialPropName === "__removed")
                checkRemovedByItemType[itemType] = true;
        }
    });
    effect._propsByItemType = propsByItemType;
    effect._checkAddedByItemType = checkAddedByItemType;
    effect._checkRemovedByItemType = checkRemovedByItemType;
}
/**
 * Unregisters an effect from the Repond system.
 *
 * Process:
 * 1. Check if effect is pending (not yet indexed)
 * 2. If pending: remove from pending set and liveEffectsMap, queued callback will skip
 * 3. If indexed: normal removal from index and liveEffectsMap
 *
 * Removes effect from:
 * - pendingEffectIndexIds (if pending)
 * - liveEffectsMap
 * - effectIdsByPhaseByStepByPropId index (if indexed)
 *
 * @param effectId - The ID of the effect to stop
 */
export function _stopEffect(effectId) {
    // Check if effect is pending indexing
    if (meta.pendingEffectIndexIds.has(effectId)) {
        // Effect exists in liveEffectsMap but not indexed yet
        // Cancel the pending indexing and remove from map
        meta.pendingEffectIndexIds.delete(effectId);
        delete meta.liveEffectsMap[effectId];
        // The queued indexing callback will see it's not pending and skip
        return;
    }
    // Effect is already indexed, use normal removal path
    whenStoppingEffects(() => {
        const effect = meta.liveEffectsMap[effectId];
        if (!effect)
            return; // Already removed or never existed
        const phase = !!effect.atStepEnd ? "endOfStep" : "duringStep";
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
export function toSafeEffectId(prefix) {
    const counterNumber = meta.autoEffectIdCounter;
    meta.autoEffectIdCounter += 1;
    return (prefix || "autoEffect") + "_" + counterNumber;
}
