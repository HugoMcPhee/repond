import { forEach } from "chootils/dist/loops";
import { runWhenAddingAndRemovingItems, whenSettingStates } from "../helpers/runWhens";
import { repondMeta as meta } from "../meta";
import {
  AllRefs,
  AllState,
  GetNewRefsByType,
  GetNewStateByType,
  ItemId,
  ItemPropsByType,
  ItemType,
  PropId,
  PropName,
  PropValueFromPropId,
  RepondCallback,
} from "../types";
import { applyPatch, getPatch } from "../usable/patchesAndDiffs";

export function setState<T extends PropId>(propPath: T, newValue: PropValueFromPropId<T>, itemId?: string) {
  whenSettingStates(() => {
    if (newValue === undefined) return;

    if (!propPath) {
      console.error("propPath must be provided");
      return;
    }

    if (typeof propPath !== "string") {
      console.error("propPath must be a string");
      console.log("propPath", propPath);

      return;
    }

    meta.recordedPropIdsChangedMap[meta.nowEffectPhase][propPath] = true;
    meta.recordedPropIdsChangedMap.endOfStep[propPath] = true;
    // if (meta.nowEffectPhase === "duringStep") {
    // console.log("meta.nowEffectPhase", meta.nowEffectPhase);
    // console.log(meta.recordedPropIdsChangedMap.duringStep?.[propPath]);
    // }

    const storeType = meta.itemTypeByPropPathId[propPath];
    const propKey = meta.propKeyByPropPathId[propPath];
    let foundItemId = itemId || meta.itemIdsByItemType[storeType]?.[0];
    if (!foundItemId) {
      foundItemId = Object.keys(meta.nowState[storeType] ?? {})[0];
      console.warn(
        `${propPath}No itemId found for setState ${storeType}, using first found itemId: ${foundItemId} from Object keys`
      );
    }

    const recordedChanges =
      meta.nowEffectPhase === "duringStep" ? meta.recordedEffectChanges : meta.recordedStepEndEffectChanges;
    const allRecordedChanges = meta.recordedStepEndEffectChanges;

    // check if the item exists before copying
    if (meta.nowState?.[storeType]?.[foundItemId] === undefined) return;

    // save the new state
    meta.nowState[storeType][foundItemId][propKey] = newValue;

    if (meta.nowEffectPhase === "duringStep") {
      recordedChanges.itemTypesBool[storeType] = true;
      if (!recordedChanges.itemIdsBool[storeType]) {
        recordedChanges.itemIdsBool[storeType] = {};
      }
      recordedChanges.itemIdsBool[storeType][foundItemId] = true;
      if (!recordedChanges.itemPropsBool[storeType][foundItemId]) {
        recordedChanges.itemPropsBool[storeType][foundItemId] = {};
      }
      recordedChanges.itemPropsBool[storeType][foundItemId][propKey] = true;
      recordedChanges.somethingChanged = true;
    }

    allRecordedChanges.itemTypesBool[storeType] = true;
    if (!allRecordedChanges.itemIdsBool[storeType]) {
      allRecordedChanges.itemIdsBool[storeType] = {};
    }
    allRecordedChanges.itemIdsBool[storeType][foundItemId] = true;
    if (!allRecordedChanges.itemPropsBool[storeType][foundItemId]) {
      allRecordedChanges.itemPropsBool[storeType][foundItemId] = {};
    }
    allRecordedChanges.itemPropsBool[storeType][foundItemId][propKey] = true;

    allRecordedChanges.somethingChanged = true;
  });
}

export function setNestedState(newState: Partial<AllState>) {
  whenSettingStates(() => {
    if (!newState) return;
    const itemTypes = Object.keys(newState) as ItemType[];
    forEach(itemTypes, (itemType) => {
      const itemIds = Object.keys(newState[itemType] as any);
      forEach(itemIds, (itemId) => {
        const itemProps = Object.keys(newState[itemType]![itemId]);
        forEach(itemProps, (propName) => {
          const newValue = newState[itemType]![itemId][propName];
          setState(`${itemType}.${propName}`, newValue, itemId);
        });
      });
    });
  });
}

export const getNewState = <T_Type extends ItemType>(itemType: T_Type): GetNewStateByType[T_Type] =>
  meta.newStateByItemType[itemType] as GetNewStateByType[T_Type];

export const getNewRefs = <T_Type extends ItemType>(itemType: T_Type): GetNewRefsByType[T_Type] =>
  meta.newRefsByItemType[itemType] as GetNewRefsByType[T_Type];

export const getItemTypes = (): ItemType[] => meta.itemTypeNames;
export const getItemIds = (itemType: ItemType): string[] => meta.itemIdsByItemType[itemType];

