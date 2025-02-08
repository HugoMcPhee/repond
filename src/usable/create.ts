import { cloneObjectWithJson } from "../copyStates";
import { AllStoreInfoUntyped } from "../declarations";
import { createDiffInfo } from "../getStatesDiff";
import { getRepondStructureFromDefaults, makeRefsStructureFromRepondState } from "../getStructureFromDefaults";
import { repondMeta as meta, UntypedDiffInfo } from "../meta";
import {
  AllState,
  DefaultRefs,
  DefaultStates,
  FramerateTypeOption,
  ItemType,
  StartStatesItemId,
  StepName,
} from "../types";
import { createRecordedChanges } from "../updating";

export function initRepond<T_AllInfo extends AllStoreInfoUntyped, T_StepNamesParam extends Readonly<string[]>>(
  allStoresInfoOriginal: T_AllInfo,
  extraOptions?: {
    stepNames: T_StepNamesParam;
    framerate?: FramerateTypeOption;
  }
) {
  const allStoresInfo: AllStoreInfoUntyped = {};

  Object.entries(allStoresInfoOriginal).forEach(([key, value]) => {
    // Remove "Store" from the end of the key, if present
    const newKey = key.replace(/Store$/, "");
    allStoresInfo[newKey] = value;
  });

  const itemTypes = Object.keys(allStoresInfo) as unknown as Readonly<ItemType[]>;

  const stepNamesUntyped = extraOptions?.stepNames ? [...extraOptions.stepNames] : ["default"];
  if (!stepNamesUntyped.includes("default")) stepNamesUntyped.push("default");

  const stepNames: Readonly<StepName[]> = [...stepNamesUntyped];

  meta.frameRateTypeOption = extraOptions?.framerate || "full";
  if (meta.frameRateTypeOption === "full") meta.frameRateType = "full";
  else if (meta.frameRateTypeOption === "half") meta.frameRateType = "half";
  else if (meta.frameRateTypeOption === "auto") meta.frameRateType = "full";

  meta.stepNames = stepNames;
  meta.nowStepIndex = 0;
  meta.nowStepName = stepNames[meta.nowStepIndex];

  const defaultStates: DefaultStates = itemTypes.reduce((prev: any, key) => {
    prev[key] = allStoresInfo[key].getDefaultState;
    return prev;
  }, {});
  const defaultRefs: DefaultRefs = itemTypes.reduce((prev: any, key) => {
    prev[key] = allStoresInfo[key].getDefaultRefs;
    return prev;
  }, {});

  const initialState: AllState = itemTypes.reduce((prev: any, key) => {
    prev[key] = allStoresInfo[key].startStates || ({} as StartStatesItemId<typeof key>);

    meta.itemIdsByItemType[key as string] = Object.keys(prev[key]);

    return prev;
  }, {});

  // ------------------------------------------------
  // Setup Repond
  // ------------------------------------------------

  const nowState: AllState = cloneObjectWithJson(initialState);
  const prevState: AllState = cloneObjectWithJson(initialState);
  // store initialState and set currentState
  meta.initialState = initialState;
  meta.nowState = nowState;
  meta.prevState = prevState;
  meta.defaultStateByItemType = defaultStates as any;
  meta.defaultRefsByItemType = defaultRefs as any;

  getRepondStructureFromDefaults(); // sets itemTypeNames and propertyNamesByItemType
  makeRefsStructureFromRepondState(); // sets currenRepondRefs based on itemIds from repond state

  createRecordedChanges(meta.recordedEffectChanges);
  createRecordedChanges(meta.recordedStepEndEffectChanges);
  createDiffInfo(meta.diffInfo as unknown as UntypedDiffInfo);
  meta.didInit = true;
}
