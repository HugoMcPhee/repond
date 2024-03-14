import { _setState, _addItem, _removeItem } from "../helpers/setting";
import { repondMeta as meta } from "../meta";
import {
  AllRefs,
  AllState,
  DeepReadonly,
  DefaultRefs,
  DefaultStates,
  ItemId,
  ItemType,
  RepondCallback,
  SetRepondState,
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
