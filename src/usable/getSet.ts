import { applyPatch, getPatch } from "../usable/patchesAndDiffs";
import { _setState, _addItem, _removeItem, _setState_NEW } from "../helpers/setting";
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
  PropName,
  RepondCallback,
  SetRepondState,
  StatePath,
} from "../types";
import { runWhenDoingSetStates } from "../helpers/runWhens";

export const getDefaultStates = (): DefaultStates => meta.defaultStateByItemType as DefaultStates;

export const getDefaultRefs = (): DefaultRefs => meta.defaultRefsByItemType as DefaultRefs;

export const getItemTypes = (): ItemType[] => meta.itemTypeNames;

export const getItemIds = (kind: ItemType): string[] => meta.itemIdsByItemType[kind];

export const getState_OLD = (): DeepReadonly<AllState> => meta.nowState as DeepReadonly<AllState>;
// export const getState = (kind: string, itemId: string): DeepReadonly<AllState> => meta.nowState as DeepReadonly<AllState>;
export const getState = <T_Kind extends ItemType>(
  kind: T_Kind,
  itemId?: string
): AllState[T_Kind][keyof AllState[T_Kind]] => {
  if (!itemId) {
    const foundItemId = meta.itemIdsByItemType?.[kind]?.[0];
    if (!foundItemId) {
      console.warn(`No itemId provided for ${kind}, using first found itemId: ${foundItemId}`);
    }
    return meta.nowState[kind][foundItemId];
  }
  return meta.nowState[kind][itemId];
};

// export const setState: SetRepondState<AllState> = (newState, callback) => _setState(newState, callback);
export const setState_OLD = _setState;
export const setState = _setState_NEW;

export const whenSettingStates = runWhenDoingSetStates;

// Good for running things to be sure the state change is seen
export function onNextTick(callback?: RepondCallback) {
  if (callback) meta.callbacksQue.push(callback);
}

export const getPrevState_OLD = (): AllState => meta.prevState as AllState;

export const getPrevState = <T_Kind extends ItemType>(
  kind: T_Kind,
  itemId?: string
): AllState[T_Kind][keyof AllState[T_Kind]] => {
  if (!itemId) {
    // const foundItemId = meta.prevItemIdsByItemType?.[kind]?.[0];
    const foundItemId = Object.keys(meta.prevState?.[kind] ?? {})?.[0];
    if (!foundItemId) {
      console.warn(`No itemId provided for ${kind}, using first found itemId: ${foundItemId} (prevState)`);
    }
    return meta.prevState?.[kind]?.[foundItemId];
  }
  return meta.prevState[kind][itemId];
};

export const getRefs_OLD = (): AllRefs => meta.nowRefs as AllRefs;

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
export function addItem<K_Type extends ItemType>(addItemOptions: AddItem_Options<K_Type>, callback?: any) {
  _addItem(addItemOptions as AddItem_OptionsUntyped<AllState, AllRefs, K_Type>, callback);
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
  // const state = getState_OLD();

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
  if (partialState) applyPatch(getPatch(getState_OLD(), partialState));
}
