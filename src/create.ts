import meta, {
  toSafeListenerName,
  UntypedListener,
  initialRecordedChanges,
  UntypedDiffInfo,
} from "./meta";
import { getRepondStructureFromDefaults } from "./getStructureFromDefaults";
import makeCopyStatesFunction from "./copyStates";
import makeGetStatesDiffFunction, { createDiffInfo } from "./getStatesDiff";
import { breakableForEach, forEach } from "chootils/dist/loops";

import {
  _addItem,
  _removeItem,
  _setState,
  runWhenStartingRepondListeners,
  runWhenStoppingRepondListeners,
} from "./setting";
import {
  KeysOfUnion,
  DeepReadonly,
  SetRepondState,
  XOR,
  Phase,
  ExtendsString,
  GetPartialState,
  RepondCallback,
} from "./types";
import {
  makeRefsStructureFromRepondState,
  cloneObjectWithJson,
  asArray,
  toSafeArray,
} from "./utils";
import {
  useLayoutEffect,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  addItemToUniqueArray,
  removeItemFromArray,
  getUniqueArrayItems,
} from "chootils/dist/arrays";
import { createRecordedChanges } from "./updating";
import { RepondTypes } from "./declarations";

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

type StepName = RepondTypes["StepNames"][number];
type AllStoreInfo = RepondTypes["AllStoreInfo"];
export type ItemType = keyof AllStoreInfo;

type DefaultStates = { [K_Type in ItemType]: AllStoreInfo[K_Type]["state"] };
type DefaultRefs = { [K_Type in ItemType]: AllStoreInfo[K_Type]["refs"] };
type Get_DefaultRefs<K_Type extends keyof AllStoreInfo> =
  AllStoreInfo[K_Type]["refs"];

// Make a type that has the start states of all the stores
type StartStates = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["startStates"];
};

type StartStatesItemName<K_Type extends keyof AllStoreInfo> =
  AllStoreInfo[K_Type]["startStates"] extends Record<string, any>
    ? keyof AllStoreInfo[K_Type]["startStates"]
    : string;

// make an AllState type that conditionally uses the keys and values of startStates if available or otherwise uses string as the key and the return type of the default "state"  (for that store) as the value
export type AllState = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["startStates"] extends Record<
    string,
    any
  >
    ? AllStoreInfo[K_Type]["startStates"]
    : Record<string, ReturnType<AllStoreInfo[K_Type]["state"]>>;
};

// Make an AllRefs type that uses Get_DefaultRefs for each store
export type AllRefs = {
  [K_Type in ItemType]: Record<
    StartStatesItemName<K_Type>,
    ReturnType<Get_DefaultRefs<K_Type>> // NOTE: refs wont be generic typed, generic ReturnType doesn't seem to work with nested generic function types like Blah<_T_Blah>["blah"]<T_Paramter>
  >;
};

type ItemName<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = ExtendsString<KeysOfUnion<T_State[K_Type]>>;

type PropertyName<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = KeysOfUnion<T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>]> &
  string;

type AllProperties<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  [K_Type in T_ItemType]: PropertyName<K_Type, T_ItemType, T_State>;
}[T_ItemType];

// ------------------------------------------------------------
// DiffInfo

type DiffInfo_PropertiesChanged<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  [K_Type in T_ItemType]: Record<
    ItemName<K_Type, T_ItemType, T_State>,
    PropertyName<K_Type, T_ItemType, T_State>[]
  > & {
    all__: PropertyName<K_Type, T_ItemType, T_State>[];
  };
} & {
  all__: AllProperties<T_ItemType, T_State>[];
};

type DiffInfo_PropertiesChangedBool<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  [K_Type in T_ItemType]: Record<
    ItemName<K_Type, T_ItemType, T_State>,
    { [K_PropName in PropertyName<K_Type, T_ItemType, T_State>]: boolean }
  > & {
    all__: {
      [K_PropName in PropertyName<K_Type, T_ItemType, T_State>]: boolean;
    };
  };
} & {
  all__: { [K_PropName in AllProperties<T_ItemType, T_State>]: boolean };
};

type DiffInfo_ItemsChanged<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = Record<T_ItemType | "all__", ItemName<T_ItemType, T_ItemType, T_State>[]>;

type DiffInfo_ItemsChangedBool<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = Record<
  T_ItemType | "all__",
  Record<ItemName<T_ItemType, T_ItemType, T_State>, boolean>
>;

type DiffInfo<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  itemTypesChanged: T_ItemType[];
  itemsChanged: DiffInfo_ItemsChanged<T_ItemType, T_State>;
  propsChanged: DiffInfo_PropertiesChanged<T_ItemType, T_State>;
  itemsAdded: DiffInfo_ItemsChanged<T_ItemType, T_State>;
  itemsRemoved: DiffInfo_ItemsChanged<T_ItemType, T_State>;
  itemTypesChangedBool: Record<T_ItemType | "all__", boolean>;
  itemsChangedBool: DiffInfo_ItemsChangedBool<T_ItemType, T_State>;
  propsChangedBool: DiffInfo_PropertiesChangedBool<T_ItemType, T_State>;
  itemsAddedBool: DiffInfo_ItemsChangedBool<T_ItemType, T_State>;
  itemsRemovedBool: DiffInfo_ItemsChangedBool<T_ItemType, T_State>;
};

// ------------------------------------------------------------

type ItemEffectCallbackParams<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>
> = {
  itemName: ItemName<K_Type, T_ItemType, T_State>;
  newValue: T_State[K_Type][ItemName<
    K_Type,
    T_ItemType,
    T_State
  >][K_PropertyName];
  previousValue: T_State[K_Type][ItemName<
    K_Type,
    T_ItemType,
    T_State
  >][K_PropertyName];
  itemState: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>];
  // itemRefs: T_Refs[K_Type][keyof T_Refs[K_Type]];
  itemRefs: T_Refs[K_Type][ItemName<K_Type, T_ItemType, T_State>];
  // itemRefs: Get_T_Refs<K_Type>[ItemName<K_Type>];
  frameDuration: number;
};

type ACheck_Becomes =
  | undefined
  | string
  | number
  | boolean
  | ((theValue: any, prevValue: any) => boolean);

// for useStoreItem

type OneItem_ACheck_SingleProperty<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  prop?: K_PropertyName;
  type: K_Type;
  name: ItemName<K_Type, T_ItemType, T_State>;
  becomes?: ACheck_Becomes;
  addedOrRemoved?: undefined;
};

type OneItem_ACheck_MultiProperties<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  prop?: K_PropertyName[];
  type: K_Type; // maybe ideally optional (and handle adding listener with any item type)
  name: ItemName<K_Type, T_ItemType, T_State>;
  becomes?: ACheck_Becomes;
  addedOrRemoved?: undefined;
};

type OneItem_Check<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | OneItem_ACheck_SingleProperty<K_Type, K_PropertyName, T_ItemType, T_State>
  | OneItem_ACheck_MultiProperties<K_Type, K_PropertyName, T_ItemType, T_State>;

// -----------------
//

// for itemEffectCallback
type ItemEffectRule_Check_SingleProperty<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  prop?: K_PropertyName;
  type: K_Type;
  name?:
    | ItemName<K_Type, T_ItemType, T_State>[]
    | ItemName<K_Type, T_ItemType, T_State>;
  becomes?: ACheck_Becomes;
  addedOrRemoved?: undefined;
};

type ItemEffectRule_Check_MultiProperties<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  prop?: K_PropertyName[];
  type: K_Type; // maybe ideally optional (and handle adding listener with any item type)
  name?:
    | ItemName<K_Type, T_ItemType, T_State>[]
    | ItemName<K_Type, T_ItemType, T_State>;
  becomes?: ACheck_Becomes;
  addedOrRemoved?: undefined;
};

type ItemEffectRule_Check<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | ItemEffectRule_Check_SingleProperty<
      K_Type,
      K_PropertyName,
      T_ItemType,
      T_State
    >
  | ItemEffectRule_Check_MultiProperties<
      K_Type,
      K_PropertyName,
      T_ItemType,
      T_State
    >;

type ItemEffectCallback<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>
> = (
  loopedInfo: ItemEffectCallbackParams<
    K_Type,
    K_PropertyName,
    T_ItemType,
    T_State,
    T_Refs
  >
) => void;

type ItemEffect_RuleOptions<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_StepName extends string
> = {
  check: ItemEffectRule_Check<K_Type, K_PropertyName, T_ItemType, T_State>;
  // can use function to check value, ideally it uses the type of the selected property
  run: ItemEffectCallback<K_Type, K_PropertyName, T_ItemType, T_State, T_Refs>;
  atStepEnd?: boolean;
  name?: string;
  step?: T_StepName;
  runAtStart?: boolean;
  _isPerItem?: true;
};

type ItemEffect_RuleOptions__NoMeta<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_StepName extends string
> = {
  check: ItemEffectRule_Check<K_Type, K_PropertyName, T_ItemType, T_State>;
  // can use function to check value, ideally it uses the type of the selected property
  run: ItemEffectCallback<K_Type, K_PropertyName, T_ItemType, T_State, T_Refs>;
  atStepEnd?: boolean;
  name?: string;
  step?: T_StepName;
  runAtStart?: boolean;
};

// -----------------
// AnyChangeRule ( like a slightly different and typed repond listener )

type EffectRule_ACheck_OneItemType<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  type?: K_Type;
  name?:
    | ItemName<K_Type, T_ItemType, T_State>
    | ItemName<K_Type, T_ItemType, T_State>[];
  prop?: PropertyName<K_Type, T_ItemType, T_State>[];
  addedOrRemoved?: boolean;
  becomes?: undefined;
};

/*
  // if it's an array of objects with multiple item types, this needs to be used
  [
    { type: ["characters"], name: "walker", prop: ["position"] },
    { type: ["global"], name: "main", prop: ["planePosition"] },
  ]);
  // "characters" and "global" need to be in array array so
  // the MultipleItemTypes type's chosen
  */
