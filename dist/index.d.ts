import { initRepond as initRepond } from "./create";
export * from "./declarations";
export * from "./create";
export type InitialItemsState<T_defaultStateFunctionType extends (...args: any) => any> = {
    [itemName: string]: ReturnType<T_defaultStateFunctionType>;
};
export type StoreHelperTypes<T_GetState extends () => {
    [key: string]: {
        [key: string]: any;
    };
}, T_GetRefs extends () => {
    [key: string]: {
        [key: string]: any;
    };
}, T_ItemType extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>> = {
    ItemType: keyof ReturnType<T_GetState>;
    AllItemsState: ReturnType<T_GetState>[T_ItemType];
    ItemState: ReturnType<T_GetState>[T_ItemType][keyof ReturnType<T_GetState>[T_ItemType]];
    ItemRefs: ReturnType<T_GetRefs>[T_ItemType][keyof ReturnType<T_GetRefs>[T_ItemType]];
};
export declare function makeInitialState({ itemPrefix, itemAmount, defaultState, }: {
    itemPrefix: string;
    itemAmount: number;
    defaultState: () => any;
}): any;
export { initRepond as makeRepond };
