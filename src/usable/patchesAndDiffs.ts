import { getUniqueArrayItems } from "chootils/dist/arrays";
import { forEach } from "chootils/dist/loops";
import { addItem, getDefaultStates, getItemTypes, removeItem, setNestedState } from "./getSet";
import { createDiffInfo, getStatesDiff } from "../getStatesDiff";
import { repondMeta as meta, UntypedDiffInfo, initialRecordedChanges } from "../meta";
import { AllState, DiffInfo, GetPartialState, ItemIdsByType, ItemId, ItemType, PropName } from "../types";
import { cloneObjectWithJson } from "../utils";
import { copyStates } from "../copyStates";

type StatesPatch = {
  changed: GetPartialState<AllState>;
  added: Partial<ItemIdsByType>;
  removed: Partial<ItemIdsByType>;
};

type StatesDiff = {
  changedNext: GetPartialState<AllState>;
  changedPrev: GetPartialState<AllState>;
  added: Partial<ItemIdsByType>;
  removed: Partial<ItemIdsByType>;
};

export function makeEmptyPatch() {
  return {
    changed: {} as StatesPatch["changed"],
    added: {} as StatesPatch["added"],
    removed: {} as StatesPatch["removed"],
  } as StatesPatch;
}
export function makeEmptyDiff() {
  return {
    changedNext: {} as StatesDiff["changedNext"],
    changedPrev: {} as StatesDiff["changedPrev"],
    added: {} as StatesDiff["added"],
    removed: {} as StatesDiff["removed"],
  } as StatesDiff;
}

function makeEmptyDiffInfo() {
  const emptyDiffInfo: UntypedDiffInfo = {
    itemTypesChanged: [],
    itemsChanged: { all__: [] },
    propsChanged: {},
    itemsAdded: { all__: [] },
    itemsRemoved: { all__: [] },
    itemTypesChangedBool: {},
    itemsChangedBool: {},
    propsChangedBool: {},
    itemsAddedBool: {},
    itemsRemovedBool: {},
  };

  createDiffInfo(emptyDiffInfo);

  return emptyDiffInfo as DiffInfo;
}

export function applyPatch(patch: StatesPatch) {
  const itemTypes = getItemTypes();
  forEach(itemTypes, (type) => {
    forEach(patch.removed[type] ?? [], (id) => removeItem({ type, id }));
    forEach(patch.added[type] ?? [], (id) => addItem({ type, id, state: patch.changed?.[type]?.[id] }));
  });
  setNestedState(patch.changed);
}

export function applyPatchHere(newStates: GetPartialState<AllState>, patch: StatesPatch) {
  const itemTypes = getItemTypes();
  const defaultStates = getDefaultStates();

  forEach(itemTypes, (type) => {
    // Loop through each removed item, and delete it from newStates
    forEach(patch.removed[type] ?? [], (id) => {
      const itemTypeState = newStates[type];
      if (itemTypeState && itemTypeState[id]) {
        delete itemTypeState[id];
      }
    });

    // Loop through each new item, and add it to newStates with getDefaultState(itemId)
    forEach(patch.added[type] ?? [], (id) => {
      if (!newStates[type]) {
        newStates[type] = {} as (typeof newStates)[typeof type];
      }
      const itemTypeState = newStates[type];
      if (itemTypeState) {
        if (itemTypeState[id] === undefined) {
          itemTypeState[id] = defaultStates[type](id); // NOTE maybe no need to add it then delete it?
        }
      }
      if (itemTypeState && itemTypeState[id]) {
        delete itemTypeState[id];
      }
    });

    // Loop through each changed items and set the properties in newState
    const changedItemsForType = patch.changed[type];
    if (changedItemsForType !== undefined) {
      const changedItemIds = Object.keys(
        changedItemsForType as NonNullable<typeof changedItemsForType>
      ) as ItemIdsByType[typeof type];

      forEach(changedItemIds, (itemId) => {
        const changedPropertiesForItem = changedItemsForType[itemId];
        const storeState = newStates[type];

        if (changedPropertiesForItem !== undefined && storeState !== undefined) {
          const itemState = storeState[itemId];
          if (itemState !== undefined) {
            const changePropertyNames = Object.keys(
              changedPropertiesForItem as NonNullable<typeof changedPropertiesForItem>
            ) as (keyof typeof changedPropertiesForItem & string)[];

            forEach(changePropertyNames, (propertyName) => {
              storeState[itemId] = changedPropertiesForItem[propertyName];
            });
          }
        }
      });
    }
  });
}