type EffectRule_ACheck_MultipleItemTypes<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  type?: T_ItemType[];
  name?:
    | ItemName<T_ItemType, T_ItemType, T_State>
    | ItemName<T_ItemType, T_ItemType, T_State>[];
  prop?: AllProperties<T_ItemType, T_State>[];
  addedOrRemoved?: boolean;
  becomes?: undefined;
};

type EffectRule_ACheck<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | EffectRule_ACheck_OneItemType<K_Type, T_ItemType, T_State>
  | EffectRule_ACheck_MultipleItemTypes<T_ItemType, T_State>;

type EffectRule_Check<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | EffectRule_ACheck<K_Type, T_ItemType, T_State>[]
  | EffectRule_ACheck<K_Type, T_ItemType, T_State>;

type EffectCallback<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = (
  diffInfo: DiffInfo<T_ItemType, T_State>,
  frameDuration: number,
  skipChangeCheck?: boolean // for useStoreItemEffect, to run the effect regardless of changes
) => void;

type Effect_RuleOptions<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_StepName extends string
> = {
  name?: string; // ruleName NOTE used to be required (probably still for dangerouslyAddingRule ? (adding single rules without making rules first))
  check: EffectRule_Check<K_Type, T_ItemType, T_State>;
  run: EffectCallback<T_ItemType, T_State>;
  atStepEnd?: boolean;
  step?: T_StepName;
  runAtStart?: boolean;
  _isPerItem?: false;
};

type Effect_RuleOptions__NoMeta<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_StepName extends string
> = {
  name?: string; // ruleName NOTE used to be required (probably still for dangerouslyAddingRule ? (adding single rules without making rules first))
  check: EffectRule_Check<K_Type, T_ItemType, T_State>;
  run: EffectCallback<T_ItemType, T_State>;
  atStepEnd?: boolean;
  step?: T_StepName;
  runAtStart?: boolean;
};

type Effect_RuleOptions_NameRequired<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_StepName extends string
> = Effect_RuleOptions<K_Type, T_ItemType, T_State, T_StepName> & {
  name: string;
};

type FlexibleRuleOptions<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_StepName extends string
> = XOR<
  Effect_RuleOptions<K_Type, T_ItemType, T_State, T_StepName>,
  ItemEffect_RuleOptions<
    K_Type,
    K_PropertyName,
    T_ItemType,
    T_State,
    T_Refs,
    T_StepName
  >
>;

type MakeRule_Rule<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_StepName extends string
> = FlexibleRuleOptions<
  T_ItemType,
  PropertyName<T_ItemType, T_ItemType, T_State>,
  T_ItemType,
  T_State,
  T_Refs,
  T_StepName
>;

// ----------------------------
//  Listener types

type Listener_ACheck_OneItemType<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  types?: K_Type;
  names?: ItemName<K_Type, T_ItemType, T_State>[];
  props?: PropertyName<K_Type, T_ItemType, T_State>;
  addedOrRemoved?: boolean;
};

type Listener_ACheck_MultipleItemTypes<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  types?: (keyof T_State)[];
  names?: ItemName<T_ItemType, T_ItemType, T_State>[];
  props?: AllProperties<T_ItemType, T_State>[];
  addedOrRemoved?: boolean;
};

// NOTE: the type works, but autocomplete doesn't work ATM when
// trying to make properties/addedOrRemoved exclusive
// type TestChangeToCheckUnionWithProperties<T, K> = XOR<
//   Omit<TestChangeToCheckMultipleItemTypes<T>, "addedOrRemoved">,
//   Omit<TestChangeToCheckOneItemType<T, K>, "addedOrRemoved">
// >;
// type TestChangeToCheckUnionWithoutProperties<T, K> = XOR<
//   Omit<TestChangeToCheckMultipleItemTypes<T>, "properties">,
//   Omit<TestChangeToCheckOneItemType<T, K>, "properties">
// >;

// type TestChangeToCheckUnion<T, K> = XOR<
//   TestChangeToCheckUnionWithProperties<T, K>,
//   TestChangeToCheckUnionWithoutProperties<T, K>
// >;

type Listener_ACheck<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | Listener_ACheck_OneItemType<K_Type, T_ItemType, T_State>
  | Listener_ACheck_MultipleItemTypes<T_ItemType, T_State>;

type Listener_Check<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | Listener_ACheck<K_Type, T_ItemType, T_State>[]
  | Listener_ACheck<K_Type, T_ItemType, T_State>;

type AddItemOptionsUntyped<
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_TypeName
> = {
  type: string;
  name: string;
  state?: Partial<
    NonNullable<T_State[T_TypeName]>[keyof T_State[keyof T_State]]
  >;
  refs?: Partial<NonNullable<T_Refs[T_TypeName]>[keyof T_Refs[keyof T_Refs]]>;
};

// -----------------
// Listeners B

type Listener<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_StepName extends string
> = {
  name: string;
  changesToCheck: Listener_Check<K_Type, T_ItemType, T_State>;
  whatToDo: (
    diffInfo: DiffInfo<T_ItemType, T_State>,
    frameDuration: number
  ) => void;
  atStepEnd?: boolean;
  step?: T_StepName;
};

// After normalizing
type ListenerAfterNormalising<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  name: string;
  changesToCheck: Listener_ACheck<K_Type, T_ItemType, T_State>[];
  whatToDo: (
    diffInfo: DiffInfo<T_ItemType, T_State>,
    frameDuration: number
  ) => void;
  atStepEnd?: boolean;
  step?: string;
};

// -----------------
//

type UseStoreItemParams<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>
> = {
  itemName: ItemName<K_Type, T_ItemType, T_State>;
  prevItemState: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>];
  itemState: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>];
  // itemRefs: T_Refs[K_Type][keyof T_Refs[K_Type]];
  itemRefs: T_Refs[K_Type][ItemName<K_Type, T_ItemType, T_State>];
  // frameDuration: number;
};

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

  const stepNamesUntyped = extraOptions?.stepNames
    ? [...extraOptions.stepNames]
    : ["default"];
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
    prev[key] =
      allInfo[key].startStates || ({} as StartStatesItemName<typeof key>);

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

    createRecordedChanges(meta.recordedDeriveChanges);
    createRecordedChanges(meta.recordedSubscribeChanges);
    createDiffInfo(meta.diffInfo);
  }

  return {
    getPreviousState,
    getState,
    setState,
    onNextTick,
    getRefs,
    getItem,
    makeRules,
    makeDynamicRules,
    makeRuleMaker,
    makeLeaveRuleMaker,
    makeNestedRuleMaker,
    makeNestedLeaveRuleMaker,
    startEffect,
    startItemEffect,
    stopEffect,
    useStore,
    useStoreEffect,
    useStoreItem,
    useStoreItemEffect,
    useStoreItemPropsEffect,
    addItem,
    removeItem,
    // patches and diffs
    makeEmptyPatch,
    makeEmptyDiff,
    applyPatch,
    applyPatchHere,
    getPatch,
    getPatchAndReversed,
    getReversePatch,
    combineTwoPatches,
    combinePatches,
    makeMinimalPatch,
    removePartialPatch,
    getDiff,
    getDiffFromPatches,
    getPatchesFromDiff,
    combineTwoDiffs,
    combineDiffs,
  };
}
// -----------------------------------------------------------------
// main functions
// -----------------------------------------------------------------

const getDefaultStates = (): DefaultStates =>
  meta.defaultStateByItemType as DefaultStates;

const getDefaultRefs = (): DefaultRefs =>
  meta.defaultRefsByItemType as DefaultRefs;

const getItemTypes = (): ItemType[] => meta.itemTypeNames;

const getState = (): DeepReadonly<AllState> =>
  meta.currentState as DeepReadonly<AllState>;

const setState: SetRepondState<AllState> = (newState, callback) =>
  _setState(newState, callback);

function onNextTick(callback: RepondCallback) {
  meta.callbacksQue.push(callback); // NOTE WARNING This used to be callforwardsQue
}

const getPreviousState = (): AllState => meta.previousState as AllState;

const getRefs = (): AllRefs => meta.currentRefs as AllRefs;

// -------------------------------------------------------
// utils
// -------------------------------------------------------

// Convert an itemEffect callback to a regular effect callback
// NOTE: not typed but only internal
function itemEffectCallbackToEffectCallback<K_Type extends ItemType>({
  itemType,
  itemNames,
  propertyNames,
  whatToDo,
  becomes,
}: {
  itemType?: K_Type | K_Type[];
  itemNames?: ItemName<K_Type, ItemType, AllState>[];
  propertyNames: AllProperties<ItemType, AllState>[];
  whatToDo: (options: any) => any;
  becomes: ACheck_Becomes;
}) {
  const editedItemTypes = asArray(itemType);
  let allowedItemNames: { [itemName: string]: boolean } | undefined = undefined;

  if (itemNames) {
    allowedItemNames = {};
    forEach(itemNames, (loopedItemName) => {
      if (allowedItemNames) {
        allowedItemNames[loopedItemName as string] = true;
      }
    });
  }

  return (
    diffInfo: DiffInfo<ItemType, AllState>,
    frameDuration: number,
    skipChangeCheck?: boolean
  ) => {
    // if skipChangeCheck is true, it will run the whatToDo function regardless of the changes
    if (skipChangeCheck) {
      if (itemNames) {
        forEach(editedItemTypes, (theItemType) => {
          const prevItemsState = getPreviousState()[theItemType] as any;
          const itemsState = (getState() as AllState)[theItemType];
          const itemsRefs = getRefs()[theItemType];

          forEach(itemNames, (loopedItemName) => {
            breakableForEach(propertyNames, (thePropertyName) => {
              const newValue = itemsState[loopedItemName][thePropertyName];

              whatToDo({
                itemName: itemNames,
                newValue,
                previousValue: prevItemsState[loopedItemName][thePropertyName],
                itemState: itemsState[loopedItemName],
                itemRefs: itemsRefs[loopedItemName],
                frameDuration,
              });
              return true; // break out of the loop, so it only runs once
            });
          });
        });
      }
      return true; // return early if skipChangeCheck was true
    }

    forEach(editedItemTypes, (theItemType) => {
      const prevItemsState = getPreviousState()[theItemType] as any;
      const itemsState = (getState() as AllState)[theItemType];
      const itemsRefs = getRefs()[theItemType];
      forEach(diffInfo.itemsChanged[theItemType], (itemNameThatChanged) => {
        if (
          !(
            !allowedItemNames ||
            (allowedItemNames &&
              allowedItemNames[itemNameThatChanged as string])
          )
        )
          return;

        breakableForEach(propertyNames, (thePropertyName) => {
          if (
            !(diffInfo.propsChangedBool as any)[theItemType][
              itemNameThatChanged
            ][thePropertyName]
          )
            return;

          const newValue = itemsState[itemNameThatChanged][thePropertyName];

          let canRunWhatToDo = false;

          if (becomes === undefined) canRunWhatToDo = true;
          else if (typeof becomes === "function") {
            canRunWhatToDo = becomes(
              newValue,
              prevItemsState[itemNameThatChanged][thePropertyName]
            );
          } else if (becomes === newValue) canRunWhatToDo = true;

          if (!canRunWhatToDo) return;

          whatToDo({
            itemName: itemNameThatChanged,
            newValue,
            previousValue: prevItemsState[itemNameThatChanged][thePropertyName],
            itemState: itemsState[itemNameThatChanged],
            itemRefs: itemsRefs[itemNameThatChanged],
            frameDuration,
          });
          return true; // break out of the loop, so it only runs once
        });
      });
    });
  };
}

