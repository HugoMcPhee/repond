import { AllRefs, AllState, DeepReadonly, DefaultRefs, DefaultStates, ItemId, ItemType, RepondCallback, SetRepondState } from "../types";
export declare const getDefaultStates: () => DefaultStates;
export declare const getDefaultRefs: () => DefaultRefs;
export declare const getItemTypes: () => ItemType[];
export declare function getItem<K_Type extends ItemType, T_ItemId extends ItemId<K_Type>>(type: K_Type, id: T_ItemId): [AllState[K_Type][T_ItemId], AllRefs[K_Type][T_ItemId], AllState[K_Type][T_ItemId]];
export declare const getState: () => DeepReadonly<AllState>;
export declare const setState: SetRepondState<AllState>;
export declare function onNextTick(callback: RepondCallback): void;
export declare const getPrevState: () => AllState;
export declare const getRefs: () => AllRefs;
type AddItem_Options<K_Type extends ItemType> = {
    type: K_Type;
    id: string;
    state?: Partial<AllState[K_Type][ItemId<K_Type>]>;
    refs?: Partial<AllRefs[K_Type][ItemId<K_Type>]>;
};
export declare function addItem<K_Type extends ItemType>(addItemOptions: AddItem_Options<K_Type>, callback?: any): void;
export declare function removeItem(itemInfo: {
    type: ItemType;
    id: string;
}): void;
export {};
