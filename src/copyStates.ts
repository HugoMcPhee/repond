import { repondMeta as meta, RecordedChanges } from "./meta";

export function copyStates(currentObject: any, saveToObject: any) {
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
}

function fastCloneArray<T_ArrayItem extends any>(arr: T_ArrayItem[]) {
  const newArray: T_ArrayItem[] = [];
  for (let i = 0; i < arr.length; i++) {
    newArray.push(arr[i]);
  }
  return newArray;
}

export function copyItemIdsByItemType(currentObject: any, saveToObject: any) {
  const itemTypes = meta.itemTypeNames;
  for (let i = 0; i < itemTypes.length; i++) {
    const itemType = itemTypes[i];
    saveToObject[itemType] = fastCloneArray(currentObject[itemType]);
  }
}

export function mergeStates_OLD(
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
}

export function mergeToState(
  storeType: string,
  propKey: string,
  newValue: string,
  foundItemId: string,
  saveToObject: any,
  recordedChanges: RecordedChanges,
  allRecordedChanges: RecordedChanges
) {
  // check if the item exists before copying
  if (saveToObject?.[storeType]?.[foundItemId] === undefined) return;

  // save the new state
  saveToObject[storeType][foundItemId][propKey] = newValue;

  recordedChanges.itemTypesBool[storeType] = true;
  recordedChanges.itemIdsBool[storeType][foundItemId] = true;
  recordedChanges.itemPropsBool[storeType][foundItemId][propKey] = true;

  allRecordedChanges.itemTypesBool[storeType] = true;
  allRecordedChanges.itemIdsBool[storeType][foundItemId] = true;
  allRecordedChanges.itemPropsBool[storeType][foundItemId][propKey] = true;

  recordedChanges.somethingChanged = true;
  allRecordedChanges.somethingChanged = true;
}
