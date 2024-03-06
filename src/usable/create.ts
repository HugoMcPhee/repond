import { makeCopyStatesFunction } from "../copyStates";
import { createDiffInfo, makeGetStatesDiffFunction } from "../getStatesDiff";
import { getRepondStructureFromDefaults } from "../getStructureFromDefaults";
import meta from "../meta";
import { AllState, DefaultRefs, DefaultStates, ItemType, StartStatesItemName, StepName } from "../types";
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

export function initRepond<
  T_AllInfo extends {
    [StoreName: string]: {
      state: (itemName: any) => any;
      refs: (itemName: any, type: any) => any;
      startStates?: Record<any, any>;
    };
  },
  T_ItemType extends keyof T_AllInfo,
  // T_ItemType extends keyof T_AllInfo,
  T_StepNamesParam extends Readonly<string[]>
  // T_StepNamesParam extends RepondTypes["StepNames"] = RepondTypes["StepNames"]
>(
  allInfo: T_AllInfo,
  extraOptions?: {
    stepNames: T_StepNamesParam;
    dontSetMeta?: boolean; // when only wanting to use makeRepond for the types
    framerate?: "full" | "half" | "auto";
  }
) {
  const { dontSetMeta } = extraOptions ?? {};

  const itemTypes = Object.keys(allInfo) as unknown as Readonly<ItemType[]>;

  const stepNamesUntyped = extraOptions?.stepNames ? [...extraOptions.stepNames] : ["default"];
  if (!stepNamesUntyped.includes("default")) stepNamesUntyped.push("default");

  const stepNames: Readonly<StepName[]> = [...stepNamesUntyped];

  meta.frameRateTypeOption = extraOptions?.framerate || "auto";
  if (meta.frameRateTypeOption === "full") meta.frameRateType = "full";
  else if (meta.frameRateTypeOption === "half") meta.frameRateType = "half";
  else if (meta.frameRateTypeOption === "auto") meta.frameRateType = "full";

  if (!dontSetMeta) {
    meta.stepNames = stepNames;
    meta.currentStepIndex = 0;
    meta.currentStepName = stepNames[meta.currentStepIndex];
  }

  // ReturnType<T_AllInfo[K_Type]["state"]> //

  const defaultStates: DefaultStates = itemTypes.reduce((prev: any, key) => {
    prev[key] = allInfo[key].state;
    return prev;
  }, {});
  const defaultRefs: DefaultRefs = itemTypes.reduce((prev: any, key) => {
    prev[key] = allInfo[key].refs;
    return prev;
  }, {});

  const initialState: AllState = itemTypes.reduce((prev: any, key) => {
    prev[key] = allInfo[key].startStates || ({} as StartStatesItemName<typeof key>);

    meta.itemNamesByItemType[key as string] = Object.keys(prev[key]);

    return prev;
  }, {});

  // ------------------------------------------------
  // Setup Repond
  // ------------------------------------------------

  if (!dontSetMeta) {
    const currentState: AllState = cloneObjectWithJson(initialState);
    const previousState: AllState = cloneObjectWithJson(initialState);
    // store initialState and set currentState
    meta.initialState = initialState;
    meta.currentState = currentState;
    meta.previousState = previousState;
    meta.defaultStateByItemType = defaultStates as any;
    meta.defaultRefsByItemType = defaultRefs as any;

    getRepondStructureFromDefaults(); // sets itemTypeNames and propertyNamesByItemType
    makeRefsStructureFromRepondState(); // sets currenRepondRefs based on itemNames from repond state

    meta.copyStates = makeCopyStatesFunction() as any;
    meta.getStatesDiff = makeGetStatesDiffFunction();
    meta.mergeStates = makeCopyStatesFunction("merge") as any;

    createRecordedChanges(meta.recordedEffectChanges);
    createRecordedChanges(meta.recordedStepEndEffectChanges);
    createDiffInfo(meta.diffInfo);
  }
}
