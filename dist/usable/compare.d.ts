import { AllState, GetPartialState, ItemName, ItemType } from "../types";
type ItemNamesByType = {
    [K_Type in ItemType]: ItemName<K_Type>[];
};
type StatesPatch = {
    changed: GetPartialState<AllState>;
    added: Partial<ItemNamesByType>;
    removed: Partial<ItemNamesByType>;
};
type StatesDiff = {
    changedNext: GetPartialState<AllState>;
    changedPrev: GetPartialState<AllState>;
    added: Partial<ItemNamesByType>;
    removed: Partial<ItemNamesByType>;
};
export declare function makeEmptyPatch(): StatesPatch;
export declare function makeEmptyDiff(): StatesDiff;
export declare function applyPatch(patch: StatesPatch): void;
export declare function applyPatchHere(newStates: GetPartialState<AllState>, patch: StatesPatch): void;
export declare function getPatch(prevState: GetPartialState<AllState>, newState: GetPartialState<AllState>): StatesPatch;
export declare function getPatchAndReversed(prevState: GetPartialState<AllState>, newState: GetPartialState<AllState>): StatesPatch[];
export declare function getReversePatch(partialState: GetPartialState<AllState>, newPatch: StatesPatch): StatesPatch;
export declare function combineTwoPatches(prevPatch: StatesPatch, newPatch: StatesPatch): StatesPatch;
export declare function combinePatches(patchesArray: StatesPatch[]): StatesPatch;
export declare function makeMinimalPatch(currentStates: GetPartialState<AllState>, thePatch: StatesPatch): void;
export declare function removePartialPatch(thePatch: StatesPatch, patchToRemove: StatesPatch): void;
export declare function getDiff(prevState: GetPartialState<AllState>, newState: GetPartialState<AllState>): StatesDiff;
export declare function getDiffFromPatches(forwardPatch: StatesPatch, reversePatch: StatesPatch): StatesDiff;
export declare function getPatchesFromDiff(theDiff: StatesDiff): [StatesPatch, StatesPatch];
export declare function combineTwoDiffs(prevDiff: StatesDiff, newDiff: StatesDiff): StatesDiff;
export declare function combineDiffs(diffsArray: StatesDiff[]): StatesDiff;
export {};