// converts a repond effect to a normalised 'listener', where the names are an array instead of one
function anyChangeRuleACheckToListenerACheck<K_Type extends ItemType>(
  checkProperty: EffectRule_ACheck<K_Type, ItemType, AllState>
) {
  return {
    names: toSafeArray(checkProperty.name),
    types: checkProperty.type as Listener_ACheck<
      K_Type,
      ItemType,
      AllState
    >["types"],
    props: checkProperty.prop,
    addedOrRemoved: checkProperty.addedOrRemoved,
  };
}

// converts a conccept effect check to a listener check (where it's an array of checks)
function anyChangeRuleCheckToListenerCheck<K_Type extends ItemType>(
  checkProperty: EffectRule_Check<K_Type, ItemType, AllState>
) {
  if (Array.isArray(checkProperty)) {
    return checkProperty.map((loopedCheckProperty) =>
      anyChangeRuleACheckToListenerACheck(loopedCheckProperty)
    );
  }
  return anyChangeRuleACheckToListenerACheck(checkProperty);
}

// converts a repond effect to a listener
function convertEffectToListener<
  T_AnyChangeRule extends Effect_RuleOptions_NameRequired<
    any,
    ItemType,
    AllState,
    StepName
  >
>(
  anyChangeRule: T_AnyChangeRule
): Listener<ItemType, ItemType, AllState, StepName> {
  return {
    changesToCheck: anyChangeRuleCheckToListenerCheck(anyChangeRule.check),
    atStepEnd: !!anyChangeRule.atStepEnd,
    name: anyChangeRule.name,
    whatToDo: anyChangeRule.run,
    step: anyChangeRule.step,
  };
}

// --------------------------------------------------------------------
// more utils
// --------------------------------------------------------------------

function normaliseChangesToCheck<K_Type extends ItemType>(
  changesToCheck: Listener_Check<K_Type, ItemType, AllState>
): Listener_ACheck_MultipleItemTypes<ItemType, AllState>[] {
  const changesToCheckArray = asArray(changesToCheck);

  return changesToCheckArray.map(
    (loopeChangeToCheck) =>
      ({
        types: toSafeArray(loopeChangeToCheck.types),
        names: loopeChangeToCheck.names,
        props: loopeChangeToCheck.props,
        addedOrRemoved: loopeChangeToCheck.addedOrRemoved,
      } as any)
  );
}

function _startRepondListener<K_Type extends ItemType>(
  newListener: Listener<K_Type, ItemType, AllState, StepName>
) {
  const atStepEnd = !!newListener.atStepEnd;
  const phase: Phase = atStepEnd ? "subscribe" : "derive";

  const editedListener: ListenerAfterNormalising<K_Type, ItemType, AllState> = {
    name: newListener.name,
    changesToCheck: normaliseChangesToCheck(newListener.changesToCheck),
    whatToDo: newListener.whatToDo,
  };
  if (atStepEnd) editedListener.atStepEnd = atStepEnd;
  if (newListener.step) editedListener.step = newListener.step;

  runWhenStartingRepondListeners(() => {
    // add the new listener to all listeners and update listenerNamesByTypeByStep

    meta.allListeners[editedListener.name] =
      editedListener as unknown as UntypedListener;

    meta.listenerNamesByPhaseByStep[phase][editedListener.step ?? "default"] =
      addItemToUniqueArray(
        meta.listenerNamesByPhaseByStep[phase][
          editedListener.step ?? "default"
        ] ?? [],
        editedListener.name
      );
  });
}

function _stopRepondListener(listenerName: string) {
  runWhenStoppingRepondListeners(() => {
    const theListener = meta.allListeners[listenerName];
    if (!theListener) return;
    const atStepEnd = !!theListener.atStepEnd;
    const phase: Phase = atStepEnd ? "subscribe" : "derive";
    const step = theListener.step ?? "default";

    meta.listenerNamesByPhaseByStep[phase][step] = removeItemFromArray(
      meta.listenerNamesByPhaseByStep[phase][step] ?? [],
      theListener.name
    );

    delete meta.allListeners[listenerName];
  });
}

// --------------------------------------------------------------------
// other functions
// --------------------------------------------------------------------
function getItem<
  K_Type extends ItemType,
  T_ItemName extends ItemName<K_Type, ItemType, AllState>
>(type: K_Type, name: T_ItemName) {
  return [
    (getState() as any)[type][name],
    getRefs()[type][name],
    getPreviousState()[type][name],
  ] as [
    AllState[K_Type][T_ItemName],
    ReturnType<typeof getRefs>[K_Type][T_ItemName],
    ReturnType<typeof getPreviousState>[K_Type][T_ItemName]
  ];
}

function startEffect<K_Type extends ItemType>(
  theEffect: Effect_RuleOptions__NoMeta<K_Type, ItemType, AllState, StepName>
) {
  let listenerName = theEffect.name || toSafeListenerName("effect");

  // add the required listenerName
  const editedEffect = {
    check: theEffect.check,
    name: listenerName,
    run: theEffect.run,
    atStepEnd: theEffect.atStepEnd,
    step: theEffect.step,
    runAtStart: theEffect.runAtStart,
  };

  if (theEffect.runAtStart) {
    const result = theEffect.run(
      meta.diffInfo as any,
      16.66666,
      true /* skipChangeCheck */
    );
  }

  _startRepondListener(convertEffectToListener(editedEffect) as any);
}

function startItemEffect<
  K_Type extends ItemType,
  K_PropertyName extends PropertyName<K_Type, ItemType, AllState>
>({
  check,
  run,
  atStepEnd,
  name,
  step,
  runAtStart,
}: ItemEffect_RuleOptions__NoMeta<
  K_Type,
  K_PropertyName,
  ItemType,
  AllState,
  AllRefs,
  StepName
>) {
  let listenerName = name || "unnamedEffect" + Math.random();

  const editedItemTypes = toSafeArray(check.type);
  const editedPropertyNames = toSafeArray(check.prop);
  const editedItemNames = toSafeArray(check.name);

  let editedChangesToCheck = {
    type: editedItemTypes,
    prop: editedPropertyNames,
    name: editedItemNames,
  };

  let runEffect = itemEffectCallbackToEffectCallback({
    itemType: editedItemTypes,
    itemNames: editedItemNames,
    propertyNames:
      editedPropertyNames ?? ([] as AllProperties<ItemType, AllState>[]),
    whatToDo: run,
    becomes: check.becomes,
  });

  startEffect({
    atStepEnd,
    name: listenerName,
    check: editedChangesToCheck as any,
    run: runEffect,
    step,
    runAtStart,
  });

  return listenerName;
}

function stopEffect(listenerName: string) {
  _stopRepondListener(listenerName);
}

