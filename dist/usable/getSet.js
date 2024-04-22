import { applyPatch, getPatch } from "../usable/patchesAndDiffs";
import { _setState, _addItem, _removeItem } from "../helpers/setting";
import { repondMeta as meta } from "../meta";
export const getDefaultStates = () => meta.defaultStateByItemType;
export const getDefaultRefs = () => meta.defaultRefsByItemType;
export const getItemTypes = () => meta.itemTypeNames;
export function getItem(type, id) {
    return [getState()[type][id], getRefs()[type][id], getPrevState()[type][id]];
}
export const getState = () => meta.nowState;
export const setState = (newState, callback) => _setState(newState, callback);
// Good for running things to be sure the state change is seen
export function onNextTick(callback) {
    meta.callbacksQue.push(callback);
}
export const getPrevState = () => meta.prevState;
export const getRefs = () => meta.nowRefs;
export function addItem(addItemOptions, callback) {
    _addItem(addItemOptions, callback);
}
export function removeItem(itemInfo) {
    _removeItem(itemInfo);
}
export function getItemWillBeAdded(type, id) {
    return !!meta.willAddItemsInfo[type]?.[id];
}
export function getItemWillBeRemoved(type, id) {
    return !!meta.willRemoveItemsInfo[type]?.[id] || !!meta.nowState[type][id];
}
export function getItemWillExist(type, id) {
    return getItemWillBeAdded(type, id) || !!getState()[type][id];
}
// Function to selectively get data with only specific props from the repond store, can be used for save data
export function getPartialState(propsToGet) {
    const itemTypes = Object.keys(propsToGet);
    const state = getState();
    if (!meta.didInit) {
        console.warn("getPartialState called before repond was initialized");
        return {};
    }
    const partialState = {};
    for (const itemType of itemTypes) {
        const itemPropNames = propsToGet[itemType];
        const items = state[itemType];
        const itemIds = Object.keys(items);
        const partialItems = {};
        for (const itemId of itemIds) {
            const item = items[itemId];
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
export function applyState(partialState) {
    if (partialState)
        applyPatch(getPatch(getState(), partialState));
}
