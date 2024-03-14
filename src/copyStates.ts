import { repondMeta as meta, RecordedChanges } from "./meta";

export function makeCopyStatesFunction(copyType: "copy" | "merge") {
  if (copyType === "copy") {
    return function copyStates(currentObject: any, saveToObject: any) {
      const { itemTypeNames, propNamesByItemType, itemIdsByItemType } = meta;

      for (let typeIndex = 0; typeIndex < itemTypeNames.length; typeIndex++) {
        const itemType = itemTypeNames[typeIndex];

        saveToObject[itemType] = {};

        if (currentObject[itemType]) {
          const itemIds = itemIdsByItemType[itemType];
          for (let idIndex = 0; idIndex < itemIds.length; ++idIndex) {
            const itemId = itemIds[idIndex];

            if (!saveToObject[itemType][itemId]) saveToObject[itemType][itemId] = {};

            for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; propIndex++) {
              const itemProp = propNamesByItemType[itemType][propIndex];

              saveToObject[itemType][itemId][itemProp] = currentObject[itemType][itemId][itemProp];
            }
          }
        }
      }
    };
  } else if (copyType === "merge") {
    return function mergeStates(
      currentObject: any,
      saveToObject: any,
      recordedChanges: RecordedChanges,
      allRecordedChanges: RecordedChanges
    ) {
      const { itemTypeNames, propNamesByItemType, itemIdsByItemType } = meta;

      for (let typeIndex = 0; typeIndex < itemTypeNames.length; typeIndex++) {
        const itemType = itemTypeNames[typeIndex];

        if (currentObject[itemType]) {
          const itemIds = itemIdsByItemType[itemType];
          for (let idIndex = 0; idIndex < itemIds.length; ++idIndex) {
            const itemId = itemIds[idIndex];

            for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; propIndex++) {
              const itemProp = propNamesByItemType[itemType][propIndex];
              // check if the item exists before copying
              if (
                saveToObject[itemType][itemId] !== undefined &&
                currentObject[itemType] &&
                currentObject[itemType][itemId] !== undefined &&
                currentObject[itemType][itemId][itemProp] !== undefined
              ) {
                saveToObject[itemType][itemId][itemProp] = currentObject[itemType][itemId][itemProp];

                recordedChanges.itemTypesBool[itemType] = true;
                recordedChanges.itemIdsBool[itemType][itemId] = true;
                recordedChanges.itemPropsBool[itemType][itemId][itemProp] = true;

                allRecordedChanges.itemTypesBool[itemType] = true;
                allRecordedChanges.itemIdsBool[itemType][itemId] = true;
                allRecordedChanges.itemPropsBool[itemType][itemId][itemProp] = true;

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