function useStore<K_Type extends ItemType, T_ReturnedRepondProps>(
  whatToReturn: (state: DeepReadonly<AllState>) => T_ReturnedRepondProps,
  check: EffectRule_Check<K_Type, ItemType, AllState>,
  hookDeps: any[] = []
): T_ReturnedRepondProps {
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((tick) => tick + 1), []);

  useEffect(() => {
    const name = toSafeListenerName("reactComponent");
    startEffect({
      atStepEnd: true,
      name,
      check,
      run: rerender,
      runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
    });

    return () => stopEffect(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, hookDeps);

  return whatToReturn(meta.currentState) as T_ReturnedRepondProps;
}

function useStoreEffect<K_Type extends ItemType>(
  run: EffectCallback<ItemType, AllState>,
  check: EffectRule_Check<K_Type, ItemType, AllState>,
  hookDeps: any[] = []
) {
  useLayoutEffect(() => {
    const name = toSafeListenerName("useStoreEffect_"); // note could add JSON.stringify(check) for useful listener name
    startEffect({ name, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
    return () => stopEffect(name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, hookDeps);
}

function useStoreItemEffect<
  K_Type extends ItemType,
  K_PropertyName extends PropertyName<K_Type, ItemType, AllState>,
  T_ReturnType
>(
  run: (
    loopedInfo: ItemEffectCallbackParams<
      K_Type,
      K_PropertyName,
      ItemType,
      AllState,
      AllRefs
    >
  ) => T_ReturnType,
  check: ItemEffectRule_Check<K_Type, K_PropertyName, ItemType, AllState>,
  hookDeps: any[] = []
) {
  useLayoutEffect(
    () => {
      const name = toSafeListenerName(
        "useStoreItemEffect_" + JSON.stringify(check)
      );
      startItemEffect({ name, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
      return () => stopEffect(name);
    },
    hookDeps.length > 0 ? [...hookDeps, check.name] : [check.name]
  );
}

// NOTE it automatically supports changing item name, but not item type or props, that needs custom hookDeps
function useStoreItem<
  K_Type extends ItemType,
  K_PropertyName extends PropertyName<K_Type, ItemType, AllState>,
  T_ReturnType,
  T_TheParameters = UseStoreItemParams<K_Type, ItemType, AllState, AllRefs>
>(
  itemEffectCallback: (loopedInfo: T_TheParameters) => T_ReturnType,
  check: OneItem_Check<K_Type, K_PropertyName, ItemType, AllState>,
  hookDeps: any[] = []
) {
  function getInitialState() {
    return {
      itemName: check.name,
      prevItemState: getPreviousState()[check.type][check.name],
      itemState: (getState() as any)[check.type as any][check.name],
      itemRefs: getRefs()[check.type][check.name],
    } as unknown as T_TheParameters;
  }

  const didRender = useRef(false);

  const [returnedState, setReturnedState] = useState(getInitialState());

  useLayoutEffect(
    () => {
      if (didRender.current) {
        setReturnedState(getInitialState());
      }
      const name = toSafeListenerName("useStoreItem"); // note could add JSON.stringify(check) for useful listener name

      startItemEffect({
        name,
        atStepEnd: true,
        check,
        run: (theParameters) => setReturnedState(theParameters as any),
        runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
      });
      didRender.current = true;

      return () => stopEffect(name);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    hookDeps.length > 0 ? [...hookDeps, check.name] : [check.name]
  );

  return itemEffectCallback(returnedState);
}

/*
useStoreItemPropsEffect(
{ position() {}, rotationY() {}, nowAnimation() {} },
{ type: "characters", name: "walker" },
);
*/
function useStoreItemPropsEffect<K_Type extends ItemType>(
  checkItem: {
    type: K_Type;
    name: ItemName<K_Type, ItemType, AllState>;
    step?: StepName;
  },
  onPropChanges: Partial<{
    [K_PropertyName in PropertyName<
      K_Type,
      ItemType,
      AllState
    >]: ItemEffectCallback<K_Type, K_PropertyName, ItemType, AllState, AllRefs>;
  }>,
  hookDeps: any[] = []
) {
  useLayoutEffect(
    () => {
      type ItemEffect_PropName = keyof typeof onPropChanges;
      const propNameKeys = Object.keys(onPropChanges) as ItemEffect_PropName[];
      const namePrefix = toSafeListenerName("useStoreItemPropsEffect"); // note could add checkItem.type and checkItem.name for useful listener name

      forEach(propNameKeys, (loopedPropKey) => {
        const name = namePrefix + (loopedPropKey as string);

        const itemEffectCallback = onPropChanges[loopedPropKey];
        startItemEffect({
          run: itemEffectCallback as any,
          name,
          check: {
            type: checkItem.type,
            name: checkItem.name,
            prop: loopedPropKey,
          },
          atStepEnd: true,
          step: checkItem.step,
          runAtStart: true, // runAtStart true so it works like useEffect
        });
      });

      return () => {
        forEach(propNameKeys, (loopedPropKey) => {
          const name = namePrefix + (loopedPropKey as string);
          stopEffect(name);
        });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    hookDeps.length > 0
      ? [...hookDeps, checkItem.name.name]
      : [checkItem.name.name]
  );
}

type AddItemOptions<K_Type extends ItemType> = {
  type: K_Type;
  name: string;
  state?: Partial<AllState[K_Type][ItemName<K_Type, ItemType, AllState>]>;
  refs?: Partial<AllRefs[K_Type][ItemName<K_Type, ItemType, AllState>]>;
};
function addItem<K_Type extends ItemType>(
  addItemOptions: AddItemOptions<K_Type>,
  callback?: any
) {
  _addItem(
    addItemOptions as AddItemOptionsUntyped<AllState, AllRefs, K_Type>,
    callback
  );
}

function removeItem(itemInfo: { type: ItemType; name: string }) {
  _removeItem(
    itemInfo as {
      type: string;
      name: string;
    }
  );
}

// --------------------------------------------------------------------
// Rules
// --------------------------------------------------------------------
// type MakeRule_Rule = FlexibleRuleOptions<
//   T_ItemType,
//   PropertyName<T_ItemType>
// >;

// NOTE could make options generic and return that
// type MakeEffect = <K_Type extends T_ItemType>(options: Effect_RuleOptions<K_Type>) => Effect_RuleOptions<K_Type>;
type MakeEffect = <K_Type extends ItemType>(
  options: Effect_RuleOptions__NoMeta<K_Type, ItemType, AllState, StepName>
  // ) => Effect_RuleOptions<K_Type, T_ItemType, T_State, T_StepName>;
) => any;

// type MakeItemEffect = <K_Type extends T_ItemType, K_PropertyName extends G_PropertyName[K_Type]>(options: ItemEffect_RuleOptions<K_Type, K_PropertyName>) => ItemEffect_RuleOptions<K_Type, K_PropertyName>;
type MakeItemEffect = <
  K_Type extends ItemType,
  K_PropertyName extends PropertyName<K_Type, ItemType, AllState>
>(
  options: ItemEffect_RuleOptions__NoMeta<
    K_Type,
    K_PropertyName,
    ItemType,
    AllState,
    AllRefs,
    StepName
  >
  // ) => ItemEffect_RuleOptions<
  //   K_Type,
  //   K_PropertyName,
  //   T_ItemType,
  //   T_State,
  //   T_Refs,
  //   T_StepName
  // >;
) => any;

type MakeDynamicEffectInlineFunction = <
  K_Type extends ItemType,
  T_Options extends any
>(
  theRule: (
    options: T_Options
  ) => Effect_RuleOptions__NoMeta<K_Type, ItemType, AllState, StepName>
) => (
  options: T_Options
  // ) => Effect_RuleOptions<K_Type, T_ItemType, T_State, T_StepName>;
) => any;

type MakeDynamicItemEffectInlineFunction = <
  K_Type extends ItemType,
  K_PropertyName extends PropertyName<K_Type, ItemType, AllState>,
  T_Options extends any
>(
  theRule: (
    options: T_Options
  ) => ItemEffect_RuleOptions__NoMeta<
    K_Type,
    K_PropertyName,
    ItemType,
    AllState,
    AllRefs,
    StepName
  >
) => (
  options: T_Options
  // ) => ItemEffect_RuleOptions<
  //   K_Type,
  //   K_PropertyName,
  //   T_ItemType,
  //   T_State,
  //   T_Refs,
  //   T_StepName
  // >;
) => any;

function makeEffect<K_Type extends ItemType>(
  options: Effect_RuleOptions__NoMeta<K_Type, ItemType, AllState, StepName>
): Effect_RuleOptions<K_Type, ItemType, AllState, StepName> {
  return { ...options, _isPerItem: false };
}

function makeItemEffect<
  K_Type extends ItemType,
  K_PropertyName extends PropertyName<K_Type, ItemType, AllState>
>(
  options: ItemEffect_RuleOptions__NoMeta<
    K_Type,
    K_PropertyName,
    ItemType,
    AllState,
    AllRefs,
    StepName
  >
): ItemEffect_RuleOptions<
  K_Type,
  K_PropertyName,
  ItemType,
  AllState,
  AllRefs,
  StepName
> {
  return { ...options, _isPerItem: true };
}
//
// // NOTE could make options generic and return that
// // type MakeEffect = <K_Type extends T_ItemType>(options: Effect_RuleOptions<K_Type>) => Effect_RuleOptions<K_Type>;
// type MakeEffect = <K_Type extends T_ItemType>(
//   options: Effect_RuleOptions<K_Type>
// ) => Effect_RuleOptions<K_Type>;
//
// // type MakeItemEffect = <K_Type extends T_ItemType, K_PropertyName extends G_PropertyName[K_Type]>(options: ItemEffect_RuleOptions<K_Type, K_PropertyName>) => ItemEffect_RuleOptions<K_Type, K_PropertyName>;
// type MakeItemEffect = <
//   K_Type extends T_ItemType,
//   K_PropertyName extends PropertyName<K_Type>
// >(
//   options: ItemEffect_RuleOptions<K_Type, K_PropertyName>
// ) => ItemEffect_RuleOptions<K_Type, K_PropertyName>;

// type MakeRule_Utils = {
//   itemEffect: MakeItemEffect;
//   effect: MakeEffect;
// };

function makeRules<K_RuleName extends string>(
  rulesToAdd: (arg0: {
    itemEffect: MakeItemEffect;
    effect: MakeEffect;
  }) => // ) => Record<K_RuleName, MakeRule_Rule >
  Record<K_RuleName, MakeRule_Rule<ItemType, AllState, AllRefs, StepName>>
): {
  start: (ruleName: K_RuleName) => void;
  stop: (ruleName: K_RuleName) => void;
  startAll: () => void;
  stopAll: () => void;
  ruleNames: K_RuleName[];
  run: (ruleName: K_RuleName) => void;
  runAll: () => void;
} {
  // type RuleName = keyof ReturnType<typeof rulesToAdd>;
  const editedRulesToAdd = rulesToAdd({
    itemEffect: makeItemEffect as any,
    effect: makeEffect as any,
  });
  const ruleNames: K_RuleName[] = Object.keys(editedRulesToAdd) as any[];
  const ruleNamePrefix = toSafeListenerName("makeRules");

  // edit the names for each rule
  forEach(ruleNames, (ruleName) => {
    const loopedRule = editedRulesToAdd[ruleName as any];
    if (loopedRule) {
      loopedRule.name = ruleNamePrefix + ruleName;
    }
  });

  // maybe startRule so it can be {startRule} =

  function start(ruleName: K_RuleName) {
    const theRule = editedRulesToAdd[ruleName as any];
    if (!theRule) return;

    if (theRule._isPerItem) {
      startItemEffect(theRule as any);
    } else {
      startEffect(theRule as any);
    }
  }

  function stop(ruleName: K_RuleName) {
    if (editedRulesToAdd[ruleName as keyof typeof editedRulesToAdd]) {
      stopEffect(ruleNamePrefix + ruleName);
    }
  }

  // type EditedRulesToAdd = typeof editedRulesToAdd;
  // type EditedRulesToAdd222 = EditedRulesToAdd[K_RuleName]["check"];

  // run the rule directly
  function run(ruleName: K_RuleName) {
    // NOTE this doesn't wait for the step chosen for the rule!
    // maybe it should?

    const theRule = editedRulesToAdd[ruleName as any] as MakeRule_Rule<
      ItemType,
      AllState,
      AllRefs,
      StepName
    >;
    if (!theRule) return;

    if (theRule._isPerItem) {
      // Run the item rule for each item (and prop)
      const itemType = theRule.check.type as ItemType;
      const itemNames = meta.itemNamesByItemType[itemType as string];
      const propNames = toSafeArray(theRule.check.prop) ?? [];
      const itemsState = (getState() as AllState)[itemType];
      const prevItemsState = (getPreviousState() as AllState)[itemType];
      const itemsRefs = (getRefs() as AllState)[itemType];
      forEach(itemNames, (itemName) => {
        forEach(propNames, (propName) => {
          const newValue = itemsState[itemName][propName];
          theRule.run({
            itemName: itemName as any,
            newValue,
            previousValue: prevItemsState[itemName][propName],
            itemState: itemsState[itemName],
            itemRefs: itemsRefs[itemName],
            frameDuration: 16.66666,
          });
        });
      });
    } else {
      // Run the rule once
      theRule.run(meta.diffInfo as any, 16.66666);
    }
  }

  function runAll() {
    forEach(ruleNames, (ruleName) => run(ruleName));
  }

  function startAll() {
    forEach(ruleNames, (ruleName) => start(ruleName));
  }

  function stopAll() {
    forEach(ruleNames, (ruleName) => stop(ruleName));
  }

  return {
    start,
    stop,
    startAll,
    stopAll,
    ruleNames: ruleNames as K_RuleName[],
    run,
    runAll,
  };
}

// -----------------
// make rules dynamic

function makeDynamicEffectInlineFunction<
  K_Type extends ItemType,
  T_Options extends any
>(
  theRule: (
    options: T_Options
  ) => Effect_RuleOptions<K_Type, ItemType, AllState, StepName>
) {
  // return theRule;
  return (options: T_Options) => ({ ...theRule(options), _isPerItem: false });
}
function makeDynamicItemEffectInlineFunction<
  K_Type extends ItemType,
  K_PropertyName extends PropertyName<K_Type, ItemType, AllState>,
  T_Options extends any
>(
  theRule: (
    options: T_Options
  ) => ItemEffect_RuleOptions<
    K_Type,
    K_PropertyName,
    ItemType,
    AllState,
    AllRefs,
    StepName
  >
) {
  // return theRule;
  return (options: T_Options) => ({ ...theRule(options), _isPerItem: true });
}
//
// type MakeDynamicEffectInlineFunction = <
//   K_Type extends T_ItemType,
//   T_Options extends any
// >(
//   theRule: (options: T_Options) => Effect_RuleOptions<K_Type>
// ) => (options: T_Options) => Effect_RuleOptions<K_Type>;
//
// type MakeDynamicItemEffectInlineFunction = <
//   K_Type extends T_ItemType,
//   K_PropertyName extends PropertyName<K_Type>,
//   T_Options extends any
// >(
//   theRule: (
//     options: T_Options
//   ) => ItemEffect_RuleOptions<K_Type, K_PropertyName>
// ) => (options: T_Options) => ItemEffect_RuleOptions<K_Type, K_PropertyName>;

function makeDynamicRules<
  K_RuleName extends string,
  T_MakeRule_Function extends (
    ...args: any
  ) => MakeRule_Rule<ItemType, AllState, AllRefs, StepName>,
  T_RulesToAdd = Record<K_RuleName, T_MakeRule_Function>
>(
  rulesToAdd: (arg0: {
    itemEffect: MakeDynamicItemEffectInlineFunction;
    effect: MakeDynamicEffectInlineFunction;
  }) => T_RulesToAdd
) {
  type RuleName = keyof ReturnType<typeof rulesToAdd>;
  const allRules = rulesToAdd({
    itemEffect: makeDynamicItemEffectInlineFunction,
    effect: makeDynamicEffectInlineFunction,
  });

  const ruleNames = Object.keys(allRules!) as RuleName[];

  const ruleNamePrefix = `${ruleNames
    .map((loopedName) => (loopedName as string).charAt(0))
    .join("")}`;
  // .join("")}${Math.random()}`;

  function ruleNamePostfixFromOptions(theOptions: any) {
    return JSON.stringify(theOptions);
  }

  function getWholeRuleName(ruleName: string, options: any) {
    return `${ruleNamePrefix}${ruleName}${ruleNamePostfixFromOptions(options)}`;
  }

  function start<K_ChosenRuleName extends keyof T_RulesToAdd & K_RuleName>(
    ruleName: K_ChosenRuleName,
    // @ts-ignore
    options: Parameters<T_RulesToAdd[K_ChosenRuleName]>[0]
  ) {
    const theRuleFunction = allRules[ruleName];
    if (theRuleFunction && typeof theRuleFunction === "function") {
      const editedRuleObject = theRuleFunction(options);
      if (!editedRuleObject.name) {
        editedRuleObject.name = getWholeRuleName(ruleName, options);
      }

      if (editedRuleObject._isPerItem !== undefined) {
        startItemEffect(editedRuleObject as any);
      } else {
        startEffect(editedRuleObject as any);
      }
    }
  }

  function stop<K_ChosenRuleName extends keyof T_RulesToAdd & K_RuleName>(
    ruleName: K_ChosenRuleName,
    // @ts-ignore
    options: Parameters<T_RulesToAdd[K_ChosenRuleName]>[0]
  ) {
    const theRuleFunction = allRules[ruleName];
    if (theRuleFunction && typeof theRuleFunction === "function") {
      const foundOrMadeRuleName =
        theRuleFunction(options)?.name || getWholeRuleName(ruleName, options);
      stopEffect(foundOrMadeRuleName);
    } else {
      console.log("no rule set for ", ruleName);
    }
  }

  // NOTE Experimental, if all the rules have the same options (BUT not typesafe at the moment)
  // ideally it can set startAll type as never if any of the options are different
  function startAll(
    // @ts-ignore
    options: Parameters<T_RulesToAdd[RuleName]>[0]
  ) {
    forEach(ruleNames, (ruleName: RuleName) => {
      // @ts-ignore
      start(ruleName, options);
    });
  }

  function stopAll(
    // @ts-ignore
    options: Parameters<T_RulesToAdd[RuleName]>[0]
  ) {
    forEach(ruleNames, (ruleName: RuleName) => {
      // @ts-ignore
      stop(ruleName, options);
    });
  }

  return {
    start,
    stop,
    ruleNames,
    startAll,
    stopAll,
  };
}

// ---------------------------------------------------
// Make Rule Makers
// ---------------------------------------------------

function makeRuleMaker<
  T_StoreName extends ItemType & string,
  T_StoreItemName extends keyof AllState[T_StoreName] & string,
  T_PropertyName extends keyof AllState[T_StoreName][T_StoreItemName] & string,
  T_StepName extends StepName,
  T_UsefulParams extends Record<any, any>
>(
  storeName: T_StoreName,
  storeItemName: T_StoreItemName,
  storyProperty: T_PropertyName,
  stepName?: T_StepName,
  getUsefulParams?: () => T_UsefulParams
) {
  type StoreState = AllState[T_StoreName][T_StoreItemName];

  type PropertyValue = StoreState[T_PropertyName];
  type RulesOptions = Partial<
    Record<PropertyValue, (usefulStuff: T_UsefulParams) => void>
  >;
  const ruleName = `customRuleFor_${storeName}_${storyProperty}${Math.random()}`;
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulStoryStuff = getUsefulParams?.();
          const latestValue = (getState() as AllState)[storeName][
            storeItemName
          ][storyProperty] as PropertyValue;

          callBacksObject[latestValue]?.(usefulStoryStuff!);
        },
        check: {
          prop: [storyProperty],
          name: storeItemName,
          type: storeName,
        } as unknown as EffectRule_Check<T_StoreName, ItemType, AllState>,
        step: stepName ?? "default",
        atStepEnd: true,
        name: ruleName,
      }),
    }));
  }

  return newRuleMaker;
}

function makeLeaveRuleMaker<
  T_StoreName extends ItemType & string,
  T_StoreItemName extends keyof AllState[T_StoreName] & string,
  T_PropertyName extends keyof AllState[T_StoreName][T_StoreItemName] & string,
  T_StepName extends StepName,
  T_UsefulParams extends Record<any, any>
>(
  storeName: T_StoreName,
  storeItemName: T_StoreItemName,
  storyProperty: T_PropertyName,
  stepName?: T_StepName,
  getUsefulParams?: () => T_UsefulParams
) {
  type StoreState = AllState[T_StoreName][T_StoreItemName];

  type PropertyValue = StoreState[T_PropertyName];
  type RulesOptions = Partial<
    Record<PropertyValue, (usefulStuff: T_UsefulParams) => void>
  >;
  const ruleName = `customRuleFor_${storeName}_${storyProperty}${Math.random()}`;
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulStoryStuff = getUsefulParams?.();
          const prevValue = (getPreviousState() as AllState)[storeName][
            storeItemName
          ][storyProperty] as PropertyValue;

          callBacksObject[prevValue]?.(usefulStoryStuff!);
        },
        check: {
          prop: [storyProperty],
          name: storeItemName,
          type: storeName,
        } as unknown as EffectRule_Check<T_StoreName, ItemType, AllState>,
        step: stepName ?? "default",
        atStepEnd: true,
        name: ruleName,
      }),
    }));
  }

  return newRuleMaker;
}

