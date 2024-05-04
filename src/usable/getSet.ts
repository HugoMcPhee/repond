import { applyPatch, getPatch } from "../usable/patchesAndDiffs";
import { _setState, _addItem, _removeItem } from "../helpers/setting";
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

export const getDefaultStates = (): DefaultStates => meta.defaultStateByItemType as DefaultStates;

export const getDefaultRefs = (): DefaultRefs => meta.defaultRefsByItemType as DefaultRefs;

export const getItemTypes = (): ItemType[] => meta.itemTypeNames;

export function getItem<K_Type extends ItemType, T_ItemId extends ItemId<K_Type>>(type: K_Type, id: T_ItemId) {
  return [(getState() as any)[type][id], getRefs()[type][id], getPrevState()[type][id]] as [
    AllState[K_Type][T_ItemId],
    ReturnType<typeof getRefs>[K_Type][T_ItemId],
    ReturnType<typeof getPrevState>[K_Type][T_ItemId]
  ];
}

export const getState = (): DeepReadonly<AllState> => meta.nowState as DeepReadonly<AllState>;

export const setState: SetRepondState<AllState> = (newState, callback) => _setState(newState, callback);

// Good for running things to be sure the state change is seen
export function onNextTick(callback: RepondCallback) {
  meta.callbacksQue.push(callback);
}

export const getPrevState = (): AllState => meta.prevState as AllState;

export const getRefs = (): AllRefs => meta.nowRefs as AllRefs;

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
  return getItemWillBeAdded(type, id) || !!(getState() as any)[type][id];
}

// Function to selectively get data with only specific props from the repond store, can be used for save data
export function getPartialState(propsToGet: Partial<ItemPropsByType>) {
  const itemTypes = Object.keys(propsToGet) as Array<keyof ItemPropsByType>;
  const state = getState();

  if (!meta.didInit) {
    console.warn("getPartialState called before repond was initialized");
    return {};
  }

  const partialState: Partial<AllState> = {};
  for (const itemType of itemTypes) {
    const itemPropNames = propsToGet[itemType]!;
    const items = state[itemType];
    const itemIds = Object.keys(items);
    const partialItems: Record<string, any> = {};
    for (const itemId of itemIds) {
      const item = items[itemId as keyof typeof items];
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
  if (partialState) applyPatch(getPatch(getState(), partialState));
}

export function getStatePathState<T_ItemType extends ItemType, T_PropName extends PropName<T_ItemType>>(
  path: StatePath<T_ItemType, T_PropName>
) {
  const [itemType, id, propName] = path;
  return getState()[itemType][id][propName];
}
