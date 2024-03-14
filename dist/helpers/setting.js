import meta from "../meta";
import { runWhenAddingAndRemovingItems, runWhenUpdatingRepond } from "./runWhens";
export function _setState(newState, callback) {
    runWhenUpdatingRepond(() => {
        const newStateValue = typeof newState === "function" ? newState(meta.nowState) : newState;
        if (!newStateValue)
            return;
        meta.mergeStates(newStateValue, meta.nowState, meta.nowMetaPhase === "runningEffects" ? meta.recordedEffectChanges : meta.recordedStepEndEffectChanges, meta.recordedStepEndEffectChanges);
    }, callback);
}
export function _removeItem({ type: itemType, id: itemId }, callback) {
    runWhenAddingAndRemovingItems(() => {
        // removing itemId
        delete meta.nowState[itemType][itemId];
        meta.itemIdsByItemType[itemType] = Object.keys(meta.nowState[itemType]);
        // delete meta.currentRefs[itemType][itemId]; // now done at the end of update repond
        meta.recordedStepEndEffectChanges.itemTypesBool[itemType] = true;
        meta.recordedStepEndEffectChanges.somethingChanged = true;
        meta.recordedEffectChanges.itemTypesBool[itemType] = true;
        meta.recordedEffectChanges.somethingChanged = true;
    }, callback);
}
export function _addItem({ type, id, state, refs }, callback) {
    runWhenAddingAndRemovingItems(() => {
        meta.nowState[type][id] = {
            ...meta.defaultStateByItemType[type](id),
            ...(state || {}),
        };
        meta.nowRefs[type][id] = {
            ...meta.defaultRefsByItemType[type](id, meta.nowState[id]),
            ...(refs || {}),
        };
        meta.itemIdsByItemType[type].push(id);
        meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;
        // TODO Figure out if adding an item should record the properties as chnaged or not?
        meta.recordedStepEndEffectChanges.itemPropsBool[type][id] = {};
        meta.recordedEffectChanges.itemPropsBool[type][id] = {};
        meta.diffInfo.propsChanged[type][id] = [];
        meta.diffInfo.propsChangedBool[type][id] = {};
        meta.recordedStepEndEffectChanges.itemIdsBool[type][id] = true;
        meta.recordedStepEndEffectChanges.somethingChanged = true;
        meta.recordedEffectChanges.itemTypesBool[type] = true;
        meta.recordedEffectChanges.itemIdsBool[type][id] = true;
        meta.recordedEffectChanges.somethingChanged = true;
    }, callback);
}