// makeNestedRuleMaker, similar to makeRuleMaker but accepts parameters for two store properties (can be from different stores) , and the callback fires when properties of both stores change
function makeNestedRuleMaker<
  T_StoreName1 extends ItemType & string,
  T_StoreItemName1 extends keyof AllState[T_StoreName1] & string,
  T_PropertyName1 extends keyof AllState[T_StoreName1][T_StoreItemName1] &
    string,
  T_StoreName2 extends ItemType & string,
  T_StoreItemName2 extends keyof AllState[T_StoreName2] & string,
  T_PropertyName2 extends keyof AllState[T_StoreName2][T_StoreItemName2] &
    string,
  T_StepName extends StepName,
  T_UsefulParams extends Record<any, any>
>(
  storeInfo1: [T_StoreName1, T_StoreItemName1, T_PropertyName1],
  storeInfo2: [T_StoreName2, T_StoreItemName2, T_PropertyName2],
  stepName?: T_StepName,
  getUsefulParams?: () => T_UsefulParams
) {
  const [storeName1, storeItemName1, storyProperty1] = storeInfo1;
  const [storeName2, storeItemName2, storyProperty2] = storeInfo2;

  type StoreState1 = AllState[T_StoreName1][T_StoreItemName1];
  type StoreState2 = AllState[T_StoreName2][T_StoreItemName2];

  type PropertyValue1 = StoreState1[T_PropertyName1];
  type PropertyValue2 = StoreState2[T_PropertyName2];
  type RulesOptions = Partial<
    Record<
      PropertyValue1,
      Partial<
        Record<
          PropertyValue2,
          (usefulStuff: ReturnType<NonNullable<typeof getUsefulParams>>) => void
        >
      >
    >
  >;
  const ruleName = `customRuleFor_${storeName1}_${storyProperty1}_${storeName2}_${storyProperty2}${Math.random()}`;
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulStoryStuff = getUsefulParams?.();
          const latestValue1 = (getState() as AllState)[storeName1][
            storeItemName1
          ][storyProperty1] as PropertyValue1;
          const latestValue2 = (getState() as AllState)[storeName2][
            storeItemName2
          ][storyProperty2] as PropertyValue2;

          callBacksObject[latestValue1]?.[latestValue2]?.(usefulStoryStuff!);
        },
        check: [
          { prop: [storyProperty1], name: storeItemName1, type: storeName1 },
          { prop: [storyProperty2], name: storeItemName2, type: storeName2 },
        ] as unknown as EffectRule_Check<
          T_StoreName1 | T_StoreName2,
          ItemType,
          AllState
        >,
        step: stepName ?? "default",
        atStepEnd: true,
        name: ruleName,
      }),
    }));
  }

  return newRuleMaker;
}

