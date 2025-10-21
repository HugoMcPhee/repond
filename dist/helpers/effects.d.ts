import { EffectDef } from "../types";
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
export declare function _addEffect(newEffectDef: EffectDef): string;
/**
 * Runs an effect for all its relevant items without waiting for changes.
 * Used for runAtStart effects.
 *
 * @param effect - The effect to run
 */
export declare function runEffectWithoutChangeForItems(effect: EffectDef): void;
/**
 * Runs an effect immediately without waiting for changes.
 * Handles both per-item and global effects.
 *
 * @param effect - The effect to run
 */
export declare function runEffectWithoutChange(effect: EffectDef): void;
/**
 * Extracts and caches which item types an effect watches.
 * Uses the effect's `changes` array to determine item types.
 *
 * Example: changes ["player.health", "player.position"] → itemTypes ["player"]
 *
 * @param effect - The effect definition
 * @returns Array of item type names
 */
export declare function getItemTypesFromEffect(effect: EffectDef): string[];
/**
 * Gets all item IDs that an effect should run for.
 *
 * If effect specifies `itemIds`, returns those.
 * Otherwise, returns all items of the watched item types.
 *
 * @param effect - The effect definition
 * @returns Array of item IDs
 */
export declare function getItemIdsForEffect(effect: EffectDef): string[];
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
export declare function storeCachedValuesForEffect(effect: EffectDef): void;
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
export declare function _stopEffect(effectId: string): void;
/**
 * Generates a unique effect ID using an auto-incrementing counter.
 * Used when effect doesn't specify an ID.
 *
 * @param prefix - Optional prefix (defaults to "autoEffect")
 * @returns A unique effect ID
 */
export declare function toSafeEffectId(prefix?: string): string;
