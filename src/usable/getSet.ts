import { forEach } from "chootils/dist/loops";
import { repondMeta as meta } from "../meta";
import {
  AllRefs,
  AllState,
  DeepReadonly,
  DefaultRefs,
  DefaultStates,
  ItemId,
  ItemPropsByType,
  ItemType,
  RepondCallback,
} from "../types";
import { applyPatch, getPatch } from "../usable/patchesAndDiffs";
import { runWhenAddingAndRemovingItems, whenSettingStates } from "../helpers/runWhens";
import { mergeToState } from "../copyStates";

export function setState(propPath: string, newValue: any, itemId?: string) {
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

    const storeType = meta.itemTypeByPropPathId[propPath];
    const propKey = meta.propKeyByPropPathId[propPath];
    let foundItemId = itemId || meta.itemIdsByItemType[storeType]?.[0];
    if (!foundItemId) {
      foundItemId = Object.keys(meta.nowState[storeType] ?? {})[0];
      console.warn(
        `${propPath}No itemId found for setState ${storeType}, using first found itemId: ${foundItemId} from Object keys`
      );
    }

    mergeToState(
      storeType,
      propKey,
      newValue,
      foundItemId,
      meta.nowState,
      meta.nowMetaPhase === "runningEffects" ? meta.recordedEffectChanges : meta.recordedStepEndEffectChanges,
      meta.recordedStepEndEffectChanges
    );
  });
}

export function setNestedState(newState: any) {
  whenSettingStates(() => {
    if (!newState) return;
    const itemTypes = Object.keys(newState);
    forEach(itemTypes, (itemType) => {
      const itemIds = Object.keys(newState[itemType]);
      forEach(itemIds, (itemId) => {
        const itemProps = Object.keys(newState[itemType][itemId]);
        forEach(itemProps, (propName) => {
          const newValue = newState[itemType][itemId][propName];
          setState(`${itemType}.${propName}`, newValue, itemId);
        });
      });
    });
  });
}

export function _removeItem({ type, id }: { type: string; id: string }, callback?: any) {
  if (!meta.willRemoveItemsInfo[type]) meta.willRemoveItemsInfo[type] = {};
  meta.willRemoveItemsInfo[type][id] = true;
  runWhenAddingAndRemovingItems(() => {
    // removing itemId
    delete meta.nowState[type][id];
    meta.itemIdsByItemType[type] = Object.keys(meta.nowState[type]);
    // delete meta.currentRefs[itemType][itemId]; // now done at the end of update repond
    meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;
    meta.recordedStepEndEffectChanges.somethingChanged = true;
    meta.recordedEffectChanges.itemTypesBool[type] = true;
    meta.recordedEffectChanges.somethingChanged = true;
  });
}

export function _addItem({ type, id, state, refs }: { type: string; id: string; state?: any; refs?: any }) {
  if (!meta.willAddItemsInfo[type]) meta.willAddItemsInfo[type] = {};
  meta.willAddItemsInfo[type][id] = true;
  runWhenAddingAndRemovingItems(() => {
    meta.nowState[type][id] = {
      ...meta.defaultStateByItemType[type](id),
      ...(state || {}),
    };
    meta.nowRefs[type][id] = {
      ...meta.defaultRefsByItemType[type](id, meta.nowState[id]),
      ...(refs || {}),
    };
    meta.itemIdsByItemType[type].push(id);
    meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;

    // TODO Figure out if adding an item should record the properties as changed or not?

    meta.recordedStepEndEffectChanges.itemPropsBool[type][id] = {};
    meta.recordedEffectChanges.itemPropsBool[type][id] = {};

    meta.diffInfo.propsChanged[type][id] = [];
    meta.diffInfo.propsChangedBool[type][id] = {};

    meta.recordedStepEndEffectChanges.itemIdsBool[type][id] = true;
    meta.recordedStepEndEffectChanges.somethingChanged = true;
    meta.recordedEffectChanges.itemTypesBool[type] = true;

    meta.recordedEffectChanges.itemIdsBool[type][id] = true;
    meta.recordedEffectChanges.somethingChanged = true;

    // NOTE new items with props different to the defaults props are recorded as changed
    const itemPropNames = meta.propNamesByItemType[type];
    forEach(itemPropNames, (propName) => {
      const propChangedFromDefault =
        meta.nowState[type][id][propName] !== meta.defaultStateByItemType[type](id)[propName];
      if (propChangedFromDefault) {
        meta.recordedStepEndEffectChanges.itemPropsBool[type][id][propName] = true;
        meta.recordedEffectChanges.itemPropsBool[type][id][propName] = true;
      }
    });
  });
}

export const getDefaultStates = (): DefaultStates => meta.defaultStateByItemType as DefaultStates;

export const getDefaultRefs = (): DefaultRefs => meta.defaultRefsByItemType as DefaultRefs;