function getPatchOrDiff(
  prevState: GetPartialState<AllState>,
  newState: GetPartialState<AllState>,
  patchOrDiff: "patch"
): StatesPatch;
function getPatchOrDiff(
  prevState: GetPartialState<AllState>,
  newState: GetPartialState<AllState>,
  patchOrDiff: "diff"
): StatesDiff;
function getPatchOrDiff<T_PatchOrDiff extends "patch" | "diff">(
  prevState: GetPartialState<AllState>,
  newState: GetPartialState<AllState>,
  patchOrDiff: T_PatchOrDiff
) {
  const itemTypes = getItemTypes();
  const defaultStates = getDefaultStates();

  const newPatch = makeEmptyPatch();
  const tempDiffInfo = makeEmptyDiffInfo();
  const tempManualUpdateChanges = initialRecordedChanges();

  try {
    getStatesDiff(
      newState, // currentState
      prevState, // previousState
      tempDiffInfo,
      tempManualUpdateChanges, // manualUpdateChanges
      true // checkAllChanges
    );
  } catch (error: any) {
    console.log("Error");
    console.log(error);
  }

  // Then can use tempDiffInfo to make the patch (with items removed etc)
  forEach(itemTypes, (itemType) => {
    // Add added and removed with itemsAdded and itemsRemoved
    if (tempDiffInfo.itemsAdded[itemType] && tempDiffInfo.itemsAdded[itemType].length > 0) {
      newPatch.added[itemType] = tempDiffInfo.itemsAdded[itemType];
    }
    if (tempDiffInfo.itemsRemoved[itemType] && tempDiffInfo.itemsRemoved[itemType].length > 0) {
      newPatch.removed[itemType] = tempDiffInfo.itemsRemoved[itemType];
    }
  });

  // To add changed
  // Loop through items changes, then itemIdsChanged[itemType] then
  // propsChanged[itemType][itemId]
  // And set the changed to the value in newState
  forEach(tempDiffInfo.itemTypesChanged, (itemType) => {
    if (!newPatch.changed[itemType]) {
      newPatch.changed[itemType] = {};
    }
    const patchChangesForItemType = newPatch.changed[itemType];
    if (patchChangesForItemType) {
      forEach(tempDiffInfo.itemsChanged[itemType], (itemId) => {
        if (!patchChangesForItemType[itemId]) {
          patchChangesForItemType[itemId] = {};
        }
        const patchChangesForItemId = patchChangesForItemType[itemId];

        if (patchChangesForItemId) {
          const propsChangedForType = tempDiffInfo.propsChanged[itemType];
          forEach(propsChangedForType[itemId as keyof typeof propsChangedForType], (propertyName) => {
            patchChangesForItemId[propertyName] = newState?.[itemType]?.[itemId]?.[propertyName];
          });
        }
      });
    }
  });

  // Need to also add non-default properties for new items to changed
  // For each item added,
  // const defaultState = defaultStates[itemType](itemId)
  // const newState = newState[itemType][itemId]
  // Loop through each property and compare
  // If they’re different, add it to the changed object

  forEach(itemTypes, (itemType) => {
    if (newPatch?.added[itemType]?.length) {
      const itemIdsAddedForType = newPatch.added[itemType];

      const newItemTypeState = newState[itemType];

      let propertyNamesForItemType = [] as PropName<typeof itemType>[];
      let propertyNamesHaveBeenFound = false;
      forEach(itemIdsAddedForType ?? [], (itemId) => {
        const defaultItemState = defaultStates[itemType](itemId);
        const addedItemState = newItemTypeState?.[itemId];

        if (!propertyNamesHaveBeenFound) {
          propertyNamesForItemType = Object.keys(defaultItemState) as PropName<typeof itemType>[];
          propertyNamesHaveBeenFound = true;
        }

        if (addedItemState) {
          forEach(propertyNamesForItemType, (propertyName) => {
            const defaultPropertyValue = defaultItemState[propertyName];
            const newPropertyValue = addedItemState?.[propertyName];

            if (defaultPropertyValue !== undefined && newPropertyValue !== undefined) {
              let valuesAreTheSame = defaultPropertyValue === newPropertyValue;

              if (typeof newPropertyValue === "object") {
                valuesAreTheSame = JSON.stringify(defaultPropertyValue) === JSON.stringify(newPropertyValue);
              }
              if (!valuesAreTheSame) {
                if (!newPatch.changed[itemType]) {
                  newPatch.changed[itemType] = {};
                }
                const newPatchChangedForItemType = newPatch.changed[itemType];
                if (newPatchChangedForItemType) {
                  if (!newPatchChangedForItemType[itemId]) {
                    newPatchChangedForItemType[itemId] = {};
                  }
                  const newPatchChangedForItemId = newPatchChangedForItemType[itemId];

                  if (newPatchChangedForItemId) {
                    newPatchChangedForItemId[propertyName] = newPropertyValue;
                  }
                }
              }
            }
          });
        }
      });
    }
  });
  if (patchOrDiff === "patch") {
    return newPatch;
  }
  const newDiff = makeEmptyDiff();
  newDiff.added = newPatch.added;
  newDiff.removed = newPatch.removed;
  newDiff.changedNext = newPatch.changed;

  // Need to also add non-default properties for removed items to changedPrev
  // For each item removed,
  // const defaultState = defaultStates[itemType](itemId)
  // const newState = prevState[itemType][itemId]
  // Loop through each property and compare
  // If they’re different, add it to the changedPrev object
  // (same as for added, but instead of adding to newPatch.changed, it's to newDiff.changedPrev, and checking the prevState)

  forEach(itemTypes, (itemType) => {
    if (newDiff.removed[itemType]?.length) {
      const itemIdsRemovedForType = newDiff.removed[itemType];

      const prevItemTypeState = prevState[itemType];

      let propertyNamesForItemType = [] as PropName<typeof itemType>[];
      let propertyNamesHaveBeenFound = false;
      forEach(itemIdsRemovedForType ?? [], (itemId) => {
        const defaultItemState = defaultStates[itemType](itemId);
        const removedItemState = prevItemTypeState?.[itemId];

        if (!propertyNamesHaveBeenFound) {
          propertyNamesForItemType = Object.keys(defaultItemState) as PropName<typeof itemType>[];
          propertyNamesHaveBeenFound = true;
        }

        if (removedItemState) {
          forEach(propertyNamesForItemType, (propertyName) => {
            const defaultPropertyValue = defaultItemState[propertyName];
            const newPropertyValue = removedItemState?.[propertyName];

            if (defaultPropertyValue !== undefined && newPropertyValue !== undefined) {
              let valuesAreTheSame = removedItemState[propertyName] === newPropertyValue;

              if (typeof newPropertyValue === "object") {
                valuesAreTheSame = JSON.stringify(defaultPropertyValue) === JSON.stringify(newPropertyValue);
              }
              if (!valuesAreTheSame) {
                if (!newDiff.changedPrev[itemType]) {
                  newDiff.changedPrev[itemType] = {};
                }
                const newDiffChangedForItemType = newDiff.changedPrev[itemType];
                if (newDiffChangedForItemType) {
                  if (!newDiffChangedForItemType[itemId]) {
                    newDiffChangedForItemType[itemId] = {};
                  }
                  const newDiffChangedForItemId = newDiffChangedForItemType[itemId];

                  if (newDiffChangedForItemId) {
                    newDiffChangedForItemId[propertyName] = newPropertyValue;
                  }
                }
              }
            }
          });
        }
      });
    }
  });

  return newDiff;
}

