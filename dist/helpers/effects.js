import { removeItemFromArrayInPlace } from "chootils/dist/arrays";
import { repondMeta as meta } from "../meta";
import { whenDoingEffectsRunAtStart, whenStartingEffects, whenStoppingEffects } from "../helpers/runWhens";
import { forEach } from "chootils/dist/loops";
export function _addEffect(newEffectDef) {
    const phase = newEffectDef.atStepEnd ? "endOfStep" : "duringStep";
    const step = newEffectDef.step ?? "default";
    const effectId = newEffectDef.id ?? toSafeEffectId();
    // TODO setupEffect the frist time each time if the cache stuff isn't there
    storeCachedValuesForEffect(newEffectDef);
    if (newEffectDef.runAtStart) {
        whenDoingEffectsRunAtStart(() => runEffectWithoutChange(newEffectDef));
    }
    whenStartingEffects(() => {
        meta.liveEffectsMap[effectId] = newEffectDef;
        const idsByStep = meta.effectIdsByPhaseByStepByPropId[phase];
        if (!idsByStep[step])
            idsByStep[step] = {};
        forEach(newEffectDef.changes, (change) => {
            idsByStep[step][change] = idsByStep[step][change] || [];
            if (!idsByStep[step][change].includes(effectId))
                idsByStep[step][change].push(effectId);
        });
        // idsByStep[step] = idsByStep[step] || [];
        // if (!idsByStep[step].includes(effectId)) idsByStep[step].push(effectId);
    });
    return effectId;
}
export function runEffectWithoutChangeForItems(effect) {
    let itemIdsToRun = getItemIdsForEffect(effect);
    forEach(itemIdsToRun, (itemId) => effect.run(itemId, meta.diffInfo, 16.66666, true /* ranWithoutChange */));
}
export function runEffectWithoutChange(effect) {
    if (effect.isPerItem) {
        runEffectWithoutChangeForItems(effect);
        return;
    }
    effect.run("", meta.diffInfo, 16.66666, true /* ranWithoutChange */);
}
// Return or cache item types for an effect
export function getItemTypesFromEffect(effect) {
    let itemIdsToRun = [];
    // if (effect._itemTypes) return effect._itemTypes;
    if (effect._itemTypes?.length)
        return effect._itemTypes;
    const changes = effect.changes;
    if (changes.length === 1) {
        const itemType = meta.itemTypeByPropPathId[changes[0]];
        if (!itemType) {
            console.warn(`(one change) Effect ${effect.id} has no item types =-=-=-=-=-=-=-=-=-=-'`);
            console.log("effect", effect.changes[0]);
            console.log(JSON.stringify(meta.itemTypeByPropPathId, null, 2));
            return [];
        }
        // return undefined;
        return [itemType];
    }
    const itemTypeMap = {};
    forEach(changes, (change) => {
        const itemType = meta.itemTypeByPropPathId[change];
        if (itemType && !itemTypeMap[itemType]) {
            itemTypeMap[itemType] = true;
        }
    });
    const itemTypes = Object.keys(itemTypeMap);
    if (!itemTypes.length) {
        console.warn(`Effect ${effect.id} has no item types =-=-=-=-=-=-=-=-=-=-'`);
        console.warn(effect.changes);
        console.log("effect", effect);
    }
    return itemTypes;
}
export function getItemIdsForEffect(effect) {
    if (effect.itemIds)
        return effect.itemIds;
    let itemIdsToRun = [];
    const itemTypes = getItemTypesFromEffect(effect);
    if (!effect._itemTypes)
        effect._itemTypes = itemTypes;
    const changes = effect.changes;
    if (itemTypes.length === 1) {
        const itemType = meta.itemTypeByPropPathId[changes[0]];
        return meta.itemIdsByItemType[itemType] ?? [];
    }
    itemTypes.forEach((itemType) => {
        const itemIds = meta.itemIdsByItemType[itemType];
        if (itemIds)
            itemIdsToRun.push(...itemIds);
    });
    return itemIdsToRun;
}
export function storeCachedValuesForEffect(effect) {
    if (effect.isPerItem === undefined)
        effect.isPerItem = true; // default to per item
    if (effect._allowedIdsMap && effect._itemTypes && effect._propsByItemType)
        return; // NOTE _allowedIdsMap can be undefined, so the check isn't that useful
    let allowedIdsMap = undefined;
    const itemTypes = getItemTypesFromEffect(effect);
    if (!itemTypes?.length) {
        console.log(`Effect ${effect.id} has no item types =-=-=-=-=-=-=-=-=-=-'`);
    }
    effect._itemTypes = itemTypes;
    const ids = effect.itemIds;
    if (ids) {
        allowedIdsMap = {};
        forEach(ids, (itemId) => (allowedIdsMap[itemId] = true));
    }
    effect._allowedIdsMap = allowedIdsMap;
    const propsByItemType = {};
    const checkAddedByItemType = {};
    const checkRemovedByItemType = {};
    forEach(effect.changes, (change) => {
        const itemType = meta.itemTypeByPropPathId[change];
        if (!propsByItemType[itemType])
            propsByItemType[itemType] = [];
        const foundPropName = meta.propKeyByPropPathId[change];
        if (foundPropName) {
            propsByItemType[itemType].push(foundPropName);
        }
        else {
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
export function _stopEffect(effectId) {
    whenStoppingEffects(() => {
        const effect = meta.liveEffectsMap[effectId];
        if (!effect)
            return;
        const phase = !!effect.atStepEnd ? "endOfStep" : "duringStep";
        const step = effect.step ?? "default";
        forEach(effect.changes, (propId) => {
            removeItemFromArrayInPlace(meta.effectIdsByPhaseByStepByPropId[phase]?.[step]?.[propId] ?? [], effect.id);
        });
        delete meta.liveEffectsMap[effectId];
    });
}
export function toSafeEffectId(prefix) {
    const counterNumber = meta.autoEffectIdCounter;
    meta.autoEffectIdCounter += 1;
    return (prefix || "autoEffect") + "_" + counterNumber;
}
