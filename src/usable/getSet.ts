// -----------------------------------------------------------------
// main functions
// -----------------------------------------------------------------

import meta from "../meta";
import { _addItem, _removeItem, _setState } from "../settingInternal";
import {
  AddItem_OptionsUntyped,
  AllRefs,
  AllState,
  DeepReadonly,
  DefaultRefs,
  DefaultStates,
  ItemName,
  ItemType,
  RepondCallback,
  SetRepondState,
} from "../types";

export const getDefaultStates = (): DefaultStates => meta.defaultStateByItemType as DefaultStates;

export const getDefaultRefs = (): DefaultRefs => meta.defaultRefsByItemType as DefaultRefs;

export const getItemTypes = (): ItemType[] => meta.itemTypeNames;

export function getItem<K_Type extends ItemType, T_ItemName extends ItemName<K_Type>>(type: K_Type, name: T_ItemName) {
  return [(getState() as any)[type][name], getRefs()[type][name], getPrevState()[type][name]] as [
    AllState[K_Type][T_ItemName],
    ReturnType<typeof getRefs>[K_Type][T_ItemName],
    ReturnType<typeof getPrevState>[K_Type][T_ItemName]
  ];
}

export const getState = (): DeepReadonly<AllState> => meta.currentState as DeepReadonly<AllState>;

export const setState: SetRepondState<AllState> = (newState, callback) => _setState(newState, callback);

export function onNextTick(callback: RepondCallback) {
  meta.callbacksQue.push(callback); // NOTE WARNING This used to be callforwardsQue
}

export const getPrevState = (): AllState => meta.previousState as AllState;

export const getRefs = (): AllRefs => meta.currentRefs as AllRefs;

type AddItem_Options<K_Type extends ItemType> = {
  type: K_Type;
  name: string;
  state?: Partial<AllState[K_Type][ItemName<K_Type>]>;
  refs?: Partial<AllRefs[K_Type][ItemName<K_Type>]>;
};
export function addItem<K_Type extends ItemType>(addItemOptions: AddItem_Options<K_Type>, callback?: any) {
  _addItem(addItemOptions as AddItem_OptionsUntyped<AllState, AllRefs, K_Type>, callback);
}

export function removeItem(itemInfo: { type: ItemType; name: string }) {
  _removeItem(itemInfo as { type: string; name: string });
}
