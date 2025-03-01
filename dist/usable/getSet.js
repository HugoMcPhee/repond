import { forEach } from "chootils/dist/loops";
import { runWhenAddingAndRemovingItems, whenSettingStates } from "../helpers/runWhens";
import { repondMeta as meta } from "../meta";
import { applyPatch, getPatch } from "../usable/patchesAndDiffs";
export function setState(propPath, newValue, itemId) {
    whenSettingStates(() => {
        if (newValue === undefined)
            return;
        if (!propPath) {
            console.error("propPath must be provided");
            return;
        }
        if (typeof propPath !== "string") {
            console.error("propPath must be a string");
            console.log("propPath", propPath);
            return;
        }
        meta.recordedPropIdsChangedMap[meta.nowEffectPhase][propPath] = true;
        meta.recordedPropIdsChangedMap.endOfStep[propPath] = true;
        // if (meta.nowEffectPhase === "duringStep") {
        // console.log("meta.nowEffectPhase", meta.nowEffectPhase);
        // console.log(meta.recordedPropIdsChangedMap.duringStep?.[propPath]);
        // }
        const storeType = meta.itemTypeByPropPathId[propPath];
        const propKey = meta.propKeyByPropPathId[propPath];
        let foundItemId = itemId || meta.itemIdsByItemType[storeType]?.[0];
        if (!foundItemId) {
            foundItemId = Object.keys(meta.nowState[storeType] ?? {})[0];
            console.warn(`${propPath}No itemId found for setState ${storeType}, using first found itemId: ${foundItemId} from Object keys`);
        }
        const recordedChanges = meta.nowEffectPhase === "duringStep" ? meta.recordedEffectChanges : meta.recordedStepEndEffectChanges;
        const allRecordedChanges = meta.recordedStepEndEffectChanges;
        // check if the item exists before copying
        if (meta.nowState?.[storeType]?.[foundItemId] === undefined)
            return;
        // save the new state
        meta.nowState[storeType][foundItemId][propKey] = newValue;
        if (meta.nowEffectPhase === "duringStep") {
            recordedChanges.itemTypesBool[storeType] = true;
            if (!recordedChanges.itemIdsBool[storeType]) {
                recordedChanges.itemIdsBool[storeType] = {};
            }
            recordedChanges.itemIdsBool[storeType][foundItemId] = true;
            if (!recordedChanges.itemPropsBool[storeType][foundItemId]) {
                recordedChanges.itemPropsBool[storeType][foundItemId] = {};
            }
            recordedChanges.itemPropsBool[storeType][foundItemId][propKey] = true;
            recordedChanges.somethingChanged = true;
        }
        allRecordedChanges.itemTypesBool[storeType] = true;
        if (!allRecordedChanges.itemIdsBool[storeType]) {
            allRecordedChanges.itemIdsBool[storeType] = {};
        }
        allRecordedChanges.itemIdsBool[storeType][foundItemId] = true;
        if (!allRecordedChanges.itemPropsBool[storeType][foundItemId]) {
            allRecordedChanges.itemPropsBool[storeType][foundItemId] = {};
        }
        allRecordedChanges.itemPropsBool[storeType][foundItemId][propKey] = true;
        allRecordedChanges.somethingChanged = true;
    });
}
export function setNestedState(newState) {
    whenSettingStates(() => {
        if (!newState)
            return;
        const itemTypes = Object.keys(newState);
        forEach(itemTypes, (itemType) => {
            const itemIds = Object.keys(newState[itemType]);
            forEach(itemIds, (itemId) => {
                const itemProps = Object.keys(newState[itemType][itemId]);
                forEach(itemProps, (propName) => {
                    const newValue = newState[itemType][itemId][propName];
                    setState(`${itemType}.${propName}`, newValue, itemId);
                });
            });
        });
    });
}
export const getNewState = (itemType) => meta.newStateByItemType[itemType];
export const getNewRefs = (itemType) => meta.newRefsByItemType[itemType];
export const getItemTypes = () => meta.itemTypeNames;
export const getItemIds = (itemType) => meta.itemIdsByItemType[itemType];
const _getNestedState = () => meta.nowState;
export const getState = (itemType, itemId) => {
    if (!itemId) {
        const foundItemId = meta.itemIdsByItemType?.[itemType]?.[0];
        if (!foundItemId)
            console.warn(`(getState) No itemId provided for ${itemType}, using first found itemId: ${foundItemId}`);
        return meta.nowState[itemType][foundItemId];
    }
    // const allItemTypeState = meta.nowState[kind];
    // if (allItemTypeState === undefined) {
    //   console.warn(`(getState) No state found for ${kind}`);
    // }
    // const foundState = allItemTypeState?.[itemId];
    // if (foundState === undefined) {
    //   console.warn(`(getState) No state found for ${kind} with id ${itemId}`);
    // }
    // return foundState;
    return meta.nowState[itemType]?.[itemId];
};
// Good for running things to be sure the state change is seen
export function onNextTick(callback) {
    if (callback)
        meta.nextTickQueue.push(callback);
}
export const getPrevState = (itemType, itemId) => {
    if (!itemId) {
        // const foundItemId = meta.prevItemIdsByItemType?.[kind]?.[0];
        const foundItemId = Object.keys(meta.prevState?.[itemType] ?? {})?.[0] ?? meta.itemIdsByItemType?.[itemType]?.[0];
        if (!foundItemId) {
            // console.warn(`(getPrevState) No itemId provided for ${kind}, using first found itemId: ${foundItemId}`);
        }
        return meta.prevState?.[itemType]?.[foundItemId] ?? meta.nowState[itemType][foundItemId];
    }
    if (!meta.prevState[itemType]?.[itemId]) {
        // console.warn(`(getPrevState) No prevState found for ${kind} with id ${itemId} (using nowState instead)`);
        return meta.nowState[itemType][itemId];
    }
    return meta.prevState[itemType][itemId];
};
export const getRefs = (itemType, itemId) => {
    if (!itemId) {
        const foundItemId = meta.itemIdsByItemType?.[itemType]?.[0];
        if (!foundItemId) {
            console.warn(`(getRefs) No itemId provided for ${itemType}, using first found itemId: ${foundItemId}`);
        }
        return meta.nowRefs[itemType][foundItemId];
    }
    if (meta.nowRefs?.[itemType]?.[itemId] === undefined) {
        console.warn(`(getRefs) No refs found for ${itemType} with id ${itemId}`);
    }
    return meta.nowRefs[itemType][itemId];
};
// Adding and removing items
export function addItem(type, id, state, refs) {
    if (!meta.willAddItemsInfo[type])
        meta.willAddItemsInfo[type] = {};
    meta.willAddItemsInfo[type][id] = true;
    const propPath = `${type}.__added`;
    runWhenAddingAndRemovingItems(() => {
        meta.nowState[type][id] = {
            ...meta.newStateByItemType[type](id),
            ...(state || {}),
        };
        meta.nowRefs[type][id] = {
            ...meta.newRefsByItemType[type]?.(id, meta.nowState[type][id]),
            ...(refs || {}),
        };
        meta.itemIdsByItemType[type].push(id);
        meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;
        // TODO Figure out if adding an item should record the properties as changed or not?
        meta.recordedStepEndEffectChanges.itemPropsBool[type][id] = {};
        meta.recordedEffectChanges.itemPropsBool[type][id] = {};
        meta.diffInfo.propsChanged[type][id] = [];
        meta.diffInfo.propsChangedBool[type][id] = {};
        meta.recordedStepEndEffectChanges.itemIdsBool[type][id] = true;
        meta.recordedStepEndEffectChanges.somethingChanged = true;
        meta.recordedEffectChanges.itemTypesBool[type] = true;
        meta.recordedEffectChanges.itemIdsBool[type][id] = true;
        meta.recordedEffectChanges.somethingChanged = true;
        meta.recordedPropIdsChangedMap[meta.nowEffectPhase][propPath] = true;
        meta.recordedPropIdsChangedMap.endOfStep[propPath] = true;
        // NOTE new items with props different to the defaults props are recorded as changed
        const itemPropNames = meta.propNamesByItemType[type];
        forEach(itemPropNames, (propName) => {
            const propChangedFromDefault = meta.nowState[type][id][propName] !== meta.newStateByItemType[type](id)[propName];
            if (propChangedFromDefault) {
                meta.recordedStepEndEffectChanges.itemPropsBool[type][id][propName] = true;
                meta.recordedEffectChanges.itemPropsBool[type][id][propName] = true;
            }
        });
    });
}
export function removeItem(type, id) {
    if (!meta.willRemoveItemsInfo[type])
        meta.willRemoveItemsInfo[type] = {};
    meta.willRemoveItemsInfo[type][id] = true;
    const propPath = `${type}.__added`;
    runWhenAddingAndRemovingItems(() => {
        // removing itemId
        delete meta.nowState[type][id];
        meta.itemIdsByItemType[type] = Object.keys(meta.nowState[type]);
        // delete meta.currentRefs[itemType][itemId]; // now done at the end of update repond
        meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;
        meta.recordedStepEndEffectChanges.somethingChanged = true;
        meta.recordedEffectChanges.itemTypesBool[type] = true;
        meta.recordedEffectChanges.somethingChanged = true;
        meta.recordedPropIdsChangedMap[meta.nowEffectPhase][propPath] = true;
        meta.recordedPropIdsChangedMap.endOfStep[propPath] = true;
    });
}
export function getItemWillBeAdded(type, id) {
    return !!meta.willAddItemsInfo[type]?.[id];
}
export function getItemWillBeRemoved(type, id) {
    return !!meta.willRemoveItemsInfo[type]?.[id] || !!meta.nowState[type][id];
}
export function getItemWillExist(type, id) {
    return getItemWillBeAdded(type, id) || !!getState(type, id);
}
// For saving and loading
// Function to selectively get data with only specific props from the repond store, can be used for save data
export function getPartialState_OLD(propsToGet) {
    const itemTypes = Object.keys(propsToGet);
    if (!meta.didInit) {
        console.warn("getPartialState called before repond was initialized");
        return {};
    }
    const partialState = {};
    for (const itemType of itemTypes) {
        const itemPropNames = propsToGet[itemType];
        const itemIds = meta.itemIdsByItemType[itemType];
        const partialItems = {};
        for (const itemId of itemIds) {
            const item = getState(itemType, itemId);
            const partialItem = {};
            for (const propName of itemPropNames) {
                partialItem[propName] = item[propName];
            }
            partialItems[itemId] = partialItem;
        }
        partialState[itemType] = partialItems;
    }
    return partialState;
}
export function getPartialState(propsToGet) {
    const itemType = meta.itemTypeByPropPathId;
    if (!meta.didInit) {
        console.warn("getPartialState called before repond was initialized");
        return {};
    }
    const partialState = {};
    for (const propId of propsToGet) {
        const itemType = meta.itemTypeByPropPathId[propId];
        const propName = meta.propKeyByPropPathId[propId];
        const itemIds = meta.itemIdsByItemType[itemType];
        const partialItems = {};
        for (const itemId of itemIds) {
            const item = getState(itemType, itemId);
            const partialItem = {};
            partialItem[propName] = item[propName];
            partialItems[itemId] = partialItem;
        }
        partialState[itemType] = partialItems;
    }
    return partialState;
}
export function applyState(partialState) {
    if (partialState)
        applyPatch(getPatch(_getNestedState(), partialState));
}
