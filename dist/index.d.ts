export * from "./declarations";
export * from "./types";
export { initRepond } from "./usable/create";
export { applyPatch, applyPatchHere, combineDiffs, combinePatches, combineTwoDiffs, combineTwoPatches, getDiff, getDiffFromPatches, getPatch, getPatchAndReversed, getPatchesFromDiff, getReversePatch, makeEmptyDiff, makeEmptyPatch, makeMinimalPatch, removePartialPatch, } from "./usable/compare";
export { useStore, useStoreEffect, useStoreItem, useStoreItemEffect, useStoreItemPropsEffect } from "./usable/hooks";
export { addItem, getItem, getPrevState, getRefs, getState, removeItem, setState, onNextTick } from "./usable/getSet";
export { initGroupedEffects, makeEffect, makeItemEffect, makeEffects, runEffect, runGroupEffects, startAllGroupsEffects as startAllGroupedEffects, startEffect, startGroupEffects, startNewEffect, startNewItemEffect, stopAllGroupsEffects as stopAllGroupedEffects, stopEffect, stopGroupEffects, stopNewEffect, } from "./usable/effects";
export { makeDynamicRules, makeLeaveRuleMaker, makeNestedLeaveRuleMaker, makeNestedRuleMaker, makeRuleMaker, makeRules, } from "./usable/deprecatedRules";
export type InitialItemsState<T_defaultStateFunctionType extends (...args: any) => any> = {
    [itemId: string]: ReturnType<T_defaultStateFunctionType>;
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
