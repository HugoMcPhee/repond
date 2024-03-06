import meta from "./meta";
export function makeCopyStatesFunction(copyType = "copy") {
    if (copyType === "copy") {
        return function copyStates(currentObject, saveToObject) {
            const { itemTypeNames, propNamesByItemType, itemNamesByItemType } = meta;
            for (let typeIndex = 0; typeIndex < itemTypeNames.length; typeIndex++) {
                const itemType = itemTypeNames[typeIndex];
                if (copyType === "copy") {
                    saveToObject[itemType] = {};
                }
                if (currentObject[itemType]) {
                    const itemNames = itemNamesByItemType[itemType];
                    for (let nameIndex = 0; nameIndex < itemNames.length; ++nameIndex) {
                        const itemName = itemNames[nameIndex];
                        if (!saveToObject[itemType][itemName]) {
                            saveToObject[itemType][itemName] = {};
                        }
                        for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; propIndex++) {
                            const itemProp = propNamesByItemType[itemType][propIndex];
                            saveToObject[itemType][itemName][itemProp] = currentObject[itemType][itemName][itemProp];
                        }
                    }
                }
            }
        };
    }
    else if (copyType === "merge") {
        return function mergeStates(currentObject, saveToObject, recordedChanges, allRecordedChanges) {
            const { itemTypeNames, propNamesByItemType, itemNamesByItemType } = meta;
            for (let typeIndex = 0; typeIndex < itemTypeNames.length; typeIndex++) {
                const itemType = itemTypeNames[typeIndex];
                if (currentObject[itemType]) {
                    const itemNames = itemNamesByItemType[itemType];
                    for (let nameIndex = 0; nameIndex < itemNames.length; ++nameIndex) {
                        const itemName = itemNames[nameIndex];
                        for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; propIndex++) {
                            const itemProp = propNamesByItemType[itemType][propIndex];
                            // check if the item exists before copying
                            if (saveToObject[itemType][itemName] !== undefined &&
                                currentObject[itemType] &&
                                currentObject[itemType][itemName] !== undefined &&
                                currentObject[itemType][itemName][itemProp] !== undefined) {
                                saveToObject[itemType][itemName][itemProp] = currentObject[itemType][itemName][itemProp];
                                recordedChanges.itemTypesBool[itemType] = true;
                                recordedChanges.itemNamesBool[itemType][itemName] = true;
                                recordedChanges.itemPropertiesBool[itemType][itemName][itemProp] = true;
                                allRecordedChanges.itemTypesBool[itemType] = true;
                                allRecordedChanges.itemNamesBool[itemType][itemName] = true;
                                allRecordedChanges.itemPropertiesBool[itemType][itemName][itemProp] = true;
                                recordedChanges.somethingChanged = true;
                                allRecordedChanges.somethingChanged = true;
                            }
                        }
                    }
                }
            }
        };
    }
}