const _getNestedState = (): AllState => meta.nowState as AllState;

export const getState = <T_Type extends ItemType>(itemType: T_Type, itemId?: string): AllState[T_Type][string] => {
  if (!itemId) {
    const foundItemId = meta.itemIdsByItemType?.[itemType]?.[0];
    if (!foundItemId)
      console.warn(`(getState) No itemId provided for ${itemType}, using first found itemId: ${foundItemId}`);

    return meta.nowState[itemType][foundItemId];
  }

  // const allItemTypeState = meta.nowState[kind];
  // if (allItemTypeState === undefined) {
  //   console.warn(`(getState) No state found for ${kind}`);
  // }
  // const foundState = allItemTypeState?.[itemId];
  // if (foundState === undefined) {
  //   console.warn(`(getState) No state found for ${kind} with id ${itemId}`);
  // }
  // return foundState;
  return meta.nowState[itemType]?.[itemId];
};

// Good for running things to be sure the state change is seen
export function onNextTick(callback?: RepondCallback) {
  if (callback) meta.nextTickQueue.push(callback);
}

export const getPrevState = <T_ItemType extends ItemType>(
  itemType: T_ItemType,
  itemId?: string
): AllState[T_ItemType][keyof AllState[T_ItemType]] => {
  if (!itemId) {
    // const foundItemId = meta.prevItemIdsByItemType?.[kind]?.[0];
    const foundItemId = Object.keys(meta.prevState?.[itemType] ?? {})?.[0] ?? meta.itemIdsByItemType?.[itemType]?.[0];
    if (!foundItemId) {
      // console.warn(`(getPrevState) No itemId provided for ${kind}, using first found itemId: ${foundItemId}`);
    }
    return meta.prevState?.[itemType]?.[foundItemId] ?? meta.nowState[itemType][foundItemId];
  }
  if (!meta.prevState[itemType]?.[itemId]) {
    // console.warn(`(getPrevState) No prevState found for ${kind} with id ${itemId} (using nowState instead)`);
    return meta.nowState[itemType][itemId];
  }
  return meta.prevState[itemType][itemId];
};

export const getRefs = <T_ItemType extends ItemType>(
  itemType: T_ItemType,
  itemId?: string
): AllRefs[T_ItemType][keyof AllRefs[T_ItemType]] => {
  if (!itemId) {
    const foundItemId = meta.itemIdsByItemType?.[itemType]?.[0];
    if (!foundItemId) {
      console.warn(`(getRefs) No itemId provided for ${itemType}, using first found itemId: ${foundItemId}`);
    }
    return meta.nowRefs[itemType][foundItemId];
  }
  if (meta.nowRefs?.[itemType]?.[itemId] === undefined) {
    console.warn(`(getRefs) No refs found for ${itemType} with id ${itemId}`);
  }
  return meta.nowRefs[itemType][itemId];
};

// Adding and removing items

export function addItem<T_ItemType extends ItemType>(
  type: T_ItemType,
  id: string,
  state?: Partial<AllState[T_ItemType][ItemId]>,
  refs?: Partial<AllRefs[T_ItemType][ItemId]>
) {
  if (!meta.willAddItemsInfo[type]) meta.willAddItemsInfo[type] = {};
  meta.willAddItemsInfo[type][id] = true;

  const propPath = `${type}.__added`;

  runWhenAddingAndRemovingItems(() => {
    const newState = {
      ...meta.newStateByItemType[type](id),
      ...(state || {}),
    };
    meta.nowState[type][id] = newState;
    meta.prevState[type][id] = { ...newState };
    meta.nowRefs[type][id] = {
      ...meta.newRefsByItemType[type]?.(id, meta.nowState[type][id]),
      ...(refs || {}),
    };
    meta.itemIdsByItemType[type].push(id);
    meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;

    // TODO Figure out if adding an item should record the properties as changed or not?

    meta.recordedStepEndEffectChanges.itemPropsBool[type][id] = {};
    meta.recordedEffectChanges.itemPropsBool[type][id] = {};

    meta.diffInfo.propsChanged[type as ItemType][id] = [];
    meta.diffInfo.propsChangedBool[type as ItemType][id] = {};

    meta.recordedStepEndEffectChanges.itemIdsBool[type][id] = true;
    meta.recordedStepEndEffectChanges.somethingChanged = true;
    meta.recordedEffectChanges.itemTypesBool[type] = true;

    meta.recordedEffectChanges.itemIdsBool[type][id] = true;
    meta.recordedEffectChanges.somethingChanged = true;

    meta.recordedPropIdsChangedMap[meta.nowEffectPhase][propPath] = true;
    meta.recordedPropIdsChangedMap.endOfStep[propPath] = true;

    // NOTE new items with props different to the defaults props are recorded as changed
    const itemPropNames = meta.propNamesByItemType[type];
    forEach(itemPropNames, (propName) => {
      const propChangedFromDefault = meta.nowState[type][id][propName] !== meta.newStateByItemType[type](id)[propName];
      if (propChangedFromDefault) {
        meta.recordedStepEndEffectChanges.itemPropsBool[type][id][propName] = true;
        meta.recordedEffectChanges.itemPropsBool[type][id][propName] = true;
      }
    });
  });
}

