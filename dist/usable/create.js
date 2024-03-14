import { makeCopyStatesFunction } from "../copyStates";
import { createDiffInfo, makeGetStatesDiffFunction } from "../getStatesDiff";
import { getRepondStructureFromDefaults, makeRefsStructureFromRepondState } from "../getStructureFromDefaults";
import { repondMeta as meta } from "../meta";
import { createRecordedChanges } from "../updating";
import { cloneObjectWithJson } from "../utils";
/*
can 'check' get clearer?
can check have single or arrays for every property, or would that widen all types?
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
        meta.nowStepIndex = 0;
        meta.nowStepName = stepNames[meta.nowStepIndex];
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
        meta.itemIdsByItemType[key] = Object.keys(prev[key]);
        return prev;
    }, {});
    // ------------------------------------------------
    // Setup Repond
    // ------------------------------------------------
    if (!dontSetMeta) {
        const nowState = cloneObjectWithJson(initialState);
        const prevState = cloneObjectWithJson(initialState);
        // store initialState and set currentState
        meta.initialState = initialState;
        meta.nowState = nowState;
        meta.prevState = prevState;
        meta.defaultStateByItemType = defaultStates;
        meta.defaultRefsByItemType = defaultRefs;
        getRepondStructureFromDefaults(); // sets itemTypeNames and propertyNamesByItemType
        makeRefsStructureFromRepondState(); // sets currenRepondRefs based on itemIds from repond state
        meta.copyStates = makeCopyStatesFunction("copy");
        meta.getStatesDiff = makeGetStatesDiffFunction();
        meta.mergeStates = makeCopyStatesFunction("merge");
        createRecordedChanges(meta.recordedEffectChanges);
        createRecordedChanges(meta.recordedStepEndEffectChanges);
        createDiffInfo(meta.diffInfo);
    }
}
