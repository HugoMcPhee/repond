import { getState } from "./usable/getSet";
import { repondMeta as meta } from "./meta";
let didLogEffectIds = false;
const NO_EFFECT_NAMES = []; // created once to avoidmaking many news arrays
const EMPTY_ARRAY = [];
// created once and cleared to avoid making many new arrays each time, to save memory
const changedEffectIds = [];
let alreadyCheckedEffectIdsMap = {};
export default function checkEffects(phase = "endOfStep", stepName = "default") {
    changedEffectIds.length = 0;
    let effectIdsByPropId = meta.effectIdsByPhaseByStepByPropId[phase][stepName] ?? {};
    const phaseToCheck = meta.isFirstDuringPhaseLoop ? "endOfStep" : phase;
    const propsChanged = Object.keys(meta.recordedPropIdsChangedMap[phaseToCheck]);
    // if (phase !== "endOfStep" && propsChanged.length) {
    //   console.log("phase", phase, propsChanged.length);
    // }
    // if (propsChanged.length) {
    //   console.log("propsChanged", propsChanged);
    // }
    // alreadyCheckedEffectIdsMap
    // const effectIds = [] as string[];
    for (let i = 0; i < propsChanged.length; i++) {
        const propId = propsChanged[i];
        const effectIdsForProp = effectIdsByPropId[propId] ?? EMPTY_ARRAY;
        if (!effectIdsForProp.length)
            continue;
        for (let idIndex = 0; idIndex < effectIdsForProp.length; idIndex++) {
            const effectId = effectIdsForProp[idIndex];
            if (alreadyCheckedEffectIdsMap[effectId])
                continue;
            alreadyCheckedEffectIdsMap[effectId] = true;
            const effect = meta.liveEffectsMap[effectId];
            if (checkEffectForChanges(effect, meta.diffInfo))
                changedEffectIds.push(effectId);
        }
    }
    // meta.propsChangedThisEffectCheckLoopMap = {};
    alreadyCheckedEffectIdsMap = {};
    // const effectIds = meta.propsChangedThisEffectCheckLoopMap[]
    // if (effectIds.length > 100 && !didLogEffectIds) {
    //   didLogEffectIds = true;
    //   console.log("effectIds length > 100", effectIds.length);
    //   console.log("effectIds", effectIds);
    // }
    // for (let idIndex = 0; idIndex < effectIds.length; idIndex++) {
    //   const effectId = effectIds[idIndex];
    //   const effect = meta.liveEffectsMap[effectId];
    //   if (checkEffectForChanges(effect, meta.diffInfo)) changedEffectIds.push(effectId!);
    // }
    // if (changedEffectIds.length) {
    //   console.log(`Effects changed in ${phase} ${stepName}:`, changedEffectIds);
    // }
    return changedEffectIds;
}
function checkEffectForChanges(effect, diffInfo) {
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
            }
            else {
                for (let itemIdIndex = 0; itemIdIndex < diffInfo.itemsAdded[type].length; itemIdIndex++) {
                    const itemId = diffInfo.itemsAdded[type][itemIdIndex];
                    if (allowedIdsMap[itemId])
                        return true; // did change
                }
            }
        }
        // Then check if anything was removed for this item type
        if (shouldCheckRemoved && diffInfo.itemsRemovedBool[type]) {
            if (shouldCheckAnyId) {
                return true; // did change
            }
            else {
                for (let itemIdIndex = 0; itemIdIndex < diffInfo.itemsRemoved[type].length; itemIdIndex++) {
                    const itemId = diffInfo.itemsRemoved[type][itemIdIndex];
                    if (allowedIdsMap[itemId])
                        return true; // did change
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
                    }
                    else {
                        for (let itemIdIndex = 0; itemIdIndex < diffInfo.itemsChanged[type].length; itemIdIndex++) {
                            const itemId = diffInfo.itemsChanged[type][itemIdIndex];
                            // forEach(diffInfo.itemsChanged[type], (itemId) => {
                            if (!allowedIdsMap || allowedIdsMap[itemId]) {
                                if (diffInfo.propsChangedBool[type][itemId][propName]) {
                                    if (shouldCheckBecomes) {
                                        if (getState(type, itemId)?.[propName] === effect.becomes) {
                                            return true; // did change
                                        }
                                        else {
                                            continue; // did not change
                                        }
                                    }
                                    else {
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
