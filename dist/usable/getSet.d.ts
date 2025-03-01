import { AllRefs, AllState, GetNewRefsByType, GetNewStateByType, ItemId, ItemPropsByType, ItemType, PropId, PropValueFromPropId, RepondCallback } from "../types";
export declare function setState<T extends PropId>(propPath: T, newValue: PropValueFromPropId<T>, itemId?: string): void;
export declare function setNestedState(newState: Partial<AllState>): void;
export declare const getNewState: <T_Type extends string>(itemType: T_Type) => (itemId?: any) => any;
export declare const getNewRefs: <T_Type extends string>(itemType: T_Type) => (itemId?: any, type?: any) => any;
export declare const getItemTypes: () => ItemType[];
export declare const getItemIds: (itemType: ItemType) => string[];
export declare const getState: <T_Type extends string>(itemType: T_Type, itemId?: string) => any;
export declare function onNextTick(callback?: RepondCallback): void;
export declare const getPrevState: <T_ItemType extends string>(itemType: T_ItemType, itemId?: string) => any;
export declare const getRefs: <T_ItemType extends string>(itemType: T_ItemType, itemId?: string) => any;
export declare function addItem<T_ItemType extends ItemType>(type: T_ItemType, id: string, state?: Partial<AllState[T_ItemType][ItemId]>, refs?: Partial<AllRefs[T_ItemType][ItemId]>): void;
export declare function removeItem(type: ItemType, id: string): void;
export declare function getItemWillBeAdded<T_Type extends ItemType>(type: T_Type, id: string): boolean;
export declare function getItemWillBeRemoved<T_Type extends ItemType>(type: T_Type, id: string): boolean;
export declare function getItemWillExist<T_Type extends ItemType>(type: T_Type, id: string): any;
export declare function getPartialState_OLD(propsToGet: Partial<ItemPropsByType>): Partial<AllState>;
export declare function getPartialState(propsToGet: PropId[]): Partial<AllState>;
export declare function applyState(partialState: Partial<AllState>): void;