// makeNestedLeaveRuleMaker, the same as makeNestedRuleMaker , but the callback fires when the properties of both stores become NOT the specified values, but were previously
function makeNestedLeaveRuleMaker<
  T_StoreName1 extends ItemType & string,
  T_StoreItemName1 extends keyof AllState[T_StoreName1] & string,
  T_PropertyName1 extends keyof AllState[T_StoreName1][T_StoreItemName1] &
    string,
  T_StoreName2 extends ItemType & string,
  T_StoreItemName2 extends keyof AllState[T_StoreName2] & string,
  T_PropertyName2 extends keyof AllState[T_StoreName2][T_StoreItemName2] &
    string,
  T_UsefulParams extends Record<any, any>
>(
  storeInfo1: [T_StoreName1, T_StoreItemName1, T_PropertyName1],
  storeInfo2: [T_StoreName2, T_StoreItemName2, T_PropertyName2],
  stepName?: StepName,
  getUsefulParams?: () => T_UsefulParams
) {
  const [storeName1, storeItemName1, storyProperty1] = storeInfo1;
  const [storeName2, storeItemName2, storyProperty2] = storeInfo2;

  type StoreState1 = AllState[T_StoreName1][T_StoreItemName1];
  type StoreState2 = AllState[T_StoreName2][T_StoreItemName2];

  type PropertyValue1 = StoreState1[T_PropertyName1];
  type PropertyValue2 = StoreState2[T_PropertyName2];
  type RulesOptions = Partial<
    Record<
      PropertyValue1,
      Partial<Record<PropertyValue2, (usefulStuff: T_UsefulParams) => void>>
    >
  >;
  const ruleName = `customLeaveRuleFor_${storeName1}_${storyProperty1}_${storeName2}_${storyProperty2}${Math.random()}`;
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulParams = getUsefulParams?.();
          const latestValue1 = (getState() as AllState)[storeName1][
            storeItemName1
          ][storyProperty1] as PropertyValue1;
          const latestValue2 = (getState() as AllState)[storeName2][
            storeItemName2
          ][storyProperty2] as PropertyValue2;
          const prevValue1 = getPreviousState()[storeName1][storeItemName1][
            storyProperty1
          ] as PropertyValue1;
          const prevValue2 = getPreviousState()[storeName2][storeItemName2][
            storyProperty2
          ] as PropertyValue2;

          const callback = callBacksObject[prevValue1]?.[prevValue2];
          if (callback) callback(usefulParams!);
        },
        check: [
          { prop: [storyProperty1], name: storeItemName1, type: storeName1 },
          { prop: [storyProperty2], name: storeItemName2, type: storeName2 },
        ] as unknown as EffectRule_Check<
          T_StoreName1 | T_StoreName2,
          ItemType,
          AllState
        >,
        step: stepName ?? "default",
        atStepEnd: true,
        name: ruleName,
      }),
    }));
  }

  return newRuleMaker;
}

// ---------------------------------------------------
// Patches and Diffs
// ---------------------------------------------------

