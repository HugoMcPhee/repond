import { makeCopyStatesFunction } from "../copyStates";
import { createDiffInfo, makeGetStatesDiffFunction } from "../getStatesDiff";
import { getRepondStructureFromDefaults } from "../getStructureFromDefaults";
import meta from "../meta";
import { createRecordedChanges } from "../updating";
import { cloneObjectWithJson, makeRefsStructureFromRepondState } from "../utils";
// ChangeToCheck
/*
Listener_Check
AnyChangeRule_Check
ItemRule_Check
OneItem_Check
*/
/*
can 'check' get clearer?
can check have single or arrays for every property, or would that widen all types?
*/
// NOTE could move these types to a types file?
/*

, T_ItemType, T_State

,
T_ItemType extends string | number | symbol,
T_State extends Record<any, any>,
T_Refs extends Record<any, any>,
T_StepName extends string,

*/
export function initRepond(allInfo, extraOptions) {
    const { dontSetMeta } = extraOptions ?? {};
    const itemTypes = Object.keys(allInfo);
    const stepNamesUntyped = extraOptions?.stepNames ? [...extraOptions.stepNames] : ["default"];
    if (!stepNamesUntyped.includes("default"))
        stepNamesUntyped.push("default");
    const stepNames = [...stepNamesUntyped];
    meta.frameRateTypeOption = extraOptions?.framerate || "auto";
    if (meta.frameRateTypeOption === "full")
        meta.frameRateType = "full";
    else if (meta.frameRateTypeOption === "half")
        meta.frameRateType = "half";
    else if (meta.frameRateTypeOption === "auto")
        meta.frameRateType = "full";
    if (!dontSetMeta) {
        meta.stepNames = stepNames;
        meta.currentStepIndex = 0;
        meta.currentStepName = stepNames[meta.currentStepIndex];
    }
    // ReturnType<T_AllInfo[K_Type]["state"]> //
    const defaultStates = itemTypes.reduce((prev, key) => {
        prev[key] = allInfo[key].state;
        return prev;
    }, {});
    const defaultRefs = itemTypes.reduce((prev, key) => {
        prev[key] = allInfo[key].refs;
        return prev;
    }, {});
    const initialState = itemTypes.reduce((prev, key) => {
        prev[key] = allInfo[key].startStates || {};
        meta.itemNamesByItemType[key] = Object.keys(prev[key]);
        return prev;
    }, {});
    // ------------------------------------------------
    // Setup Repond
    // ------------------------------------------------
    if (!dontSetMeta) {
        const currentState = cloneObjectWithJson(initialState);
        const previousState = cloneObjectWithJson(initialState);
        // store initialState and set currentState
        meta.initialState = initialState;
        meta.currentState = currentState;
        meta.previousState = previousState;
        meta.defaultStateByItemType = defaultStates;
        meta.defaultRefsByItemType = defaultRefs;
        getRepondStructureFromDefaults(); // sets itemTypeNames and propertyNamesByItemType
        makeRefsStructureFromRepondState(); // sets currenRepondRefs based on itemNames from repond state
        meta.copyStates = makeCopyStatesFunction();
        meta.getStatesDiff = makeGetStatesDiffFunction();
        meta.mergeStates = makeCopyStatesFunction("merge");
        createRecordedChanges(meta.recordedEffectChanges);
        createRecordedChanges(meta.recordedStepEndEffectChanges);
        createDiffInfo(meta.diffInfo);
    }
}
