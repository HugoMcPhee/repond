import { forEach } from "chootils/dist/loops";
import meta from "./meta";

export function cloneObjectWithJson(theObject: { [key: string]: any }) {
  return JSON.parse(JSON.stringify(theObject));
}

// converts values to arrays, or keeps as an array, and undefined will still return undefined
export function toSafeArray<T_Item>(theValue: T_Item | T_Item[] | undefined) {
  if (theValue !== undefined) {
    return Array.isArray(theValue)
      ? (theValue as NonNullable<T_Item>[])
      : ([theValue] as NonNullable<T_Item>[]);
  }
  return undefined;
}

// same as toSafeArray, but returns an empty array instead of undefined
export function asArray<T_Item>(theValue: T_Item | T_Item[] | undefined) {
  return toSafeArray(theValue) ?? ([] as T_Item[]);
}

//  For createConcepts
export function makeRefsStructureFromPietemState() {
  forEach(meta.itemTypeNames, (typeName: string) => {
    // if no initialRefs were provided add defaults here?
    // need to store initalRefs? worldStateMeta.customInitialRefs
    // {itemType : customInitialRefs}

    meta.currentRefs[typeName] = {};
    forEach(Object.keys(meta.currentState[typeName]), (itemName: string) => {
      meta.currentRefs[typeName][itemName] = meta.defaultRefsByItemType[
        typeName
      ](itemName, meta.currentState[typeName][itemName]);
    });
  });
}
