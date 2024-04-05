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