export function getPatch(prevState: GetPartialState<AllState>, newState: GetPartialState<AllState>) {
  return getPatchOrDiff(prevState, newState, "patch");
}

export function getPatchAndReversed(prevState: GetPartialState<AllState>, newState: GetPartialState<AllState>) {
  const patch = getPatch(prevState, newState);
  const reversePatch = getPatch(newState, prevState);
  return [patch, reversePatch];
}

export function getReversePatch(partialState: GetPartialState<AllState>, newPatch: StatesPatch) {
  const prevState: GetPartialState<AllState> = {};
  copyStates(partialState, prevState);
  const newState: GetPartialState<AllState> = {};
  copyStates(partialState, newState);
  applyPatchHere(newState, newPatch);
  const reversePatch = getPatch(newState, prevState);
  return reversePatch;
}

export function combineTwoPatches(prevPatch: StatesPatch, newPatch: StatesPatch) {
  const itemTypes = getItemTypes();
  const combinedPatch = makeEmptyPatch();
  //
  forEach(itemTypes, (itemType) => {
    // combine added and removed , and remove duplicates

    const itemsAddedPrev = prevPatch.added[itemType];
    const itemsAddedNew = newPatch.added[itemType];

    const hasAddedItems = itemsAddedPrev?.length || itemsAddedNew?.length;

    if (hasAddedItems) {
      combinedPatch.added[itemType] = getUniqueArrayItems([
        ...(itemsAddedPrev ?? ([] as ItemIdsByType[typeof itemType])),
        ...(itemsAddedNew ?? ([] as ItemIdsByType[typeof itemType])),
      ]);
    }

    const itemsRemovedPrev = prevPatch.removed[itemType];
    const itemsRemovedNew = newPatch.removed[itemType];

    const hasRemovedItems =
      (itemsRemovedPrev && itemsRemovedPrev.length > 0) || (itemsRemovedNew && itemsRemovedNew.length > 0);

    if (hasRemovedItems) {
      combinedPatch.removed[itemType] = getUniqueArrayItems([
        ...(itemsRemovedPrev ?? ([] as ItemIdsByType[typeof itemType])),
        ...(itemsRemovedNew ?? ([] as ItemIdsByType[typeof itemType])),
      ]);
    }

    // Anything in removed in prev that was added in new, removed from removed
    if (itemsRemovedPrev && itemsAddedNew) {
      combinedPatch.removed[itemType] = combinedPatch.removed[itemType]!.filter((itemId) => {
        if (itemsRemovedPrev.includes(itemId) && itemsAddedNew.includes(itemId)) {
          return false;
        }

        return true;
      });
    }

    // Anything in removed in new that was added in prev, removed from added
    if (itemsRemovedNew && itemsAddedPrev) {
      combinedPatch.added[itemType] = combinedPatch.added[itemType]!.filter((itemId) => {
        if (itemsRemovedNew.includes(itemId) && itemsAddedPrev.includes(itemId)) {
          return false;
        }
        return true;
      });
    }

    // Merge changes

    const itemsChangedPrev = prevPatch.changed[itemType];
    const itemsChangedNew = prevPatch.changed[itemType];

    const hasChangedItems = itemsChangedPrev || itemsChangedNew;

    if (hasChangedItems) {
      const allChangedItemIds = Object.keys({
        ...(itemsChangedPrev ?? {}),
        ...(itemsChangedNew ?? {}),
      }) as ItemId<typeof itemType>[];

      if (!combinedPatch.changed[itemType]) {
        combinedPatch.changed[itemType] = {};
      }
      const combinedPatchChangedForItemType = combinedPatch.changed[itemType];

      if (combinedPatchChangedForItemType) {
        forEach(allChangedItemIds, (itemId) => {
          const combinedPatchChangedForItemId = combinedPatchChangedForItemType[itemId];
          type LoopedItemIdChanges = typeof combinedPatchChangedForItemId;

          combinedPatchChangedForItemType[itemId] = {
            ...(itemsChangedPrev?.[itemId] ?? {}),
            ...(itemsChangedNew?.[itemId] ?? {}),
          } as LoopedItemIdChanges;
        });

        // Remove any item changes that are in removed
        forEach(combinedPatch.removed[itemType] ?? [], (itemId) => {
          if (combinedPatchChangedForItemType[itemId]) {
            delete combinedPatchChangedForItemType[itemId];
          }
        });
      }
    }
  });
  return combinedPatch;
}

