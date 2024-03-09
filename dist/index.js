export * from "./declarations";
export * from "./types";
export { initRepond } from "./usable/create";
export { applyPatch, applyPatchHere, combineDiffs, combinePatches, combineTwoDiffs, combineTwoPatches, getDiff, getDiffFromPatches, getPatch, getPatchAndReversed, getPatchesFromDiff, getReversePatch, makeEmptyDiff, makeEmptyPatch, makeMinimalPatch, removePartialPatch, } from "./usable/compare";
export { useStore, useStoreEffect, useStoreItem, useStoreItemEffect, useStoreItemPropsEffect } from "./usable/hooks";
export { addItem, getItem, getPrevState, getRefs, getState, removeItem, setState, onNextTick } from "./usable/getSet";
export { initGroupedEffects, makeEffect, makeItemEffect, makeEffects, runEffect, runGroupEffects, startAllGroupsEffects as startAllGroupedEffects, startEffect, startGroupEffects, startNewEffect, startNewItemEffect, stopAllGroupsEffects as stopAllGroupedEffects, stopEffect, stopGroupEffects, stopNewEffect, } from "./usable/effects";
// Unique effects helpers
// TODO update these, but for now keep these so prendy keeps working?
export { makeDynamicRules, makeLeaveRuleMaker, makeNestedLeaveRuleMaker, makeNestedRuleMaker, makeRuleMaker, makeRules, } from "./usable/deprecatedRules";
// for generating items with names
export function makeInitialState({ itemPrefix, itemAmount, defaultState, }) {
    const newInitialState = {};
    // NOTE nowehere's keeping track of the item name number
    for (var index = 0; index < itemAmount; index++) {
        const itemId = `${itemPrefix}${index}`;
        newInitialState[itemId] = defaultState();
    }
    return newInitialState;
}