export const getItemTypes = (): ItemType[] => meta.itemTypeNames;

export const getItemIds = (kind: ItemType): string[] => meta.itemIdsByItemType[kind];

const _getNestedState = (): DeepReadonly<AllState> => meta.nowState as DeepReadonly<AllState>;
// export const getState = (kind: string, itemId: string): DeepReadonly<AllState> => meta.nowState as DeepReadonly<AllState>;

export const getState = <T_Kind extends ItemType>(
  kind: T_Kind,
  itemId?: string
): AllState[T_Kind][keyof AllState[T_Kind]] => {
  if (!itemId) {
    const foundItemId = meta.itemIdsByItemType?.[kind]?.[0];
    if (!foundItemId) {
      console.warn(`(getState) No itemId provided for ${kind}, using first found itemId: ${foundItemId}`);
    }
    return meta.nowState[kind][foundItemId];
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
  return meta.nowState[kind]?.[itemId];
};

// export const setState: SetRepondState<AllState> = (newState) => _setState(newState);

// Good for running things to be sure the state change is seen
export function onNextTick(callback?: RepondCallback) {
  if (callback) meta.nextTickQueue.push(callback);
}

export const getPrevState = <T_Kind extends ItemType>(
  kind: T_Kind,
  itemId?: string
): AllState[T_Kind][keyof AllState[T_Kind]] => {
  if (!itemId) {
    // const foundItemId = meta.prevItemIdsByItemType?.[kind]?.[0];
    const foundItemId = Object.keys(meta.prevState?.[kind] ?? {})?.[0] ?? meta.itemIdsByItemType?.[kind]?.[0];
    if (!foundItemId) {
      // console.warn(`(getPrevState) No itemId provided for ${kind}, using first found itemId: ${foundItemId}`);
    }
    return meta.prevState?.[kind]?.[foundItemId] ?? meta.nowState[kind][foundItemId];
  }
  if (!meta.prevState[kind]?.[itemId]) {
    // console.warn(`(getPrevState) No prevState found for ${kind} with id ${itemId} (using nowState instead)`);
    return meta.nowState[kind][itemId];
  }
  return meta.prevState[kind][itemId];
};

export const getRefs = <T_Kind extends ItemType>(
  kind: T_Kind,
  itemId?: string
): AllState[T_Kind][keyof AllState[T_Kind]] => {
  if (!itemId) {
    const foundItemId = meta.itemIdsByItemType?.[kind]?.[0];
    if (!foundItemId) {
      console.warn(`(getRefs) No itemId provided for ${kind}, using first found itemId: ${foundItemId}`);
    }
    return meta.nowRefs[kind][foundItemId];
  }
  if (meta.nowRefs?.[kind]?.[itemId] === undefined) {
    console.warn(`(getRefs) No refs found for ${kind} with id ${itemId}`);
  }
  return meta.nowRefs[kind][itemId];
};

type AddItem_OptionsUntyped<T_State extends Record<any, any>, T_Refs extends Record<any, any>, T_TypeName> = {
  type: string;
  id: string;
  state?: Partial<NonNullable<T_State[T_TypeName]>[keyof T_State[keyof T_State]]>;
  refs?: Partial<NonNullable<T_Refs[T_TypeName]>[keyof T_Refs[keyof T_Refs]]>;
};

type AddItem_Options<K_Type extends ItemType> = {
  type: K_Type;
  id: string;
  state?: Partial<AllState[K_Type][ItemId<K_Type>]>;
  refs?: Partial<AllRefs[K_Type][ItemId<K_Type>]>;
};
export function addItem<K_Type extends ItemType>(addItemOptions: AddItem_Options<K_Type>) {
  _addItem(addItemOptions as AddItem_OptionsUntyped<AllState, AllRefs, K_Type>);
}

export function removeItem(itemInfo: { type: ItemType; id: string }) {
  _removeItem(itemInfo as { type: string; id: string });
}

export function getItemWillBeAdded<K_Type extends ItemType>(type: K_Type, id: string) {
  return !!meta.willAddItemsInfo[type]?.[id];
}

export function getItemWillBeRemoved<K_Type extends ItemType>(type: K_Type, id: string) {
  return !!meta.willRemoveItemsInfo[type]?.[id] || !!(meta.nowState as any)[type][id];
}

export function getItemWillExist<K_Type extends ItemType>(type: K_Type, id: string) {
  return getItemWillBeAdded(type, id) || (!!getState(type, id) as any);
}

// Function to selectively get data with only specific props from the repond store, can be used for save data
export function getPartialState(propsToGet: Partial<ItemPropsByType>) {
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

export function applyState(partialState: Partial<AllState>) {
  if (partialState) applyPatch(getPatch(_getNestedState(), partialState));
}