export function combinePatches(patchesArray: StatesPatch[]) {
  let combinedPatches = patchesArray[0];
  forEach(patchesArray, (loopedPatch, index) => {
    const currentPatch = combinedPatches;
    const nextPatch = patchesArray[index + 1];
    if (nextPatch) {
      combinedPatches = combineTwoPatches(currentPatch, nextPatch);
    }
  });
  return combinedPatches;
}

export function makeMinimalPatch(currentStates: GetPartialState<AllState>, thePatch: StatesPatch) {
  const itemTypes = getItemTypes();
  const defaultStates = getDefaultStates();

  const minimalPatch = cloneObjectWithJson(thePatch) as StatesPatch;
  // Loop through the changed items, and each changed property
  forEach(itemTypes, (itemType) => {
    const propertyNames = Object.keys(defaultStates[itemType]("anItemId")) as PropName<typeof itemType>[];

    const changedForType = minimalPatch.changed[itemType];
    if (changedForType) {
      const changedItemIds = Object.keys(changedForType ?? {}) as ItemId<typeof itemType>[];
      forEach(changedItemIds, (itemId) => {
        const changedForItem = changedForType[itemId];
        const itemState = currentStates?.[itemType]?.[itemId];
        if (changedForItem && itemState) {
          forEach(propertyNames, (propertyName) => {
            // If the value’s the same as state, remove that change property
            if (changedForItem[propertyName] === itemState[propertyName]) {
              delete changedForItem[propertyName];
            }
          });
        }
        // (if the item has no more properties, remove that changed item)
        const changedPropertyNames = Object.keys(changedForItem ?? {});
        if (changedPropertyNames.length === 0) {
          delete changedForType[itemId];
        }
      });
    }
    // Loop through the added items, if the item already exists in state, remove it from added
    if (minimalPatch.added[itemType]) {
      minimalPatch.added[itemType] = minimalPatch.added[itemType]!.filter(
        (itemId) => !!currentStates?.[itemType]?.[itemId]
      );
    }

    // Loop through the removed items, if the item doesn’t exist in state, remove it from removed
    if (minimalPatch.removed[itemType]) {
      minimalPatch.removed[itemType] = minimalPatch.removed[itemType]!.filter(
        (itemId) => !currentStates?.[itemType]?.[itemId]
      );
    }
  });
}

