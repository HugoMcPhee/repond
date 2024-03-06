import { getUniqueArrayItems } from "chootils/dist/arrays";
import { forEach } from "chootils/dist/loops";
import { addItem, getDefaultStates, getItemTypes, removeItem, setState } from "../usable/getSet";
import { createDiffInfo } from "../getStatesDiff";
import meta, { UntypedDiffInfo, initialRecordedChanges } from "../meta";
import { AllState, DiffInfo, GetPartialState, ItemName, ItemType, PropName } from "../types";
import { cloneObjectWithJson } from "../utils";

// ---------------------------------------------------
// Patches and Diffs
// ---------------------------------------------------

type ItemNamesByType = {
  [K_Type in ItemType]: ItemName<K_Type>[];
};

type StatesPatch = {
  changed: GetPartialState<AllState>;
  added: Partial<ItemNamesByType>;
  removed: Partial<ItemNamesByType>;
};

type StatesDiff = {
  changedNext: GetPartialState<AllState>;
  changedPrev: GetPartialState<AllState>;
  added: Partial<ItemNamesByType>;
  removed: Partial<ItemNamesByType>;
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

  forEach(itemTypes, (itemType) => {
    // Loop through removed items, and run removeRepondItem()
    forEach(patch.removed[itemType] ?? [], (itemName) => removeItem({ type: itemType, name: itemName }));
    // Loop through added items and run addRepondItem()
    forEach(patch.added[itemType] ?? [], (itemName) =>
      addItem({
        type: itemType,
        name: itemName,
        state: patch.changed?.[itemType]?.[itemName],
      })
    );
  });
  // run setState(patch.changed)
  setState(patch.changed);
}

