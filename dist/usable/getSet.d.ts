import { AllRefs, AllState, DeepReadonly, DefaultRefs, DefaultStates, ItemId, ItemPropsByType, ItemType, PropName, RepondCallback, SetRepondState, StatePath } from "../types";
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
export declare function getItemWillBeAdded<K_Type extends ItemType>(type: K_Type, id: string): boolean;
export declare function getItemWillBeRemoved<K_Type extends ItemType>(type: K_Type, id: string): boolean;
export declare function getItemWillExist<K_Type extends ItemType>(type: K_Type, id: string): boolean;
export declare function getPartialState(propsToGet: Partial<ItemPropsByType>): Partial<AllState>;
export declare function applyState(partialState: Partial<AllState>): void;
export declare function getStateAtPath<T_ItemType extends ItemType>(path: StatePath<T_ItemType>): {
    readonly [x: string]: {
        readonly [x: string]: any;
    };
    readonly [x: number]: {
        readonly [x: string]: any;
    };
}[T_ItemType][import("../types").ExtendsString<import("../types").KeysOfUnion<AllState[T_ItemType]>>][PropName<T_ItemType>];
export {};