export function removePartialPatch(thePatch: StatesPatch, patchToRemove: StatesPatch) {
  const newPatch = cloneObjectWithJson(thePatch) as StatesPatch;
  const itemTypes = getItemTypes();

  forEach(itemTypes, (itemType) => {
    // Loop through removed in patchToRemove, if it’s in newPatch , remove it
    if (newPatch.removed[itemType]) {
      newPatch.removed[itemType] = newPatch.removed[itemType]!.filter(
        (itemId) => !patchToRemove.removed[itemType]!.includes(itemId)
      );
    }
    // Loop through added in patchToRemove, if it’s in newPatch , remove it
    // Keep track of noLongerAddedItems { itemType: []
    const noLongerAddedItems: ItemId<ItemType>[] = [];
    if (newPatch.added[itemType]) {
      newPatch.added[itemType] = newPatch.added[itemType]!.filter((itemId) => {
        const shouldKeep = !patchToRemove.added[itemType]!.includes(itemId);
        if (!shouldKeep) {
          noLongerAddedItems.push(itemId);
        }
        return shouldKeep;
      });
    }

    // Loop through changed items, if the same change is in patchToRemove and newPatch, remove it from new patch
    const removedPatchChangedForType = patchToRemove.changed[itemType];
    const newPatchChangedForType = newPatch.changed[itemType];
    if (removedPatchChangedForType && newPatchChangedForType) {
      const changedItemIds = Object.keys(removedPatchChangedForType ?? {}) as ItemId<typeof itemType>[];
      forEach(changedItemIds, (itemId) => {
        const removedPatchChangedForItem = removedPatchChangedForType[itemId];
        const newPatchChangedForItem = newPatchChangedForType[itemId];

        if (removedPatchChangedForItem && newPatchChangedForItem) {
          // (if the item has no more properties, remove that changed item)
          const removedPatchChangedPropertyNames = Object.keys(
            removedPatchChangedForItem ?? {}
          ) as (keyof typeof removedPatchChangedForItem & string)[];

          forEach(removedPatchChangedPropertyNames, (propertyName) => {
            if (
              JSON.stringify(removedPatchChangedForItem[propertyName]) ===
              JSON.stringify(newPatchChangedForItem[propertyName])
            ) {
              delete newPatchChangedForItem[propertyName];
            }
          });
        }

        const changedPropertyNamesB = Object.keys(removedPatchChangedForItem ?? {});

        // If there's no more property changes for an item name, or that item isn't added anymore, then remove it from changes
        const noMorePropertyChanges = changedPropertyNamesB.length === 0;
        if (noMorePropertyChanges || noLongerAddedItems.includes(itemId)) {
          delete newPatchChangedForType[itemId];
        }
      });
    }
  });
}

