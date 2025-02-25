import { repondMeta as meta } from "./meta";
export function copyStates(currentObject, saveToObject) {
    const { itemTypeNames, propNamesByItemType, itemIdsByItemType } = meta;
    for (let typeIndex = 0; typeIndex < itemTypeNames.length; typeIndex++) {
        const itemType = itemTypeNames[typeIndex];
        saveToObject[itemType] = {};
        if (currentObject[itemType]) {
            const itemIds = itemIdsByItemType[itemType];
            for (let idIndex = 0; idIndex < itemIds.length; ++idIndex) {
                const itemId = itemIds[idIndex];
                if (!saveToObject[itemType][itemId])
                    saveToObject[itemType][itemId] = {};
                for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; propIndex++) {
                    const itemProp = propNamesByItemType[itemType][propIndex];
                    saveToObject[itemType][itemId][itemProp] = currentObject[itemType][itemId][itemProp];
                }
            }
        }
    }
}
function fastCloneArray(arr) {
    const newArray = [];
    for (let i = 0; i < arr.length; i++) {
        newArray.push(arr[i]);
    }
    return newArray;
}
export function copyItemIdsByItemType(currentObject, saveToObject) {
    const itemTypes = meta.itemTypeNames;
    for (let i = 0; i < itemTypes.length; i++) {
        const itemType = itemTypes[i];
        saveToObject[itemType] = fastCloneArray(currentObject[itemType]);
    }
}
export function cloneObjectWithJson(theObject) {
    return JSON.parse(JSON.stringify(theObject));
}
