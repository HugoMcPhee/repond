import { forEach } from "chootils/dist/loops";
import meta from "./meta";
export function cloneObjectWithJson(theObject) {
    return JSON.parse(JSON.stringify(theObject));
}
// converts values to arrays, or keeps as an array, and undefined will still return undefined
export function toSafeArray(theValue) {
    if (theValue !== undefined) {
        return Array.isArray(theValue)
            ? theValue
            : [theValue];
    }
    return undefined;
}
// same as toSafeArray, but returns an empty array instead of undefined
export function asArray(theValue) {
    return toSafeArray(theValue) ?? [];
}
//  For createConcepts
export function makeRefsStructureFromRepondState() {
    forEach(meta.itemTypeNames, (typeName) => {
        // if no initialRefs were provided add defaults here?
        // need to store initalRefs? worldStateMeta.customInitialRefs
        // {itemType : customInitialRefs}
        meta.currentRefs[typeName] = {};
        forEach(Object.keys(meta.currentState[typeName]), (itemName) => {
            meta.currentRefs[typeName][itemName] = meta.defaultRefsByItemType[typeName](itemName, meta.currentState[typeName][itemName]);
        });
    });
}