export function getDiff(prevState: GetPartialState<AllState>, newState: GetPartialState<AllState>) {
  return getPatchOrDiff(prevState, newState, "diff");
}

export function getDiffFromPatches(forwardPatch: StatesPatch, reversePatch: StatesPatch) {
  const newDiff = makeEmptyDiff();
  newDiff.added = forwardPatch.added;
  newDiff.removed = forwardPatch.removed;
  newDiff.changedNext = forwardPatch.changed;
  newDiff.changedPrev = reversePatch.changed;
  //
  //
  // Maybe if forwardPatch.added/ removed isnt same as backwardPatch removed/added then show warning, but use the forward patch?
  return newDiff;
}

export function getPatchesFromDiff(theDiff: StatesDiff) {
  const forwardPatch = makeEmptyPatch();
  const reversePatch = makeEmptyPatch();
  forwardPatch.added = theDiff.added;
  forwardPatch.removed = theDiff.removed;
  reversePatch.added = theDiff.removed;
  reversePatch.removed = theDiff.added;
  forwardPatch.changed = theDiff.changedNext;
  reversePatch.changed = theDiff.changedPrev;
  return [forwardPatch, reversePatch] as [StatesPatch, StatesPatch];
}

export function combineTwoDiffs(prevDiff: StatesDiff, newDiff: StatesDiff) {
  const [prevForwardPatch, prevReversePatch] = getPatchesFromDiff(prevDiff);
  const [newForwardPatch, newReversePatch] = getPatchesFromDiff(prevDiff);
  const combinedForwardPatch = combineTwoPatches(prevForwardPatch, newForwardPatch);
  const combinedReversePatch = combineTwoPatches(prevReversePatch, newReversePatch);

  return getDiffFromPatches(combinedForwardPatch, combinedReversePatch);
}

export function combineDiffs(diffsArray: StatesDiff[]) {
  let combinedDiffs = diffsArray[0];
  forEach(diffsArray, (loopedDiff, index) => {
    const currentDiff = combinedDiffs;
    const nextDiff = diffsArray[index + 1];
    if (nextDiff) {
      combinedDiffs = combineTwoDiffs(currentDiff, nextDiff);
    }
  });
  return combinedDiffs;
}
