import { EMPTY_RECORDED_CHANGES, repondMeta as meta, RecordedChanges } from "./meta";

const EMPTY_ARRAY = [];

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

export function copyChangedStates(nowState: any, prevState: any /* saveToObject */) {
  const { itemTypeNames, propNamesByItemType, itemIdsByItemType, recordedStepEndEffectChanges, diffInfo } = meta;

  const recordedChanges = recordedStepEndEffectChanges;

  const itemTypesChanged = diffInfo.itemTypesChanged;
  const itemTypesWithAdded = diffInfo.itemTypesWithAdded;
  const itemTypesWithRemoved = diffInfo.itemTypesWithRemoved;

  // Check deleted items here
  for (let typeIndex = 0; typeIndex < itemTypesWithRemoved.length; typeIndex++) {
    const itemType = itemTypesWithRemoved[typeIndex];

    const itemIds = diffInfo.itemsRemoved[itemType];
    if (!itemIds) continue;
    if (!itemIds.length) continue;

    for (let idIndex = 0; idIndex < itemIds.length; ++idIndex) {
      const itemId = itemIds[idIndex];

      delete prevState[itemType][itemId];
    }
  }

  // Check added items here
  for (let typeIndex = 0; typeIndex < itemTypesWithAdded.length; typeIndex++) {
    const itemType = itemTypesWithRemoved[typeIndex];

    const itemIds = diffInfo.itemsAdded[itemType];
    if (!itemIds) continue;
    if (!itemIds.length) continue;

    for (let idIndex = 0; idIndex < itemIds.length; ++idIndex) {
      const itemId = itemIds[idIndex];

      if (!prevState[itemType][itemId]) prevState[itemType][itemId] = {};

      for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; propIndex++) {
        const itemProp = propNamesByItemType[itemType][propIndex];
        prevState[itemType][itemId][itemProp] = nowState[itemType][itemId][itemProp];
      }
    }
  }
  // Check changes here
  for (let typeIndex = 0; typeIndex < itemTypesChanged.length; typeIndex++) {
    const itemType = itemTypesChanged[typeIndex];

    // saveToObject[itemType] = {};

    if (nowState[itemType]) {
      // const itemIds = itemIdsByItemType[itemType];
      const itemIds = diffInfo.itemsChanged[itemType];
      if (!itemIds) continue;
      if (!itemIds.length) continue;

      // const latestItemIds = nowState[itemType];
      for (let idIndex = 0; idIndex < itemIds.length; ++idIndex) {
        const itemId = itemIds[idIndex];

        // if (!prevState[itemType][itemId]) prevState[itemType][itemId] = {};

        const propsChanged = diffInfo.propsChanged[itemType][itemId];
        if (!propsChanged) continue;
        if (!propsChanged.length) continue;

        for (let propIndex = 0; propIndex < propsChanged.length; propIndex++) {
          const itemProp = propsChanged[propIndex];

          if (!prevState[itemType][itemId]) prevState[itemType][itemId] = {};

          prevState[itemType][itemId][itemProp] = nowState[itemType][itemId][itemProp];
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

export function cloneObjectWithJson(theObject: { [key: string]: any }) {
  return JSON.parse(JSON.stringify(theObject));
}
