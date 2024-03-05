// -----------------------------------------------------------------
// main functions
// -----------------------------------------------------------------
import meta from "../meta";
import { _addItem, _removeItem, _setState } from "../settingInternal";
export const getDefaultStates = () => meta.defaultStateByItemType;
export const getDefaultRefs = () => meta.defaultRefsByItemType;
export const getItemTypes = () => meta.itemTypeNames;
export function getItem(type, name) {
    return [getState()[type][name], getRefs()[type][name], getPrevState()[type][name]];
}
export const getState = () => meta.currentState;
export const setState = (newState, callback) => _setState(newState, callback);
export function onNextTick(callback) {
    meta.callbacksQue.push(callback); // NOTE WARNING This used to be callforwardsQue
}
export const getPrevState = () => meta.previousState;
export const getRefs = () => meta.currentRefs;
export function addItem(addItemOptions, callback) {
    _addItem(addItemOptions, callback);
}
export function removeItem(itemInfo) {
    _removeItem(itemInfo);
}
