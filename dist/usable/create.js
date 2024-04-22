import { createDiffInfo } from "../getStatesDiff";
import { getRepondStructureFromDefaults, makeRefsStructureFromRepondState } from "../getStructureFromDefaults";
import { repondMeta as meta } from "../meta";
import { createRecordedChanges } from "../updating";
import { cloneObjectWithJson } from "../utils";
/*
can 'check' get clearer?
can check have single or arrays for every property, or would that widen all types?
*/
export function initRepond(allStoresInfoOriginal, extraOptions) {
    const { dontSetMeta } = extraOptions ?? {};
    const allStoresInfo = {};
    Object.entries(allStoresInfoOriginal).forEach(([key, value]) => {
        // Remove "Store" from the end of the key, if present
        const newKey = key.replace(/Store$/, "");
        allStoresInfo[newKey] = value;
    });
    const itemTypes = Object.keys(allStoresInfo);
    const stepNamesUntyped = extraOptions?.stepNames ? [...extraOptions.stepNames] : ["default"];
    if (!stepNamesUntyped.includes("default"))
        stepNamesUntyped.push("default");
    const stepNames = [...stepNamesUntyped];
    meta.frameRateTypeOption = extraOptions?.framerate || "full";
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
        prev[key] = allStoresInfo[key].getDefaultState;
        return prev;
    }, {});
    const defaultRefs = itemTypes.reduce((prev, key) => {
        prev[key] = allStoresInfo[key].getDefaultRefs;
        return prev;
    }, {});
    const initialState = itemTypes.reduce((prev, key) => {
        prev[key] = allStoresInfo[key].startStates || {};
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
        createRecordedChanges(meta.recordedEffectChanges);
        createRecordedChanges(meta.recordedStepEndEffectChanges);
        createDiffInfo(meta.diffInfo);
        meta.didInit = true;
    }
}
