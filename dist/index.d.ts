import { AllState, ItemType } from "./types";
export * from "./declarations";
export * from "./types";
export { initRepond } from "./usable/create";
export { applyPatch, applyPatchHere, combineDiffs, combinePatches, combineTwoDiffs, combineTwoPatches, getDiff, getDiffFromPatches, getPatch, getPatchAndReversed, getPatchesFromDiff, getReversePatch, makeEmptyDiff, makeEmptyPatch, makeMinimalPatch, removePartialPatch, } from "./usable/patchesAndDiffs";
export { useStore, useStoreEffect, useStoreItem, useStoreItemEffect, useStoreItemPropsEffect } from "./usable/hooks";
export { addItem, getItem, getPrevState, getRefs, getState, removeItem, setState, onNextTick, getItemWillBeAdded, getItemWillBeRemoved, getItemWillExist, getPartialState, applyState, } from "./usable/getSet";
export { initEffectGroups, makeEffect, makeItemEffect, makeEffects, runEffect, runEffectsGroup, startAllEffectsGroups as startAllEffectGroups, startEffect, startEffectsGroup, startNewEffect, startNewItemEffect, stopAllEffectsGroups as stopAllEffectGroups, stopEffect, stopEffectsGroup, stopNewEffect, } from "./usable/effects";
export { makeParamEffects, startParamEffectsGroup, runParamEffect, initParamEffectGroups, runParamEffectsGroup, startParamEffect, stopParamEffect, stopParamEffectsGroup, } from "./usable/paramEffects";
export { makeNestedEffectsMaker, makeEffectsMaker, makeLeaveEffectsMaker, makeNestedLeaveEffectsMaker, } from "./usable/effectsMakers";
export type InitialItemsState<T_defaultStateFunctionType extends (...args: any) => any> = {
    [itemId: string]: ReturnType<T_defaultStateFunctionType>;
};
export type ItemState<T_ItemType extends ItemType> = AllState[T_ItemType][keyof AllState[T_ItemType]];
