import { repondMeta as meta } from "./meta";
import { EffectDef, EffectPhase } from "./types";
import { getState } from "./usable/getSet";

const EMPTY_ARRAY: string[] = []; // created once to avoidmaking many news arrays

// created once and cleared to avoid making many new arrays each time, to save memory
const changedEffectIds: string[] = [];

let alreadyCheckedEffectIdsMap: Record<string, boolean> = {};

export default function checkEffects(phase: EffectPhase = "endOfStep", stepName: string = "default"): string[] {
  changedEffectIds.length = 0;

  let effectIdsByPropId = meta.effectIdsByPhaseByStepByPropId[phase][stepName] ?? {};
  const phaseToCheck = meta.isFirstDuringPhaseLoop ? "endOfStep" : phase;
  const propsChanged = Object.keys(meta.recordedPropIdsChangedMap[phaseToCheck]);

  for (let i = 0; i < propsChanged.length; i++) {
    const propId = propsChanged[i];
    const effectIdsForProp = effectIdsByPropId[propId] ?? EMPTY_ARRAY;

    if (!effectIdsForProp.length) continue;

    for (let idIndex = 0; idIndex < effectIdsForProp.length; idIndex++) {
      const effectId = effectIdsForProp[idIndex];
      if (alreadyCheckedEffectIdsMap[effectId]) continue;
      alreadyCheckedEffectIdsMap[effectId] = true;
      const effect = meta.liveEffectsMap[effectId];
      if (checkEffectForChanges(effect, meta.diffInfo)) changedEffectIds.push(effectId!);
    }
  }

  alreadyCheckedEffectIdsMap = {};

  return changedEffectIds;
}

function checkEffectForChanges(effect: EffectDef, diffInfo: typeof meta.diffInfo) {
  const itemTypes = effect._itemTypes;
  const allowedIdsMap = effect._allowedIdsMap;
  const propsByItemType = effect._propsByItemType;
  const checkAddedByItemType = effect._checkAddedByItemType;
  const checkRemovedByItemType = effect._checkRemovedByItemType;

  const shouldCheckAnyId = !allowedIdsMap;

  if (!itemTypes || !checkAddedByItemType || !checkRemovedByItemType) {
    console.warn(`Effect ${effect.id} has no cached data, skipping check`);
    return false;
  }

  if (!itemTypes.length) {
    console.warn(`Effect ${effect.id} has no item types, skipping check`);
    console.log(effect);
    return false;
  }

  for (let typesIndex = 0; typesIndex < itemTypes.length; typesIndex++) {
    const type = itemTypes[typesIndex];

    const shouldCheckAdded = checkAddedByItemType[type];
    const shouldCheckRemoved = checkRemovedByItemType[type];
    const propsToCheck = propsByItemType?.[type];
    const shouldCheckBecomes = effect.becomes !== undefined;

    // First check if anything was added for this item type
    if (shouldCheckAdded && diffInfo.itemsAddedBool[type]) {
      if (shouldCheckAnyId) {
        return true; // did change
      } else {
        for (let itemIdIndex = 0; itemIdIndex < diffInfo.itemsAdded[type].length; itemIdIndex++) {
          const itemId = diffInfo.itemsAdded[type][itemIdIndex];
          if (allowedIdsMap![itemId]) return true; // did change
        }
      }
    }
    // Then check if anything was removed for this item type
    if (shouldCheckRemoved && diffInfo.itemsRemovedBool[type]) {
      if (shouldCheckAnyId) {
        return true; // did change
      } else {
        for (let itemIdIndex = 0; itemIdIndex < diffInfo.itemsRemoved[type].length; itemIdIndex++) {
          const itemId = diffInfo.itemsRemoved[type][itemIdIndex];
          if (allowedIdsMap![itemId]) return true; // did change
        }
      }
    }

    // Then check if any properties were changed for this item type
    if (propsToCheck) {
      for (let propNameIndex = 0; propNameIndex < propsToCheck.length; propNameIndex++) {
        const propName = propsToCheck[propNameIndex];
        const propChangedForAnyItem = diffInfo.propsChangedBool[type].__all[propName];
        if (propChangedForAnyItem) {
          if (shouldCheckAnyId && !shouldCheckBecomes) {
            return true; // did change
          } else {
            for (let itemIdIndex = 0; itemIdIndex < diffInfo.itemsChanged[type].length; itemIdIndex++) {
              const itemId = diffInfo.itemsChanged[type][itemIdIndex];

              // forEach(diffInfo.itemsChanged[type], (itemId) => {
              if (!allowedIdsMap || allowedIdsMap![itemId]) {
                if (diffInfo.propsChangedBool[type][itemId][propName]) {
                  if (shouldCheckBecomes) {
                    if (getState(type, itemId)?.[propName] === effect.becomes) {
                      return true; // did change
                    } else {
                      continue; // did not change
                    }
                  } else {
                    return true; // did change
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return false;
}
