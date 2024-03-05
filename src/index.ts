export * from "./declarations";
export * from "./types";

export { initRepond } from "./usable/create";
export {
  applyPatch,
  applyPatchHere,
  combineDiffs,
  combinePatches,
  combineTwoDiffs,
  combineTwoPatches,
  getDiff,
  getDiffFromPatches,
  getPatch,
  getPatchAndReversed,
  getPatchesFromDiff,
  getReversePatch,
  makeEmptyDiff,
  makeEmptyPatch,
  makeMinimalPatch,
  removePartialPatch,
} from "./usable/compare";

export { useStore, useStoreEffect, useStoreItem, useStoreItemEffect, useStoreItemPropsEffect } from "./usable/hooks";
export { addItem, getItem, getPrevState, getRefs, getState, removeItem, setState, onNextTick } from "./usable/getSet";

export {
  initGroupedEffects,
  makeEffects,
  runEffect,
  runGroupEffects,
  startAllGroupedEffects,
  startEffect,
  startGroupEffects,
  startNewEffect,
  startNewItemEffect,
  stopAllGroupedEffects,
  stopEffect,
  stopGroupEffects,
  stopNewEffect,
} from "./usable/effects";

// Unique effects helpers
// TODO update these, but for now keep these so prendy keeps working?
export {
  makeDynamicRules,
  makeLeaveRuleMaker,
  makeNestedLeaveRuleMaker,
  makeNestedRuleMaker,
  makeRuleMaker,
  makeRules,
} from "./usable/deprecatedRules";

export type InitialItemsState<T_defaultStateFunctionType extends (...args: any) => any> = {
  [itemName: string]: ReturnType<T_defaultStateFunctionType>; // : AtLeastOne<T>;
};

// TODO remove these
export type StoreHelperTypes<
  T_GetState extends () => { [key: string]: { [key: string]: any } },
  T_GetRefs extends () => { [key: string]: { [key: string]: any } },
  T_ItemType extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>
> = {
  ItemType: keyof ReturnType<T_GetState>;
  AllItemsState: ReturnType<T_GetState>[T_ItemType];
  ItemState: ReturnType<T_GetState>[T_ItemType][keyof ReturnType<T_GetState>[T_ItemType]];
  ItemRefs: ReturnType<T_GetRefs>[T_ItemType][keyof ReturnType<T_GetRefs>[T_ItemType]];
};

// for generating items with names
export function makeInitialState({
  itemPrefix,
  itemAmount,
  defaultState,
}: {
  itemPrefix: string;
  itemAmount: number;
  defaultState: () => any;
}) {
  const newInitialState: any = {};
  // NOTE nowehere's keeping track of the item name number
  for (var index = 0; index < itemAmount; index++) {
    const itemId = `${itemPrefix}${index}`;
    newInitialState[itemId] = defaultState();
  }
  return newInitialState;
}
