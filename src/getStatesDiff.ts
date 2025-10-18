import { forEach } from "chootils/dist/loops";
import { repondMeta as meta, RecordedChanges, UntypedDiffInfo } from "./meta";

/**
 * Initializes the diffInfo data structure.
 *
 * DiffInfo tracks what changed between nowState and prevState:
 * - Which item types had changes
 * - Which items were added/removed
 * - Which items had property changes
 * - Which specific properties changed
 *
 * It maintains both array (for iteration) and boolean map (for O(1) lookup) versions.
 * The __all property aggregates changes across all item types.
 *
 * @param diffInfo - The diffInfo object to initialize
 */
export function createDiffInfo(diffInfo: UntypedDiffInfo) {
  diffInfo.itemTypesChanged = [];

  // Global aggregations across all item types
  diffInfo.itemsChanged.__all = [];
  diffInfo.propsChanged.__all = [];

  // Boolean maps for O(1) lookups
  diffInfo.itemTypesChangedBool = {};
  diffInfo.itemTypesWithAddedBool = {};
  diffInfo.itemTypesWithRemovedBool = {};
  diffInfo.itemsChangedBool.__all = {};
  diffInfo.propsChangedBool.__all = {};

  // Added/removed items tracking
  diffInfo.itemsAdded.__all = [];
  diffInfo.itemsRemoved.__all = [];
  diffInfo.itemTypesWithAdded = [];
  diffInfo.itemTypesWithRemoved = [];

  diffInfo.itemsAddedBool.__all = {};
  diffInfo.itemsRemovedBool.__all = {};
  diffInfo.itemTypesWithAddedBool = {};
  diffInfo.itemTypesWithRemovedBool = {};

  // Initialize per-item-type structures
  forEach(meta.itemTypeNames, (itemType) => {
    diffInfo.itemTypesChangedBool[itemType] = false;
    diffInfo.itemsChangedBool[itemType] = {};
    diffInfo.propsChangedBool[itemType] = {};
    diffInfo.itemsAdded[itemType] = [];
    diffInfo.itemsRemoved[itemType] = [];
    diffInfo.itemsAddedBool[itemType] = {};
    diffInfo.itemsRemovedBool[itemType] = {};
    diffInfo.itemsChanged[itemType] = [];
    diffInfo.propsChanged[itemType] = {};
    diffInfo.propsChangedBool[itemType].__all = {};
    diffInfo.propsChanged[itemType].__all = [];

    // Initialize per-item structures
    forEach(meta.itemIdsByItemType[itemType], (itemId) => {
      diffInfo.itemsChangedBool[itemType][itemId] = false;
      diffInfo.propsChangedBool[itemType][itemId] = {};
      diffInfo.propsChanged[itemType][itemId] = [];

      // Initialize per-property structures
      forEach(meta.propNamesByItemType[itemType], (propName) => {
        diffInfo.propsChangedBool[itemType][itemId][propName] = false;
        diffInfo.propsChangedBool[itemType].__all![propName] = false;
        diffInfo.propsChangedBool.__all![propName] = false;
      });
    });
  });
}

/**
 * Clears diffInfo back to empty state.
 * Called before calculating a new diff to reset from the previous frame.
 *
 * Optimization: Clears arrays and recreates objects rather than resetting
 * individual properties (commented-out code shows alternative approach).
 *
 * @param diffInfo - The diffInfo to clear
 */
function clearDiffInfo(diffInfo: UntypedDiffInfo) {
  // Clear global aggregation arrays
  diffInfo.itemTypesChanged.length = 0;
  diffInfo.itemTypesWithAdded.length = 0;
  diffInfo.itemTypesWithRemoved.length = 0;
  diffInfo.itemsChanged.__all.length = 0;
  diffInfo.propsChanged.__all!.length = 0;

  diffInfo.itemsAdded.__all.length = 0;
  diffInfo.itemsRemoved.__all.length = 0;

  // Clear per-item-type data
  for (let typeIndex = 0; typeIndex < meta.itemTypeNames.length; typeIndex++) {
    const itemType = meta.itemTypeNames[typeIndex];

    // Reset booleans
    diffInfo.itemTypesChangedBool[itemType] = false;
    diffInfo.itemTypesWithAddedBool[itemType] = false;
    diffInfo.itemTypesWithRemovedBool[itemType] = false;

    // Clear arrays
    diffInfo.itemsAdded[itemType].length = 0;
    diffInfo.itemsRemoved[itemType].length = 0;
    diffInfo.itemsChanged[itemType].length = 0;

    // Recreate objects (faster than resetting each property)
    diffInfo.itemsChangedBool[itemType] = {};
    diffInfo.itemsAddedBool[itemType] = {};
    diffInfo.itemsAddedBool.__all = {};
    diffInfo.itemsRemovedBool[itemType] = {};
    diffInfo.itemsRemovedBool.__all = {};
    diffInfo.propsChanged[itemType] = {};
    diffInfo.propsChangedBool[itemType] = {};
    diffInfo.propsChangedBool[itemType].__all! = {};

    // Commented out: alternative approach to reset each item/prop individually
    // Could be more memory-efficient but slower
    // for (let nameIndex = 0; nameIndex < meta.itemIdsByItemType[itemType].length; nameIndex++) {
    //   const itemId = meta.itemIdsByItemType[itemType][nameIndex];
    //   diffInfo.itemsChangedBool[itemType][itemId] = false;
    //   diffInfo.itemsAddedBool[itemType][itemId] = false;
    //   diffInfo.itemsAddedBool.__all[itemId] = false;
    //   diffInfo.itemsRemovedBool[itemType][itemId] = false;
    //   diffInfo.itemsRemovedBool.__all[itemId] = false;
    //   diffInfo.propsChanged[itemType][itemId].length = 0;
    //   for (let propIndex = 0; propIndex < meta.propNamesByItemType[itemType].length; propIndex++) {
    //     const propName = meta.propNamesByItemType[itemType][propIndex];
    //     diffInfo.propsChangedBool[itemType][itemId][propName] = false;
    //     diffInfo.propsChangedBool[itemType].__all![propName] = false;
    //   }
    // }
  }
}