export function removeItem(type: ItemType, id: string) {
  if (!meta.willRemoveItemsInfo[type]) meta.willRemoveItemsInfo[type] = {};
  meta.willRemoveItemsInfo[type][id] = true;
  const propPath = `${type}.__added`;

  runWhenAddingAndRemovingItems(() => {
    // removing itemId
    delete meta.nowState[type][id];
    meta.itemIdsByItemType[type] = Object.keys(meta.nowState[type]);
    // delete meta.currentRefs[itemType][itemId]; // now done at the end of update repond
    meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;
    meta.recordedStepEndEffectChanges.somethingChanged = true;
    meta.recordedEffectChanges.itemTypesBool[type] = true;
    meta.recordedEffectChanges.somethingChanged = true;

    meta.recordedPropIdsChangedMap[meta.nowEffectPhase][propPath] = true;
    meta.recordedPropIdsChangedMap.endOfStep[propPath] = true;
  });
}

export function getItemWillBeAdded<T_Type extends ItemType>(type: T_Type, id: string) {
  return !!meta.willAddItemsInfo[type]?.[id];
}

export function getItemWillBeRemoved<T_Type extends ItemType>(type: T_Type, id: string) {
  return !!meta.willRemoveItemsInfo[type]?.[id] || !!(meta.nowState as any)[type][id];
}

export function getItemWillExist<T_Type extends ItemType>(type: T_Type, id: string) {
  return getItemWillBeAdded(type, id) || (!!getState(type, id) as any);
}

// For saving and loading

// Function to selectively get data with only specific props from the repond store, can be used for save data
export function getPartialState_OLD(propsToGet: Partial<ItemPropsByType>) {
  const itemTypes = Object.keys(propsToGet) as Array<keyof ItemPropsByType>;

  if (!meta.didInit) {
    console.warn("getPartialState called before repond was initialized");
    return {};
  }

  const partialState: Partial<AllState> = {};
  for (const itemType of itemTypes) {
    const itemPropNames = propsToGet[itemType]!;
    const itemIds = meta.itemIdsByItemType[itemType];
    const partialItems: Record<string, any> = {};
    for (const itemId of itemIds) {
      const item = getState(itemType, itemId);
      const partialItem: Record<string, any> = {};
      for (const propName of itemPropNames) {
        partialItem[propName] = item[propName];
      }
      partialItems[itemId] = partialItem;
    }
    partialState[itemType] = partialItems as any;
  }
  return partialState as Partial<AllState>;
}

export function getPartialState(propsToGet: PropId[]) {
  const itemType = meta.itemTypeByPropPathId;

  if (!meta.didInit) {
    console.warn("getPartialState called before repond was initialized");
    return {};
  }

  const partialState: Partial<AllState> = {};

  const propsByItemType = {} as Record<ItemType, PropName<ItemType>[]>;

  for (const propId of propsToGet) {
    const itemType = meta.itemTypeByPropPathId[propId];
    if (!itemType) {
      console.log("propId has no item type", propId);
      continue;
    }
    const propName = meta.propKeyByPropPathId[propId] as PropName<ItemType>;
    if (!propsByItemType[itemType]) propsByItemType[itemType] = [];
    propsByItemType[itemType].push(propName);
  }

  const itemTypes = Object.keys(propsByItemType) as ItemType[];

  for (const itemType of itemTypes) {
    const itemIds = meta.itemIdsByItemType[itemType];

    const partialItems: Record<string, any> = {};
    const itemPropNames = propsByItemType[itemType];
    for (const itemId of itemIds) {
      const item = getState(itemType, itemId);
      const partialItem: Record<string, any> = {};
      for (const propName of itemPropNames) {
        partialItem[propName] = item[propName];
      }
      partialItems[itemId] = partialItem;
    }
    partialState[itemType] = partialItems as any;
  }

  return partialState as Partial<AllState>;
}

export function applyState(partialState: Partial<AllState>) {
  if (partialState) applyPatch(getPatch(_getNestedState(), partialState));
}