type ItemNamesByType = {
  [K_Type in ItemType]: ItemName<K_Type, ItemType, AllState>[];
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

function makeEmptyPatch() {
  return {
    changed: {} as StatesPatch["changed"],
    added: {} as StatesPatch["added"],
    removed: {} as StatesPatch["removed"],
  } as StatesPatch;
}
function makeEmptyDiff() {
  return {
    changedNext: {} as StatesDiff["changedNext"],
    changedPrev: {} as StatesDiff["changedPrev"],
    added: {} as StatesDiff["added"],
    removed: {} as StatesDiff["removed"],
  } as StatesDiff;
}

function makeEmptyDiffInfo() {
  const emptyDiffInfo: UntypedDiffInfo = {
    itemTypesChanged: [],
    itemsChanged: { all__: [] },
    propsChanged: {},
    itemsAdded: { all__: [] },
    itemsRemoved: { all__: [] },
    itemTypesChangedBool: {},
    itemsChangedBool: {},
    propsChangedBool: {},
    itemsAddedBool: {},
    itemsRemovedBool: {},
  };

  createDiffInfo(emptyDiffInfo);

  return emptyDiffInfo as DiffInfo<ItemType, AllState>;
}

function applyPatch(patch: StatesPatch) {
  const itemTypes = getItemTypes();

  forEach(itemTypes, (itemType) => {
    // Loop through removed items, and run removeRepondItem()
    forEach(patch.removed[itemType] ?? [], (itemName) =>
      removeItem({ type: itemType, name: itemName })
    );
    // Loop through added items and run addRepondItem()
    forEach(patch.added[itemType] ?? [], (itemName) =>
      addItem({
        type: itemType,
        name: itemName,
        state: patch.changed?.[itemType]?.[itemName],
      })
    );
  });
  // run setState(patch.changed)
  setState(patch.changed);
}

function applyPatchHere(
  newStates: GetPartialState<AllState>,
  patch: StatesPatch
) {
  const itemTypes = getItemTypes();
  const defaultStates = getDefaultStates();

  forEach(itemTypes, (itemType) => {
    // Loop through each removed item, and delete it from newStates
    forEach(patch.removed[itemType] ?? [], (itemName) => {
      const itemTypeState = newStates[itemType];
      if (itemTypeState && itemTypeState[itemName]) {
        delete itemTypeState[itemName];
      }
    });

    // Loop through each new item, and add it to newStates with state(itemName)
    forEach(patch.added[itemType] ?? [], (itemName) => {
      if (!newStates[itemType]) {
        newStates[itemType] = {} as (typeof newStates)[typeof itemType];
      }
      const itemTypeState = newStates[itemType];
      if (itemTypeState) {
        if (itemTypeState[itemName] === undefined) {
          itemTypeState[itemName] = defaultStates[itemType](itemName);
        }
      }
      if (itemTypeState && itemTypeState[itemName]) {
        delete itemTypeState[itemName];
      }
    });

    // Loop through each changed items and set the properties in newState
    const changedItemsForType = patch.changed[itemType];
    if (changedItemsForType !== undefined) {
      const changedItemNames = Object.keys(
        changedItemsForType as NonNullable<typeof changedItemsForType>
      ) as ItemNamesByType[typeof itemType];

      forEach(changedItemNames, (itemName) => {
        const changedPropertiesForItem = changedItemsForType[itemName];
        const itemTypeState = newStates[itemType];

        if (
          changedPropertiesForItem !== undefined &&
          itemTypeState !== undefined
        ) {
          const itemNameState = itemTypeState[itemName];
          if (itemNameState !== undefined) {
            const changePropertyNames = Object.keys(
              changedPropertiesForItem as NonNullable<
                typeof changedPropertiesForItem
              >
            ) as (keyof typeof changedPropertiesForItem & string)[];

            forEach(changePropertyNames, (propertyName) => {
              itemTypeState[itemName] = changedPropertiesForItem[propertyName];
            });
          }
        }
      });
    }
  });
}

function getPatchOrDiff(
  prevState: GetPartialState<AllState>,
  newState: GetPartialState<AllState>,
  patchOrDiff: "patch"
): StatesPatch;
function getPatchOrDiff(
  prevState: GetPartialState<AllState>,
  newState: GetPartialState<AllState>,
  patchOrDiff: "diff"
): StatesDiff;
function getPatchOrDiff<T_PatchOrDiff extends "patch" | "diff">(
  prevState: GetPartialState<AllState>,
  newState: GetPartialState<AllState>,
  patchOrDiff: T_PatchOrDiff
) {
  const itemTypes = getItemTypes();
  const defaultStates = getDefaultStates();

  const newPatch = makeEmptyPatch();
  const tempDiffInfo = makeEmptyDiffInfo();
  const tempManualUpdateChanges = initialRecordedChanges();

  try {
    meta.getStatesDiff(
      newState, // currentState
      prevState, // previousState
      tempDiffInfo,
      tempManualUpdateChanges, // manualUpdateChanges
      true // checkAllChanges
    );
  } catch (error: any) {
    console.log("Error");
    console.log(error);
  }

  // Then can use tempDiffInfo to make the patch (with items removed etc)
  forEach(itemTypes, (itemType) => {
    // Add added and removed with itemsAdded and itemsRemoved
    if (
      tempDiffInfo.itemsAdded[itemType] &&
      tempDiffInfo.itemsAdded[itemType].length > 0
    ) {
      newPatch.added[itemType] = tempDiffInfo.itemsAdded[itemType];
    }
    if (
      tempDiffInfo.itemsRemoved[itemType] &&
      tempDiffInfo.itemsRemoved[itemType].length > 0
    ) {
      newPatch.removed[itemType] = tempDiffInfo.itemsRemoved[itemType];
    }
  });

  // To add changed
  // Loop through items changes, then itemNamesChanged[itemType] then
  // propsChanged[itemType][itemName]
  // And set the changed to the value in newState
  forEach(tempDiffInfo.itemTypesChanged, (itemType) => {
    if (!newPatch.changed[itemType]) {
      newPatch.changed[itemType] = {};
    }
    const patchChangesForItemType = newPatch.changed[itemType];
    if (patchChangesForItemType) {
      forEach(tempDiffInfo.itemsChanged[itemType], (itemName) => {
        if (!patchChangesForItemType[itemName]) {
          patchChangesForItemType[itemName] = {};
        }
        const patchChangesForItemName = patchChangesForItemType[itemName];

        if (patchChangesForItemName) {
          const propsChangedForType = tempDiffInfo.propsChanged[itemType];
          forEach(
            propsChangedForType[itemName as keyof typeof propsChangedForType],
            (propertyName) => {
              patchChangesForItemName[propertyName] =
                newState?.[itemType]?.[itemName]?.[propertyName];
            }
          );
        }
      });
    }
  });

  // Need to also add non-default properties for new items to changed
  // For each item added,
  // const defaultState = defaultStates[itemType](itemName)
  // const newState = newState[itemType][itemName]
  // Loop through each property and compare
  // If they’re different, add it to the changed object

  forEach(itemTypes, (itemType) => {
    if (newPatch?.added[itemType]?.length) {
      const itemNamesAddedForType = newPatch.added[itemType];

      const newItemTypeState = newState[itemType];

      let propertyNamesForItemType = [] as PropertyName<
        typeof itemType,
        ItemType,
        AllState
      >[];
      let propertyNamesHaveBeenFound = false;
      forEach(itemNamesAddedForType ?? [], (itemName) => {
        const defaultItemState = defaultStates[itemType](itemName);
        const addedItemState = newItemTypeState?.[itemName];

        if (!propertyNamesHaveBeenFound) {
          propertyNamesForItemType = Object.keys(
            defaultItemState
          ) as PropertyName<typeof itemType, ItemType, AllState>[];
          propertyNamesHaveBeenFound = true;
        }

        if (addedItemState) {
          forEach(propertyNamesForItemType, (propertyName) => {
            const defaultPropertyValue = defaultItemState[propertyName];
            const newPropertyValue = addedItemState?.[propertyName];

            if (
              defaultPropertyValue !== undefined &&
              newPropertyValue !== undefined
            ) {
              let valuesAreTheSame = defaultPropertyValue === newPropertyValue;

              if (typeof newPropertyValue === "object") {
                valuesAreTheSame =
                  JSON.stringify(defaultPropertyValue) ===
                  JSON.stringify(newPropertyValue);
              }
              if (!valuesAreTheSame) {
                if (!newPatch.changed[itemType]) {
                  newPatch.changed[itemType] = {};
                }
                const newPatchChangedForItemType = newPatch.changed[itemType];
                if (newPatchChangedForItemType) {
                  if (!newPatchChangedForItemType[itemName]) {
                    newPatchChangedForItemType[itemName] = {};
                  }
                  const newPatchChangedForItemName =
                    newPatchChangedForItemType[itemName];

                  if (newPatchChangedForItemName) {
                    newPatchChangedForItemName[propertyName] = newPropertyValue;
                  }
                }
              }
            }
          });
        }
      });
    }
  });
  if (patchOrDiff === "patch") {
    return newPatch;
  }
  const newDiff = makeEmptyDiff();
  newDiff.added = newPatch.added;
  newDiff.removed = newPatch.removed;
  newDiff.changedNext = newPatch.changed;

  // Need to also add non-default properties for removed items to changedPrev
  // For each item removed,
  // const defaultState = defaultStates[itemType](itemName)
  // const newState = prevState[itemType][itemName]
  // Loop through each property and compare
  // If they’re different, add it to the changedPrev object
  // (same as for added, but instead of adding to newPatch.changed, it's to newDiff.changedPrev, and checking the prevState)

  forEach(itemTypes, (itemType) => {
    if (newDiff.removed[itemType]?.length) {
      const itemNamesRemovedForType = newDiff.removed[itemType];

      const prevItemTypeState = prevState[itemType];

      let propertyNamesForItemType = [] as PropertyName<
        typeof itemType,
        ItemType,
        AllState
      >[];
      let propertyNamesHaveBeenFound = false;
      forEach(itemNamesRemovedForType ?? [], (itemName) => {
        const defaultItemState = defaultStates[itemType](itemName);
        const removedItemState = prevItemTypeState?.[itemName];

        if (!propertyNamesHaveBeenFound) {
          propertyNamesForItemType = Object.keys(
            defaultItemState
          ) as PropertyName<typeof itemType, ItemType, AllState>[];
          propertyNamesHaveBeenFound = true;
        }

        if (removedItemState) {
          forEach(propertyNamesForItemType, (propertyName) => {
            const defaultPropertyValue = defaultItemState[propertyName];
            const newPropertyValue = removedItemState?.[propertyName];

            if (
              defaultPropertyValue !== undefined &&
              newPropertyValue !== undefined
            ) {
              let valuesAreTheSame =
                removedItemState[propertyName] === newPropertyValue;

              if (typeof newPropertyValue === "object") {
                valuesAreTheSame =
                  JSON.stringify(defaultPropertyValue) ===
                  JSON.stringify(newPropertyValue);
              }
              if (!valuesAreTheSame) {
                if (!newDiff.changedPrev[itemType]) {
                  newDiff.changedPrev[itemType] = {};
                }
                const newDiffChangedForItemType = newDiff.changedPrev[itemType];
                if (newDiffChangedForItemType) {
                  if (!newDiffChangedForItemType[itemName]) {
                    newDiffChangedForItemType[itemName] = {};
                  }
                  const newDiffChangedForItemName =
                    newDiffChangedForItemType[itemName];

                  if (newDiffChangedForItemName) {
                    newDiffChangedForItemName[propertyName] = newPropertyValue;
                  }
                }
              }
            }
          });
        }
      });
    }
  });

  return newDiff;
}

function getPatch(
  prevState: GetPartialState<AllState>,
  newState: GetPartialState<AllState>
) {
  return getPatchOrDiff(prevState, newState, "patch");
}

function getPatchAndReversed(
  prevState: GetPartialState<AllState>,
  newState: GetPartialState<AllState>
) {
  const patch = getPatch(prevState, newState);
  const reversePatch = getPatch(newState, prevState);
  return [patch, reversePatch];
}

function getReversePatch(
  partialState: GetPartialState<AllState>,
  newPatch: StatesPatch
) {
  const prevState: GetPartialState<AllState> = {};
  meta.copyStates(partialState, prevState);
  const newState: GetPartialState<AllState> = {};
  meta.copyStates(partialState, newState);
  applyPatchHere(newState, newPatch);
  const reversePatch = getPatch(newState, prevState);
  return reversePatch;
}

function combineTwoPatches(prevPatch: StatesPatch, newPatch: StatesPatch) {
  const itemTypes = getItemTypes();
  const combinedPatch = makeEmptyPatch();
  //
  forEach(itemTypes, (itemType) => {
    // combine added and removed , and remove duplicates

    const itemsAddedPrev = prevPatch.added[itemType];
    const itemsAddedNew = newPatch.added[itemType];

    const hasAddedItems = itemsAddedPrev?.length || itemsAddedNew?.length;

    if (hasAddedItems) {
      combinedPatch.added[itemType] = getUniqueArrayItems([
        ...(itemsAddedPrev ?? ([] as ItemNamesByType[typeof itemType])),
        ...(itemsAddedNew ?? ([] as ItemNamesByType[typeof itemType])),
      ]);
    }

    const itemsRemovedPrev = prevPatch.removed[itemType];
    const itemsRemovedNew = newPatch.removed[itemType];

    const hasRemovedItems =
      (itemsRemovedPrev && itemsRemovedPrev.length > 0) ||
      (itemsRemovedNew && itemsRemovedNew.length > 0);

    if (hasRemovedItems) {
      combinedPatch.removed[itemType] = getUniqueArrayItems([
        ...(itemsRemovedPrev ?? ([] as ItemNamesByType[typeof itemType])),
        ...(itemsRemovedNew ?? ([] as ItemNamesByType[typeof itemType])),
      ]);
    }

    // Anything in removed in prev that was added in new, removed from removed
    if (itemsRemovedPrev && itemsAddedNew) {
      combinedPatch.removed[itemType] = combinedPatch.removed[itemType]!.filter(
        (itemName) => {
          if (
            itemsRemovedPrev.includes(itemName) &&
            itemsAddedNew.includes(itemName)
          ) {
            return false;
          }

          return true;
        }
      );
    }

    // Anything in removed in new that was added in prev, removed from added
    if (itemsRemovedNew && itemsAddedPrev) {
      combinedPatch.added[itemType] = combinedPatch.added[itemType]!.filter(
        (itemName) => {
          if (
            itemsRemovedNew.includes(itemName) &&
            itemsAddedPrev.includes(itemName)
          ) {
            return false;
          }
          return true;
        }
      );
    }

    // Merge changes

    const itemsChangedPrev = prevPatch.changed[itemType];
    const itemsChangedNew = prevPatch.changed[itemType];

    const hasChangedItems = itemsChangedPrev || itemsChangedNew;

    if (hasChangedItems) {
      const allChangedItemNames = Object.keys({
        ...(itemsChangedPrev ?? {}),
        ...(itemsChangedNew ?? {}),
      }) as ItemName<typeof itemType, ItemType, AllState>[];

      if (!combinedPatch.changed[itemType]) {
        combinedPatch.changed[itemType] = {};
      }
      const combinedPatchChangedForItemType = combinedPatch.changed[itemType];

      if (combinedPatchChangedForItemType) {
        forEach(allChangedItemNames, (itemName) => {
          const combinedPatchChangedForItemName =
            combinedPatchChangedForItemType[itemName];
          type LoopedItemNameChanges = typeof combinedPatchChangedForItemName;

          combinedPatchChangedForItemType[itemName] = {
            ...(itemsChangedPrev?.[itemName] ?? {}),
            ...(itemsChangedNew?.[itemName] ?? {}),
          } as LoopedItemNameChanges;
        });

        // Remove any item changes that are in removed
        forEach(combinedPatch.removed[itemType] ?? [], (itemName) => {
          if (combinedPatchChangedForItemType[itemName]) {
            delete combinedPatchChangedForItemType[itemName];
          }
        });
      }
    }
  });
  return combinedPatch;
}

function combinePatches(patchesArray: StatesPatch[]) {
  let combinedPatches = patchesArray[0];
  forEach(patchesArray, (loopedPatch, index) => {
    const currentPatch = combinedPatches;
    const nextPatch = patchesArray[index + 1];
    if (nextPatch) {
      combinedPatches = combineTwoPatches(currentPatch, nextPatch);
    }
  });
  return combinedPatches;
}

function makeMinimalPatch(
  currentStates: GetPartialState<AllState>,
  thePatch: StatesPatch
) {
  const itemTypes = getItemTypes();
  const defaultStates = getDefaultStates();

  const minimalPatch = cloneObjectWithJson(thePatch) as StatesPatch;
  // Loop through the changed items, and each changed property
  forEach(itemTypes, (itemType) => {
    const propertyNames = Object.keys(
      defaultStates[itemType]("anItemName")
    ) as PropertyName<typeof itemType, ItemType, AllState>[];

    const changedForType = minimalPatch.changed[itemType];
    if (changedForType) {
      const changedItemNames = Object.keys(changedForType ?? {}) as ItemName<
        typeof itemType,
        ItemType,
        AllState
      >[];
      forEach(changedItemNames, (itemName) => {
        const changedForItem = changedForType[itemName];
        const itemState = currentStates?.[itemType]?.[itemName];
        if (changedForItem && itemState) {
          forEach(propertyNames, (propertyName) => {
            // If the value’s the same as state, remove that change property
            if (changedForItem[propertyName] === itemState[propertyName]) {
              delete changedForItem[propertyName];
            }
          });
        }
        // (if the item has no more properties, remove that changed item)
        const changedPropertyNames = Object.keys(changedForItem ?? {});
        if (changedPropertyNames.length === 0) {
          delete changedForType[itemName];
        }
      });
    }
    // Loop through the added items, if the item already exists in state, remove it from added
    if (minimalPatch.added[itemType]) {
      minimalPatch.added[itemType] = minimalPatch.added[itemType]!.filter(
        (itemName) => !!currentStates?.[itemType]?.[itemName]
      );
    }

    // Loop through the removed items, if the item doesn’t exist in state, remove it from removed
    if (minimalPatch.removed[itemType]) {
      minimalPatch.removed[itemType] = minimalPatch.removed[itemType]!.filter(
        (itemName) => !currentStates?.[itemType]?.[itemName]
      );
    }
  });
}

function removePartialPatch(thePatch: StatesPatch, patchToRemove: StatesPatch) {
  const newPatch = cloneObjectWithJson(thePatch) as StatesPatch;
  const itemTypes = getItemTypes();

  forEach(itemTypes, (itemType) => {
    // Loop through removed in patchToRemove, if it’s in newPatch , remove it
    if (newPatch.removed[itemType]) {
      newPatch.removed[itemType] = newPatch.removed[itemType]!.filter(
        (itemName) => !patchToRemove.removed[itemType]!.includes(itemName)
      );
    }
    // Loop through added in patchToRemove, if it’s in newPatch , remove it
    // Keep track of noLongerAddedItems { itemType: []
    const noLongerAddedItems: ItemName<ItemType, ItemType, AllState>[] = [];
    if (newPatch.added[itemType]) {
      newPatch.added[itemType] = newPatch.added[itemType]!.filter(
        (itemName) => {
          const shouldKeep = !patchToRemove.added[itemType]!.includes(itemName);
          if (!shouldKeep) {
            noLongerAddedItems.push(itemName);
          }
          return shouldKeep;
        }
      );
    }

    // Loop through changed items, if the same change is in patchToRemove and newPatch, remove it from new patch
    const removedPatchChangedForType = patchToRemove.changed[itemType];
    const newPatchChangedForType = newPatch.changed[itemType];
    if (removedPatchChangedForType && newPatchChangedForType) {
      const changedItemNames = Object.keys(
        removedPatchChangedForType ?? {}
      ) as ItemName<typeof itemType, ItemType, AllState>[];
      forEach(changedItemNames, (itemName) => {
        const removedPatchChangedForItem = removedPatchChangedForType[itemName];
        const newPatchChangedForItem = newPatchChangedForType[itemName];

        if (removedPatchChangedForItem && newPatchChangedForItem) {
          // (if the item has no more properties, remove that changed item)
          const removedPatchChangedPropertyNames = Object.keys(
            removedPatchChangedForItem ?? {}
          ) as (keyof typeof removedPatchChangedForItem & string)[];

          forEach(removedPatchChangedPropertyNames, (propertyName) => {
            if (
              JSON.stringify(removedPatchChangedForItem[propertyName]) ===
              JSON.stringify(newPatchChangedForItem[propertyName])
            ) {
              delete newPatchChangedForItem[propertyName];
            }
          });
        }

        const changedPropertyNamesB = Object.keys(
          removedPatchChangedForItem ?? {}
        );

        // If there's no more property changes for an item name, or that item isn't added anymore, then remove it from changes
        const noMorePropertyChanges = changedPropertyNamesB.length === 0;
        if (noMorePropertyChanges || noLongerAddedItems.includes(itemName)) {
          delete newPatchChangedForType[itemName];
        }
      });
    }
  });
}

function getDiff(
  prevState: GetPartialState<AllState>,
  newState: GetPartialState<AllState>
) {
  return getPatchOrDiff(prevState, newState, "diff");
}

function getDiffFromPatches(
  forwardPatch: StatesPatch,
  reversePatch: StatesPatch
) {
  const newDiff = makeEmptyDiff();
  newDiff.added = forwardPatch.added;
  newDiff.removed = forwardPatch.removed;
  newDiff.changedNext = forwardPatch.changed;
  newDiff.changedPrev = reversePatch.changed;
  //
  //
  // Maybe if forwardPatch.added/ removed isnt same as backwardPatch removed/added then show warning, but use the forward patch?
  return newDiff;
}

function getPatchesFromDiff(theDiff: StatesDiff) {
  const forwardPatch = makeEmptyPatch();
  const reversePatch = makeEmptyPatch();
  forwardPatch.added = theDiff.added;
  forwardPatch.removed = theDiff.removed;
  reversePatch.added = theDiff.removed;
  reversePatch.removed = theDiff.added;
  forwardPatch.changed = theDiff.changedNext;
  reversePatch.changed = theDiff.changedPrev;
  return [forwardPatch, reversePatch] as [StatesPatch, StatesPatch];
}

function combineTwoDiffs(prevDiff: StatesDiff, newDiff: StatesDiff) {
  const [prevForwardPatch, prevReversePatch] = getPatchesFromDiff(prevDiff);
  const [newForwardPatch, newReversePatch] = getPatchesFromDiff(prevDiff);
  const combinedForwardPatch = combineTwoPatches(
    prevForwardPatch,
    newForwardPatch
  );
  const combinedReversePatch = combineTwoPatches(
    prevReversePatch,
    newReversePatch
  );

  return getDiffFromPatches(combinedForwardPatch, combinedReversePatch);
}

function combineDiffs(diffsArray: StatesDiff[]) {
  let combinedDiffs = diffsArray[0];
  forEach(diffsArray, (loopedDiff, index) => {
    const currentDiff = combinedDiffs;
    const nextDiff = diffsArray[index + 1];
    if (nextDiff) {
      combinedDiffs = combineTwoDiffs(currentDiff, nextDiff);
    }
  });
  return combinedDiffs;
}

export {
  getPreviousState,
  getState,
  setState,
  onNextTick,
  getRefs,
  getItem,
  makeRules,
  makeDynamicRules,
  makeRuleMaker,
  makeLeaveRuleMaker,
  makeNestedRuleMaker,
  makeNestedLeaveRuleMaker,
  startEffect,
  startItemEffect,
  stopEffect,
  useStore,
  useStoreEffect,
  useStoreItem,
  useStoreItemEffect,
  useStoreItemPropsEffect,
  addItem,
  removeItem,
  // patches and diffs
  makeEmptyPatch,
  makeEmptyDiff,
  applyPatch,
  applyPatchHere,
  getPatch,
  getPatchAndReversed,
  getReversePatch,
  combineTwoPatches,
  combinePatches,
  makeMinimalPatch,
  removePartialPatch,
  getDiff,
  getDiffFromPatches,
  getPatchesFromDiff,
  combineTwoDiffs,
  combineDiffs,
};