/**
 * Calculates the difference between nowState and prevState.
 *
 * This is a core optimization function that determines what changed:
 * - Items added/removed
 * - Properties that changed values
 *
 * Two modes:
 * 1. checkAllChanges=false (normal): Only checks items/props marked in recordedChanges (fast)
 * 2. checkAllChanges=true: Checks everything (used for manual diff calculation)
 *
 * Process:
 * 1. Clear previous diffInfo
 * 2. For each item type:
 *    a. Check for removed items (in prev but not in now)
 *    b. Check for added items (in now but not in prev)
 *    c. For existing items, compare each property
 *
 * Special handling:
 * - Newly added items: compare against default state (not prevState)
 * - Removed items: skip property comparison
 * - Uses recordedChanges to skip items/props that weren't touched (optimization)
 *
 * @param nowState - Current state
 * @param prevState - Previous state (from last frame)
 * @param diffInfo - Output: populated with what changed
 * @param recordedChanges - Hints about what might have changed (from setState calls)
 * @param checkAllChanges - If true, check everything; if false, use recordedChanges hints
 */
export function getStatesDiff(
  nowState: any,
  prevState: any,
  diffInfo: any,
  recordedChanges: RecordedChanges,
  checkAllChanges: boolean
) {
  const propNamesByItemType = meta.propNamesByItemType;

  clearDiffInfo(diffInfo);

  let itemTypeAddedToItemsTypesChanged = false;

  // Determine which item types to check
  const checkedItemTypes = checkAllChanges ? Object.keys(nowState) : meta.itemTypeNames;

  for (let typeIndex = 0; typeIndex < checkedItemTypes.length; ++typeIndex) {
    const itemType = checkedItemTypes[typeIndex];

    itemTypeAddedToItemsTypesChanged = false;

    // Skip item types that weren't touched (optimization)
    if (!checkAllChanges && recordedChanges.itemTypesBool[itemType] !== true) continue;

    // Determine which items to check
    const itemIds = checkAllChanges ? Object.keys(nowState[itemType]) : meta.itemIdsByItemType[itemType];
    const prevItemIds = checkAllChanges ? Object.keys(prevState[itemType]) : meta.prevItemIdsByItemType[itemType];

    // 1. Check for items removed from previous state
    for (let prevNameIndex = 0; prevNameIndex < prevItemIds.length; ++prevNameIndex) {
      const prevItemId = prevItemIds[prevNameIndex];

      // If item existed in prev but not in now, it was removed
      if (nowState?.[itemType]?.[prevItemId] === undefined) {
        // Add to global removed list
        diffInfo.itemsRemoved.__all.push(prevItemId);
        diffInfo.itemsRemovedBool.__all[prevItemId] = true;

        // Add to per-type removed list
        diffInfo.itemsRemoved[itemType].push(prevItemId);
        diffInfo.itemsRemovedBool[itemType][prevItemId] = true;

        // Mark item type as having removals
        if (diffInfo.itemTypesWithRemovedBool[itemType] !== true) {
          diffInfo.itemTypesWithRemoved.push(itemType);
          diffInfo.itemTypesWithRemovedBool[itemType] = true;
        }
      }
    }

    // 2. Check current items for additions and property changes
    for (let idIndex = 0; idIndex < itemIds.length; ++idIndex) {
      const itemId = itemIds[idIndex];

      // Skip items that weren't touched (optimization)
      if (!checkAllChanges && recordedChanges.itemIdsBool[itemType]?.[itemId] !== true) continue;

      // Check for items added since previous state
      if (prevState?.[itemType]?.[itemId] === undefined) {
        // Add to global added list
        diffInfo.itemsAdded.__all.push(itemId);
        diffInfo.itemsAddedBool.__all[itemId] = true;

        // Add to per-type added list
        diffInfo.itemsAdded[itemType].push(itemId);
        diffInfo.itemsAddedBool[itemType][itemId] = true;

        // Mark item type as having additions
        if (diffInfo.itemTypesWithAddedBool[itemType] !== true) {
          diffInfo.itemTypesWithAdded.push(itemType);
          diffInfo.itemTypesWithAddedBool[itemType] = true;
        }
      }

      let propChanged = false;
      let itemAddedToItemsChanged = false;

      // Determine if we should check properties
      const itemWasRemoved = diffInfo.itemsRemovedBool.__all[itemId];
      const itemWasAdded = diffInfo.itemsAddedBool.__all[itemId];

      let canRun = !itemWasRemoved; // Skip removed items

      // In checkAllChanges mode, also skip newly added items (they don't have property changes)
      if (checkAllChanges) {
        canRun = !itemWasRemoved && !itemWasAdded;
      }

      // 3. Check property changes for this item
      if (canRun) {
        for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; ++propIndex) {
          const itemPropName = propNamesByItemType[itemType][propIndex];

          // Skip properties that weren't touched (optimization)
          if (!checkAllChanges && recordedChanges.itemPropsBool[itemType]?.[itemId]?.[itemPropName] !== true) continue;

          /*
            TODO: Fast object comparison optimization ideas

            A) Custom comparators per property:
               meta.fastPropComparisonMap = { "doll.position": pointIsSame3d }

            B) Deep comparison using cached keys:
               meta.objectKeysByPropId = { "dolls.position": ["x","y","z"] }

            Instead of `!==` (reference equality), compare object keys individually
            for better detection of changes in nested objects.
          */

          const wasJustAdded = diffInfo.itemsAddedBool.__all[itemId];

          if (wasJustAdded) {
            // For newly added items, compare against default state (not prevState)
            propChanged =
              nowState[itemType][itemId][itemPropName] !== meta.newStateByItemType[itemType](itemId)[itemPropName];
          } else {
            // For existing items, compare current vs previous state
            propChanged = nowState[itemType][itemId][itemPropName] !== prevState[itemType][itemId][itemPropName];
          }

          // Property changed - update diffInfo at multiple levels
          if (propChanged) {
            // Add item type to changed list (once per type)
            if (!itemTypeAddedToItemsTypesChanged) {
              diffInfo.itemTypesChanged.push(itemType);
              diffInfo.itemTypesChangedBool[itemType] = true;
              itemTypeAddedToItemsTypesChanged = true;
            }

            // Add item to changed list (once per item)
            if (!itemAddedToItemsChanged) {
              diffInfo.itemsChanged[itemType].push(itemId);
              diffInfo.itemsChangedBool[itemType][itemId] = true;

              diffInfo.itemsChanged.__all.push(itemId);
              diffInfo.itemsChangedBool.__all[itemId] = true;

              itemAddedToItemsChanged = true;
            }

            // Initialize property tracking structures if needed
            if (!diffInfo.propsChangedBool?.[itemType]?.[itemId]) {
              diffInfo.propsChangedBool[itemType][itemId] = {};
              diffInfo.propsChanged[itemType][itemId] = [];
            }

            if (!diffInfo.propsChanged[itemType][itemId]) {
              diffInfo.propsChanged[itemType][itemId] = [];
              diffInfo.propsChangedBool[itemType][itemId] = {};
            }

            // Add specific property to changed list for this item
            if (!diffInfo.propsChangedBool?.[itemType]?.[itemId]?.[itemPropName]) {
              diffInfo.propsChanged[itemType][itemId].push(itemPropName);
              diffInfo.propsChangedBool[itemType][itemId][itemPropName] = true;
            }

            // Add property to global changed list
            if (!diffInfo.propsChangedBool.__all[itemPropName]) {
              diffInfo.propsChanged.__all.push(itemPropName);
              diffInfo.propsChangedBool.__all[itemPropName] = true;
            }

            // Add property to per-type __all changed list (aggregates across all items of this type)
            if (!diffInfo.propsChanged[itemType].__all) {
              diffInfo.propsChanged[itemType].__all = [];
              diffInfo.propsChangedBool[itemType].__all = {};
            }
            if (!diffInfo.propsChangedBool[itemType].__all[itemPropName]) {
              diffInfo.propsChanged[itemType].__all.push(itemPropName);
              diffInfo.propsChangedBool[itemType].__all[itemPropName] = true;
            }
          }
        }
      }
    }
  }
}