export function applyPatchHere(newStates: GetPartialState<AllState>, patch: StatesPatch) {
  const itemTypes = getItemTypes();
  const defaultStates = getDefaultStates();

  forEach(itemTypes, (itemType) => {
    // Loop through each removed item, and delete it from newStates
    forEach(patch.removed[itemType] ?? [], (itemName) => {
      const itemTypeState = newStates[itemType];
      if (itemTypeState && itemTypeState[itemName]) {
        delete itemTypeState[itemName];
      }
    });

    // Loop through each new item, and add it to newStates with state(itemName)
    forEach(patch.added[itemType] ?? [], (itemName) => {
      if (!newStates[itemType]) {
        newStates[itemType] = {} as (typeof newStates)[typeof itemType];
      }
      const itemTypeState = newStates[itemType];
      if (itemTypeState) {
        if (itemTypeState[itemName] === undefined) {
          itemTypeState[itemName] = defaultStates[itemType](itemName);
        }
      }
      if (itemTypeState && itemTypeState[itemName]) {
        delete itemTypeState[itemName];
      }
    });

    // Loop through each changed items and set the properties in newState
    const changedItemsForType = patch.changed[itemType];
    if (changedItemsForType !== undefined) {
      const changedItemNames = Object.keys(
        changedItemsForType as NonNullable<typeof changedItemsForType>
      ) as ItemNamesByType[typeof itemType];

      forEach(changedItemNames, (itemName) => {
        const changedPropertiesForItem = changedItemsForType[itemName];
        const itemTypeState = newStates[itemType];

        if (changedPropertiesForItem !== undefined && itemTypeState !== undefined) {
          const itemNameState = itemTypeState[itemName];
          if (itemNameState !== undefined) {
            const changePropertyNames = Object.keys(
              changedPropertiesForItem as NonNullable<typeof changedPropertiesForItem>
            ) as (keyof typeof changedPropertiesForItem & string)[];

            forEach(changePropertyNames, (propertyName) => {
              itemTypeState[itemName] = changedPropertiesForItem[propertyName];
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
    meta.getStatesDiff(
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
  // Loop through items changes, then itemNamesChanged[itemType] then
  // propsChanged[itemType][itemName]
  // And set the changed to the value in newState
  forEach(tempDiffInfo.itemTypesChanged, (itemType) => {
    if (!newPatch.changed[itemType]) {
      newPatch.changed[itemType] = {};
    }
    const patchChangesForItemType = newPatch.changed[itemType];
    if (patchChangesForItemType) {
      forEach(tempDiffInfo.itemsChanged[itemType], (itemName) => {
        if (!patchChangesForItemType[itemName]) {
          patchChangesForItemType[itemName] = {};
        }
        const patchChangesForItemName = patchChangesForItemType[itemName];

        if (patchChangesForItemName) {
          const propsChangedForType = tempDiffInfo.propsChanged[itemType];
          forEach(propsChangedForType[itemName as keyof typeof propsChangedForType], (propertyName) => {
            patchChangesForItemName[propertyName] = newState?.[itemType]?.[itemName]?.[propertyName];
          });
        }
      });
    }
  });

  // Need to also add non-default properties for new items to changed
  // For each item added,
  // const defaultState = defaultStates[itemType](itemName)
  // const newState = newState[itemType][itemName]
  // Loop through each property and compare
  // If they’re different, add it to the changed object

  forEach(itemTypes, (itemType) => {
    if (newPatch?.added[itemType]?.length) {
      const itemNamesAddedForType = newPatch.added[itemType];

      const newItemTypeState = newState[itemType];

      let propertyNamesForItemType = [] as PropName<typeof itemType>[];
      let propertyNamesHaveBeenFound = false;
      forEach(itemNamesAddedForType ?? [], (itemName) => {
        const defaultItemState = defaultStates[itemType](itemName);
        const addedItemState = newItemTypeState?.[itemName];

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
                  if (!newPatchChangedForItemType[itemName]) {
                    newPatchChangedForItemType[itemName] = {};
                  }
                  const newPatchChangedForItemName = newPatchChangedForItemType[itemName];

                  if (newPatchChangedForItemName) {
                    newPatchChangedForItemName[propertyName] = newPropertyValue;
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
  // const defaultState = defaultStates[itemType](itemName)
  // const newState = prevState[itemType][itemName]
  // Loop through each property and compare
  // If they’re different, add it to the changedPrev object
  // (same as for added, but instead of adding to newPatch.changed, it's to newDiff.changedPrev, and checking the prevState)

  forEach(itemTypes, (itemType) => {
    if (newDiff.removed[itemType]?.length) {
      const itemNamesRemovedForType = newDiff.removed[itemType];

      const prevItemTypeState = prevState[itemType];

      let propertyNamesForItemType = [] as PropName<typeof itemType>[];
      let propertyNamesHaveBeenFound = false;
      forEach(itemNamesRemovedForType ?? [], (itemName) => {
        const defaultItemState = defaultStates[itemType](itemName);
        const removedItemState = prevItemTypeState?.[itemName];

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
                  if (!newDiffChangedForItemType[itemName]) {
                    newDiffChangedForItemType[itemName] = {};
                  }
                  const newDiffChangedForItemName = newDiffChangedForItemType[itemName];

                  if (newDiffChangedForItemName) {
                    newDiffChangedForItemName[propertyName] = newPropertyValue;
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
  meta.copyStates(partialState, prevState);
  const newState: GetPartialState<AllState> = {};
  meta.copyStates(partialState, newState);
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
        ...(itemsAddedPrev ?? ([] as ItemNamesByType[typeof itemType])),
        ...(itemsAddedNew ?? ([] as ItemNamesByType[typeof itemType])),
      ]);
    }

    const itemsRemovedPrev = prevPatch.removed[itemType];
    const itemsRemovedNew = newPatch.removed[itemType];

    const hasRemovedItems =
      (itemsRemovedPrev && itemsRemovedPrev.length > 0) || (itemsRemovedNew && itemsRemovedNew.length > 0);

    if (hasRemovedItems) {
      combinedPatch.removed[itemType] = getUniqueArrayItems([
        ...(itemsRemovedPrev ?? ([] as ItemNamesByType[typeof itemType])),
        ...(itemsRemovedNew ?? ([] as ItemNamesByType[typeof itemType])),
      ]);
    }

    // Anything in removed in prev that was added in new, removed from removed
    if (itemsRemovedPrev && itemsAddedNew) {
      combinedPatch.removed[itemType] = combinedPatch.removed[itemType]!.filter((itemName) => {
        if (itemsRemovedPrev.includes(itemName) && itemsAddedNew.includes(itemName)) {
          return false;
        }

        return true;
      });
    }

    // Anything in removed in new that was added in prev, removed from added
    if (itemsRemovedNew && itemsAddedPrev) {
      combinedPatch.added[itemType] = combinedPatch.added[itemType]!.filter((itemName) => {
        if (itemsRemovedNew.includes(itemName) && itemsAddedPrev.includes(itemName)) {
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
      const allChangedItemNames = Object.keys({
        ...(itemsChangedPrev ?? {}),
        ...(itemsChangedNew ?? {}),
      }) as ItemName<typeof itemType>[];

      if (!combinedPatch.changed[itemType]) {
        combinedPatch.changed[itemType] = {};
      }
      const combinedPatchChangedForItemType = combinedPatch.changed[itemType];

      if (combinedPatchChangedForItemType) {
        forEach(allChangedItemNames, (itemName) => {
          const combinedPatchChangedForItemName = combinedPatchChangedForItemType[itemName];
          type LoopedItemNameChanges = typeof combinedPatchChangedForItemName;

          combinedPatchChangedForItemType[itemName] = {
            ...(itemsChangedPrev?.[itemName] ?? {}),
            ...(itemsChangedNew?.[itemName] ?? {}),
          } as LoopedItemNameChanges;
        });

        // Remove any item changes that are in removed
        forEach(combinedPatch.removed[itemType] ?? [], (itemName) => {
          if (combinedPatchChangedForItemType[itemName]) {
            delete combinedPatchChangedForItemType[itemName];
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
    const propertyNames = Object.keys(defaultStates[itemType]("anItemName")) as PropName<typeof itemType>[];

    const changedForType = minimalPatch.changed[itemType];
    if (changedForType) {
      const changedItemNames = Object.keys(changedForType ?? {}) as ItemName<typeof itemType>[];
      forEach(changedItemNames, (itemName) => {
        const changedForItem = changedForType[itemName];
        const itemState = currentStates?.[itemType]?.[itemName];
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
          delete changedForType[itemName];
        }
      });
    }
    // Loop through the added items, if the item already exists in state, remove it from added
    if (minimalPatch.added[itemType]) {
      minimalPatch.added[itemType] = minimalPatch.added[itemType]!.filter(
        (itemName) => !!currentStates?.[itemType]?.[itemName]
      );
    }

    // Loop through the removed items, if the item doesn’t exist in state, remove it from removed
    if (minimalPatch.removed[itemType]) {
      minimalPatch.removed[itemType] = minimalPatch.removed[itemType]!.filter(
        (itemName) => !currentStates?.[itemType]?.[itemName]
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
        (itemName) => !patchToRemove.removed[itemType]!.includes(itemName)
      );
    }
    // Loop through added in patchToRemove, if it’s in newPatch , remove it
    // Keep track of noLongerAddedItems { itemType: []
    const noLongerAddedItems: ItemName<ItemType>[] = [];
    if (newPatch.added[itemType]) {
      newPatch.added[itemType] = newPatch.added[itemType]!.filter((itemName) => {
        const shouldKeep = !patchToRemove.added[itemType]!.includes(itemName);
        if (!shouldKeep) {
          noLongerAddedItems.push(itemName);
        }
        return shouldKeep;
      });
    }

    // Loop through changed items, if the same change is in patchToRemove and newPatch, remove it from new patch
    const removedPatchChangedForType = patchToRemove.changed[itemType];
    const newPatchChangedForType = newPatch.changed[itemType];
    if (removedPatchChangedForType && newPatchChangedForType) {
      const changedItemNames = Object.keys(removedPatchChangedForType ?? {}) as ItemName<typeof itemType>[];
      forEach(changedItemNames, (itemName) => {
        const removedPatchChangedForItem = removedPatchChangedForType[itemName];
        const newPatchChangedForItem = newPatchChangedForType[itemName];

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
        if (noMorePropertyChanges || noLongerAddedItems.includes(itemName)) {
          delete newPatchChangedForType[itemName];
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
