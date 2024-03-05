import { AllRefs, AllState, DeepReadonly, DefaultRefs, DefaultStates, ItemName, ItemType, RepondCallback, SetRepondState } from "../types";
export declare const getDefaultStates: () => DefaultStates;
export declare const getDefaultRefs: () => DefaultRefs;
export declare const getItemTypes: () => ItemType[];
export declare function getItem<K_Type extends ItemType, T_ItemName extends ItemName<K_Type>>(type: K_Type, name: T_ItemName): [AllState[K_Type][T_ItemName], AllRefs[K_Type][T_ItemName], AllState[K_Type][T_ItemName]];
export declare const getState: () => DeepReadonly<AllState>;
export declare const setState: SetRepondState<AllState>;
export declare function onNextTick(callback: RepondCallback): void;
export declare const getPrevState: () => AllState;
export declare const getRefs: () => AllRefs;
type AddItem_Options<K_Type extends ItemType> = {
    type: K_Type;
    name: string;
    state?: Partial<AllState[K_Type][ItemName<K_Type>]>;
    refs?: Partial<AllRefs[K_Type][ItemName<K_Type>]>;
};
export declare function addItem<K_Type extends ItemType>(addItemOptions: AddItem_Options<K_Type>, callback?: any): void;
export declare function removeItem(itemInfo: {
    type: ItemType;
    name: string;
}): void;
export {};
