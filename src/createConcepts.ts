import meta, {
  toSafeListenerName,
  UntypedListener,
  initialRecordedChanges,
} from "./meta";
import { getConceptoStructureFromDefaults } from "./getStructureFromDefaults";
import makeCopyStatesFunction from "./copyStates";
import makeGetStatesDiffFunction from "./getStatesDiff";
import { breakableForEach, forEach } from "shutils/dist/loops";

import {
  _addItem,
  _removeItem,
  _setState,
  runWhenStartingConceptoListeners,
  runWhenStoppingConceptoListeners,
} from "./setting";
import {
  KeysOfUnion,
  DeepReadonly,
  SetConceptoState,
  XOR,
  ListenerType,
  ExtendsString,
  GetPartialState,
  ConceptoCallback,
} from "./types";
import {
  makeRefsStructureFromConceptoState,
  cloneObjectWithJson,
  asArray,
  toSafeArray,
} from "./utils";
import { useLayoutEffect, useState, useCallback, useEffect } from "react";
import {
  addItemToUniqueArray,
  removeItemFromArray,
  getUniqueArrayItems,
} from "shutils/dist/arrays";

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

type ItemName<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = ExtendsString<KeysOfUnion<T_State[K_Type]>>;

type PropertyName<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = KeysOfUnion<T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>]>;

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
  | "different"
  | "true"
  | "false"
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
  T_FlowName extends string
> = {
  check: ItemEffectRule_Check<K_Type, K_PropertyName, T_ItemType, T_State>;
  // can use function to check value, ideally it uses the type of the selected property
  onItemEffect: ItemEffectCallback<
    K_Type,
    K_PropertyName,
    T_ItemType,
    T_State,
    T_Refs
  >;
  whenToRun?: "derive" | "subscribe";
  name?: string;
  flow?: T_FlowName;
};

// -----------------
// AnyChangeRule ( like a slightly different and typed concepto listener )

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
> = (diffInfo: DiffInfo<T_ItemType, T_State>, frameDuration: number) => void;

type Effect_RuleOptions<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_FlowName extends string
> = {
  name?: string; // ruleName NOTE used to be required (probably still for dangerouslyAddingRule ? (adding single rules without making rules first))
  check: EffectRule_Check<K_Type, T_ItemType, T_State>;
  onEffect: EffectCallback<T_ItemType, T_State>;
  whenToRun?: "derive" | "subscribe";
  flow?: T_FlowName;
};

type Effect_RuleOptions_NameRequired<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_FlowName extends string
> = Effect_RuleOptions<K_Type, T_ItemType, T_State, T_FlowName> & {
  name: string;
};

type FlexibleRuleOptions<
  K_Type extends T_ItemType,
  K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_FlowName extends string
> = XOR<
  Effect_RuleOptions<K_Type, T_ItemType, T_State, T_FlowName>,
  ItemEffect_RuleOptions<
    K_Type,
    K_PropertyName,
    T_ItemType,
    T_State,
    T_Refs,
    T_FlowName
  >
>;

type MakeRule_Rule<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_FlowName extends string
> = FlexibleRuleOptions<
  T_ItemType,
  PropertyName<T_ItemType, T_ItemType, T_State>,
  T_ItemType,
  T_State,
  T_Refs,
  T_FlowName
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
  T_FlowName extends string
> = {
  name: string;
  changesToCheck: Listener_Check<K_Type, T_ItemType, T_State>;
  whatToDo: (
    diffInfo: DiffInfo<T_ItemType, T_State>,
    frameDuration: number
  ) => void;
  listenerType?: ListenerType;
  flow?: T_FlowName;
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
  listenerType?: ListenerType;
  flow?: string;
};

// -----------------
//

type UseStoreItemParams<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_Refs extends Record<any, any>,
  T_State extends Record<any, any>
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
T_FlowName extends string,

*/

export function _createConcepts<
  T_AllInfo extends {
    [T_ItemType: string]: {
      state: (itemName: any) => any;
      refs: (itemName: any, type: any) => any;
      startStates?: Record<any, any>;
    };
  },
  T_ItemType extends keyof T_AllInfo,
  // T_ItemType extends keyof T_AllInfo,
  T_FlowNamesParam extends Readonly<string[]>
>(
  allInfo: T_AllInfo,
  extraOptions?: {
    flowNames: T_FlowNamesParam;
    dontSetMeta?: boolean; // when only wanting to use _createConcepts for the types
  }
) {
  const { dontSetMeta } = extraOptions ?? {};
  const itemTypes = (Object.keys(allInfo) as unknown) as Readonly<T_ItemType[]>;
  type T_FlowName = T_FlowNamesParam[number] | "default";

  const flowNamesUntyped = extraOptions?.flowNames
    ? [...extraOptions.flowNames]
    : ["default"];
  if (!flowNamesUntyped.includes("default")) flowNamesUntyped.push("default");

  const flowNames: Readonly<T_FlowName[]> = [...flowNamesUntyped];

  if (!dontSetMeta) {
    meta.flowNames = flowNames;
    meta.currentFlowIndex = 0;
    meta.currentFlowName = flowNames[meta.currentFlowIndex];
  }

  type DefaultStates = { [K_Type in T_ItemType]: T_AllInfo[K_Type]["state"] };
  type DefaultRefs = { [K_Type in T_ItemType]: T_AllInfo[K_Type]["refs"] };
  type Get_DefaultRefs<
    K_Type extends keyof T_AllInfo
  > = T_AllInfo[K_Type]["refs"];

  type StartStatesItemName<
    K_Type extends keyof T_AllInfo
  > = T_AllInfo[K_Type]["startStates"] extends Record<string, any>
    ? keyof T_AllInfo[K_Type]["startStates"]
    : string;

  type T_State = {
    [K_Type in T_ItemType]: Record<
      StartStatesItemName<K_Type>,
      ReturnType<T_AllInfo[K_Type]["state"]>
    >;
  };

  type T_Refs = {
    [K_Type in T_ItemType]: Record<
      StartStatesItemName<K_Type>,
      ReturnType<Get_DefaultRefs<K_Type>>
    >;
  };

  // type Get_T_Refs<K_Type extends T_ItemType> = Record<
  //   StartStatesItemName<K_Type>,
  //   ReturnType<Get_DefaultRefs<K_Type>>
  // >;
  const defaultStates: DefaultStates = itemTypes.reduce((prev: any, key) => {
    prev[key] = allInfo[key].state;
    return prev;
  }, {});
  const defaultRefs: DefaultRefs = itemTypes.reduce((prev: any, key) => {
    prev[key] = allInfo[key].refs;
    return prev;
  }, {});

  const initialState: T_State = itemTypes.reduce((prev: any, key) => {
    prev[key] =
      allInfo[key].startStates || ({} as StartStatesItemName<typeof key>);
    return prev;
  }, {});

  // ------------------------------------------------
  // Setup Concepto
  // ------------------------------------------------

  if (!dontSetMeta) {
    const currentState: T_State = cloneObjectWithJson(initialState);
    const previousState: T_State = cloneObjectWithJson(initialState);
    // store initialState and set currentState
    meta.initialState = initialState;
    meta.currentState = currentState;
    meta.previousState = previousState;
    meta.defaultStateByItemType = defaultStates as any;
    meta.defaultRefsByItemType = defaultRefs as any;

    getConceptoStructureFromDefaults(); // sets itemTypeNames and propertyNamesByItemType
    makeRefsStructureFromConceptoState(); // sets currenConceptoRefs based on itemNames from concepto state

    meta.copyStates = makeCopyStatesFunction();
    meta.getStatesDiff = makeGetStatesDiffFunction();
    meta.mergeStates = makeCopyStatesFunction("merge");
  }
  // --------------------------------------------------------------------------
  // types
  // --------------------------------------------------------------------------

  // type ItemName<K_Type extends T_ItemType> = ExtendsString<
  //   KeysOfUnion<T_State[K_Type]>
  // >;
  //
  // type PropertyName<K_Type extends T_ItemType> = KeysOfUnion<
  //   T_State[K_Type][ItemName<K_Type>]
  // >;
  //
  // type AllProperties = {
  //   [K_Type in T_ItemType]: PropertyName<K_Type>;
  // }[T_ItemType];

  // ----------------------------
  // Diff Info
  //
  // type DiffInfo_PropertiesChanged = {
  //   [K_Type in T_ItemType]: Record<ItemName<K_Type>, PropertyName<K_Type>[]> & {
  //     all__: PropertyName<K_Type>[];
  //   };
  // } & {
  //   all__: AllProperties[];
  // };
  // type DiffInfo_PropertiesChangedBool = {
  //   [K_Type in T_ItemType]: Record<
  //     ItemName<K_Type>,
  //     { [K_PropName in PropertyName<K_Type>]: boolean }
  //   > & { all__: { [K_PropName in PropertyName<K_Type>]: boolean } };
  // } & {
  //   all__: { [K_PropName in AllProperties]: boolean };
  // };
  //
  // type DiffInfo_ItemsChanged = Record<
  //   T_ItemType | "all__",
  //   ItemName<T_ItemType>[]
  // >;
  //
  // type DiffInfo_ItemsChangedBool = Record<
  //   T_ItemType | "all__",
  //   Record<ItemName<T_ItemType>, boolean>
  // >;
  //
  // type DiffInfo = {
  //   itemTypesChanged: T_ItemType[];
  //   itemsChanged: DiffInfo_ItemsChanged;
  //   propsChanged: DiffInfo_PropertiesChanged;
  //   itemsAdded: DiffInfo_ItemsChanged;
  //   itemsRemoved: DiffInfo_ItemsChanged;
  //   itemTypesChangedBool: Record<T_ItemType | "all__", boolean>;
  //   itemsChangedBool: DiffInfo_ItemsChangedBool;
  //   propsChangedBool: DiffInfo_PropertiesChangedBool;
  //   itemsAddedBool: DiffInfo_ItemsChangedBool;
  //   itemsRemovedBool: DiffInfo_ItemsChangedBool;
  // };
  //
  // // ----------------------------
  // //  Listener types
  //
  // type Listener_ACheck_OneItemType<K_Type extends T_ItemType> = {
  //   types?: K_Type;
  //   names?: ItemName<K_Type>[];
  //   props?: PropertyName<K_Type>;
  //   addedOrRemoved?: boolean;
  // };
  //
  // type Listener_ACheck_MultipleItemTypes = {
  //   types?: (keyof T_State)[];
  //   names?: ItemName<T_ItemType>[];
  //   props?: AllProperties[];
  //   addedOrRemoved?: boolean;
  // };
  //
  // // NOTE: the type works, but autocomplete doesn't work ATM when
  // // trying to make properties/addedOrRemoved exclusive
  // // type TestChangeToCheckUnionWithProperties<T, K> = XOR<
  // //   Omit<TestChangeToCheckMultipleItemTypes<T>, "addedOrRemoved">,
  // //   Omit<TestChangeToCheckOneItemType<T, K>, "addedOrRemoved">
  // // >;
  // // type TestChangeToCheckUnionWithoutProperties<T, K> = XOR<
  // //   Omit<TestChangeToCheckMultipleItemTypes<T>, "properties">,
  // //   Omit<TestChangeToCheckOneItemType<T, K>, "properties">
  // // >;
  //
  // // type TestChangeToCheckUnion<T, K> = XOR<
  // //   TestChangeToCheckUnionWithProperties<T, K>,
  // //   TestChangeToCheckUnionWithoutProperties<T, K>
  // // >;
  // type Listener_ACheck<K_Type extends T_ItemType> =
  //   | Listener_ACheck_OneItemType<K_Type>
  //   | Listener_ACheck_MultipleItemTypes;
  // type Listener_Check<K_Type extends T_ItemType> =
  //   | Listener_ACheck<K_Type>[]
  //   | Listener_ACheck<K_Type>;
  //
  // type AddItemOptionsUntyped<
  //   T_State extends Record<any, any>,
  //   T_Refs extends Record<any, any>,
  //   T_TypeName
  // > = {
  //   type: string;
  //   name: string;
  //   state?: Partial<
  //     NonNullable<T_State[T_TypeName]>[keyof T_State[keyof T_State]]
  //   >;
  //   refs?: Partial<NonNullable<T_Refs[T_TypeName]>[keyof T_Refs[keyof T_Refs]]>;
  // };
  //
  // // -----------------
  // // Listeners B
  //
  // type Listener<K_Type extends T_ItemType> = {
  //   name: string;
  //   changesToCheck: Listener_Check<K_Type>;
  //   whatToDo: (diffInfo: DiffInfo, frameDuration: number) => void;
  //   listenerType?: ListenerType;
  //   flow?: T_FlowName;
  // };
  //
  // // After normalizing
  // type ListenerAfterNormalising<K_Type extends T_ItemType> = {
  //   name: string;
  //   changesToCheck: Listener_ACheck<K_Type>[];
  //   whatToDo: (diffInfo: DiffInfo, frameDuration: number) => void;
  //   listenerType?: ListenerType;
  //   flow?: string;
  // };
  //
  // // -----------------
  // //
  //
  // type UseStoreItemParams<K_Type extends T_ItemType> = {
  //   itemName: ItemName<K_Type>;
  //   prevItemState: T_State[K_Type][ItemName<K_Type>];
  //   itemState: T_State[K_Type][ItemName<K_Type>];
  //   // itemRefs: T_Refs[K_Type][keyof T_Refs[K_Type]];
  //   itemRefs: T_Refs[K_Type][ItemName<K_Type>];
  //   // frameDuration: number;
  // };

  // -----------------------------------------------------------------
  // main functions
  // -----------------------------------------------------------------

  const getState = (): DeepReadonly<T_State> =>
    meta.currentState as DeepReadonly<T_State>;

  const setState: SetConceptoState<T_State> = (newState, callback) =>
    _setState(newState, callback);

  function onNextTick(callback: ConceptoCallback) {
    meta.callforwardsQue.push(callback);
  }

  const getPreviousState = (): T_State => meta.previousState as T_State;

  const getRefs = (): T_Refs => meta.currentRefs as T_Refs;

  // -------------------------------------------------------
  // utils
  // -------------------------------------------------------

  // Convert an itemEffect callback to a regular effect callback
  // NOTE: not typed but only internal
  function itemEffectCallbackToEffectCallback<K_Type extends T_ItemType>({
    theItemType,
    theItemName,
    thePropertyNames,
    whatToDo,
    becomes,
  }: {
    theItemType?: K_Type | K_Type[];
    theItemName?: ItemName<K_Type, T_ItemType, T_State>[];
    thePropertyNames: AllProperties<T_ItemType, T_State>[];
    whatToDo: (
      options: any
    ) => // options: IfPropertyChangedWhatToDoParams<
    //   T_State,
    //   T_ItemType,
    //   T_PropertyName
    // >
    any;
    becomes: ACheck_Becomes;
  }) {
    const editedItemTypes = asArray(theItemType);
    let allowedItemNames:
      | { [itemName: string]: boolean }
      | undefined = undefined;

    if (Array.isArray(theItemName)) {
      allowedItemNames = {};
      forEach(theItemName, (loopedItemName) => {
        if (allowedItemNames) {
          allowedItemNames[loopedItemName as string] = true;
        }
      });
    }

    return (diffInfo: DiffInfo<T_ItemType, T_State>, frameDuration: number) => {
      forEach(editedItemTypes, (theItemType) => {
        const prevItemsState = getPreviousState()[theItemType] as any;
        const itemsState = (getState() as T_State)[theItemType];
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

          breakableForEach(thePropertyNames, (thePropertyName) => {
            if (
              !(diffInfo.propsChangedBool as any)[theItemType][
                itemNameThatChanged
              ][thePropertyName]
            )
              return;

            const newValue = itemsState[itemNameThatChanged][thePropertyName];

            // start the movment animation
            let canRunWhatToDo = false;

            if (typeof becomes === "function") {
              canRunWhatToDo = becomes(
                newValue,
                prevItemsState[itemNameThatChanged][thePropertyName]
              );
            } else {
              if (
                typeof becomes === "string" &&
                ((becomes === "true" && newValue === true) ||
                  (becomes === "false" && newValue === false) ||
                  becomes === "different")
              ) {
                canRunWhatToDo = true;
              }
            }

            if (!canRunWhatToDo) return;

            whatToDo(
              {
                itemName: itemNameThatChanged,
                newValue,
                previousValue:
                  prevItemsState[itemNameThatChanged][thePropertyName],
                itemState: itemsState[itemNameThatChanged],
                itemRefs: itemsRefs[itemNameThatChanged],
                frameDuration,
              }
              // as IfPropertyChangedWhatToDoParams<T_ItemType>
            );
            return true; // break out of the loop, so it only runs once
          });
        });
      });
    };
  }

  // converts a concepto effect to a normalised 'listener', where the names are an array instead of one
  function anyChangeRuleACheckToListenerACheck<K_Type extends T_ItemType>(
    checkProperty: EffectRule_ACheck<K_Type, T_ItemType, T_State>
  ) {
    return {
      names: toSafeArray(checkProperty.name),
      types: checkProperty.type as Listener_ACheck<
        K_Type,
        T_ItemType,
        T_State
      >["types"],
      props: checkProperty.prop,
      addedOrRemoved: checkProperty.addedOrRemoved,
    };
  }

  // converts a conccept effect check to a listener check (where it's an array of checks)
  function anyChangeRuleCheckToListenerCheck<K_Type extends T_ItemType>(
    checkProperty: EffectRule_Check<K_Type, T_ItemType, T_State>
  ) {
    if (Array.isArray(checkProperty)) {
      return checkProperty.map((loopedCheckProperty) =>
        anyChangeRuleACheckToListenerACheck(loopedCheckProperty)
      );
    }
    return anyChangeRuleACheckToListenerACheck(checkProperty);
  }

  // converts a concepto effect to a listener
  function convertEffectToListener<
    T_AnyChangeRule extends Effect_RuleOptions_NameRequired<
      any,
      T_ItemType,
      T_State,
      T_FlowName
    >
  >(
    anyChangeRule: T_AnyChangeRule
  ): Listener<T_ItemType, T_ItemType, T_State, T_FlowName> {
    return {
      changesToCheck: anyChangeRuleCheckToListenerCheck(anyChangeRule.check),
      listenerType:
        anyChangeRule.whenToRun === "subscribe" ? "subscribe" : "derive",
      name: anyChangeRule.name,
      whatToDo: anyChangeRule.onEffect,
      flow: anyChangeRule.flow,
    };
  }

  // --------------------------------------------------------------------
  // more utils
  // --------------------------------------------------------------------

  function normaliseChangesToCheck<K_Type extends T_ItemType>(
    changesToCheck: Listener_Check<K_Type, T_ItemType, T_State>
  ): Listener_ACheck_MultipleItemTypes<T_ItemType, T_State>[] {
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

  function _startConceptoListener<K_Type extends T_ItemType>(
    newListener: Listener<K_Type, T_ItemType, T_State, T_FlowName>
  ) {
    const listenerType = newListener.listenerType || "derive";

    const editedListener: ListenerAfterNormalising<
      K_Type,
      T_ItemType,
      T_State
    > = {
      name: newListener.name,
      changesToCheck: normaliseChangesToCheck(newListener.changesToCheck),
      whatToDo: newListener.whatToDo,
    };
    if (listenerType === "subscribe") {
      editedListener.listenerType = listenerType;
    }
    if (newListener.flow) {
      editedListener.flow = newListener.flow;
    }

    runWhenStartingConceptoListeners(() => {
      // add the new listener to all listeners and update listenerNamesByTypeByFlow

      meta.allListeners[
        editedListener.name
      ] = (editedListener as unknown) as UntypedListener;

      meta.listenerNamesByTypeByFlow[listenerType][
        editedListener.flow ?? "default"
      ] = addItemToUniqueArray(
        meta.listenerNamesByTypeByFlow[listenerType][
          editedListener.flow ?? "default"
        ] ?? [],
        editedListener.name
      );
    });
  }

  function _stopConceptoListener(listenerName: string) {
    runWhenStoppingConceptoListeners(() => {
      const theListener = meta.allListeners[listenerName];
      if (!theListener) return;
      const listenerType = theListener.listenerType ?? "derive";
      const flow = theListener.flow ?? "default";

      meta.listenerNamesByTypeByFlow[listenerType][flow] = removeItemFromArray(
        meta.listenerNamesByTypeByFlow[listenerType][flow] ?? [],
        theListener.name
      );

      delete meta.allListeners[listenerName];
    });
  }

  // --------------------------------------------------------------------
  // other functions
  // --------------------------------------------------------------------
  function getItem<
    K_Type extends T_ItemType,
    T_ItemName extends ItemName<K_Type, T_ItemType, T_State>
  >(type: K_Type, name: T_ItemName) {
    return [
      (getState() as any)[type][name],
      getRefs()[type][name],
      getPreviousState()[type][name],
    ] as [
      T_State[K_Type][T_ItemName],
      ReturnType<typeof getRefs>[K_Type][T_ItemName],
      ReturnType<typeof getPreviousState>[K_Type][T_ItemName]
    ];
  }

  function startEffect<K_Type extends T_ItemType>(
    theEffect: Effect_RuleOptions<K_Type, T_ItemType, T_State, T_FlowName>
  ) {
    let listenerName = theEffect.name || toSafeListenerName("effect");

    // add the required listenerName
    const editedEffect = {
      check: theEffect.check,
      name: listenerName,
      onEffect: theEffect.onEffect,
      whenToRun: theEffect.whenToRun,
      flow: theEffect.flow,
    };

    return _startConceptoListener(convertEffectToListener(editedEffect) as any);
  }

  function startItemEffect<
    K_Type extends T_ItemType,
    K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>
  >({
    check,
    onItemEffect,
    whenToRun,
    name,
    flow,
  }: ItemEffect_RuleOptions<
    K_Type,
    K_PropertyName,
    T_ItemType,
    T_State,
    T_Refs,
    T_FlowName
  >) {
    let listenerName = name || "unnamedEffect" + Math.random();
    if (!name) {
      console.log("used random name");
    }
    const editedItemTypes = toSafeArray(check.type);
    let editedPropertyNames = toSafeArray(check.prop);
    let editedItemNames = toSafeArray(check.name);

    let editedChangesToCheck = {
      type: editedItemTypes,
      prop: editedPropertyNames,
      name: editedItemNames,
    };

    let onEffect = itemEffectCallbackToEffectCallback({
      theItemType: editedItemTypes,
      theItemName: editedItemNames,
      thePropertyNames:
        editedPropertyNames ?? ([] as AllProperties<T_ItemType, T_State>[]),
      whatToDo: onItemEffect,
      becomes: check.becomes || "different",
    });

    startEffect({
      whenToRun,
      name: listenerName,
      check: editedChangesToCheck as any,
      onEffect,
      flow,
    });

    return listenerName;
  }

  function stopEffect(listenerName: string) {
    _stopConceptoListener(listenerName);
  }

  function useStore<K_Type extends T_ItemType, T_ReturnedConceptoProps>(
    whatToReturn: (state: DeepReadonly<T_State>) => T_ReturnedConceptoProps,
    check: EffectRule_Check<K_Type, T_ItemType, T_State>,
    hookDeps: any[] = []
  ): T_ReturnedConceptoProps {
    const [, setTick] = useState(0);
    const rerender = useCallback(() => setTick((tick) => tick + 1), []);

    useEffect(() => {
      const name = toSafeListenerName("reactComponent");
      startEffect({ whenToRun: "subscribe", name, check, onEffect: rerender });
      return () => stopEffect(name);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps);

    return whatToReturn(meta.currentState) as T_ReturnedConceptoProps;
  }

  function useStoreEffect<K_Type extends T_ItemType>(
    onEffect: EffectCallback<T_ItemType, T_State>,
    check: EffectRule_Check<K_Type, T_ItemType, T_State>,
    hookDeps: any[] = []
  ) {
    useLayoutEffect(() => {
      const name = toSafeListenerName("useStoreEffect_"); // note could add JSON.stringify(check) for useful listener name
      startEffect({ name, whenToRun: "subscribe", check, onEffect });
      return () => stopEffect(name);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps);
  }

  function useStoreItemEffect<
    K_Type extends T_ItemType,
    K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
    T_ReturnType
  >(
    onItemEffect: (
      loopedInfo: ItemEffectCallbackParams<
        K_Type,
        K_PropertyName,
        T_ItemType,
        T_State,
        T_Refs
      >
    ) => T_ReturnType,
    check: ItemEffectRule_Check<K_Type, K_PropertyName, T_ItemType, T_State>,
    hookDeps: any[] = []
  ) {
    useLayoutEffect(() => {
      const name = toSafeListenerName(
        "useStoreItemEffect_" + JSON.stringify(check)
      );
      startItemEffect({ name, whenToRun: "subscribe", check, onItemEffect });
      return () => stopEffect(name);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps);
  }

  function useStoreItem<
    K_Type extends T_ItemType,
    K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
    T_ReturnType,
    T_TheParameters = UseStoreItemParams<K_Type, T_ItemType, T_State, T_Refs>
  >(
    itemEffectCallback: (loopedInfo: T_TheParameters) => T_ReturnType,
    check: OneItem_Check<K_Type, K_PropertyName, T_ItemType, T_State>,
    hookDeps: any[] = []
  ) {
    const [returnedState, setReturnedState] = useState(({
      itemName: check.name,
      prevItemState: getPreviousState()[check.type][check.name],
      itemState: (getState() as any)[check.type as any][check.name],
      itemRefs: getRefs()[check.type][check.name],
    } as unknown) as T_TheParameters);
    // NOTE: could save timeUpdated to state, storing state in a ref, so it could reuse an object? not sure
    // const [timeUpdated, setTimeUpdated] = useState(Date.now());

    useLayoutEffect(() => {
      const name = toSafeListenerName("useStoreItem"); // note could add JSON.stringify(check) for useful listener name

      startItemEffect({
        name,
        whenToRun: "subscribe",
        check,
        onItemEffect: (theParameters) => setReturnedState(theParameters as any),
      });
      return () => stopEffect(name);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps);

    return itemEffectCallback(returnedState);
  }

  /*
    useStoreItemPropsEffect(
    { position() {}, rotationY() {}, nowAnimation() {} },
    { type: "characters", name: "walker" },
  );
  */
  function useStoreItemPropsEffect<K_Type extends T_ItemType>(
    checkItem: {
      type: K_Type;
      name: ItemName<K_Type, T_ItemType, T_State>;
      flow?: T_FlowName;
    },
    onPropChanges: Partial<
      {
        [K_PropertyName in PropertyName<
          K_Type,
          T_ItemType,
          T_State
        >]: ItemEffectCallback<
          K_Type,
          K_PropertyName,
          T_ItemType,
          T_State,
          T_Refs
        >;
      }
    >,
    hookDeps: any[] = []
  ) {
    useLayoutEffect(() => {
      type ItemEffect_PropName = keyof typeof onPropChanges;
      const propNameKeys = Object.keys(onPropChanges) as ItemEffect_PropName[];
      const namePrefix = toSafeListenerName("useStoreItemPropsEffect"); // note could add checkItem.type and checkItem.name for useful listener name

      forEach(propNameKeys, (loopedPropKey) => {
        const name = namePrefix + loopedPropKey;

        const itemEffectCallback = onPropChanges[loopedPropKey];
        startItemEffect({
          onItemEffect: itemEffectCallback as any,
          name,
          check: {
            type: checkItem.type,
            name: checkItem.name,
            prop: loopedPropKey,
          },
          whenToRun: "subscribe",
          flow: checkItem.flow,
        });
      });

      return () => {
        forEach(propNameKeys, (loopedPropKey) => {
          const name = namePrefix + loopedPropKey;
          stopEffect(name);
        });
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps);
  }

  type AddItemOptions<K_Type extends T_ItemType> = {
    type: K_Type;
    name: string;
    state?: Partial<T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>]>;
    refs?: Partial<T_Refs[K_Type][ItemName<K_Type, T_ItemType, T_State>]>;
  };
  function addItem<K_Type extends T_ItemType>(
    addItemOptions: AddItemOptions<K_Type>,
    callback?: any
  ) {
    _addItem(
      addItemOptions as AddItemOptionsUntyped<T_State, T_Refs, K_Type>,
      callback
    );
  }

  function removeItem(itemInfo: { type: T_ItemType; name: string }) {
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
  type MakeEffect = <K_Type extends T_ItemType>(
    options: Effect_RuleOptions<K_Type, T_ItemType, T_State, T_FlowName>
    // ) => Effect_RuleOptions<K_Type, T_ItemType, T_State, T_FlowName>;
  ) => any;

  // type MakeItemEffect = <K_Type extends T_ItemType, K_PropertyName extends G_PropertyName[K_Type]>(options: ItemEffect_RuleOptions<K_Type, K_PropertyName>) => ItemEffect_RuleOptions<K_Type, K_PropertyName>;
  type MakeItemEffect = <
    K_Type extends T_ItemType,
    K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>
  >(
    options: ItemEffect_RuleOptions<
      K_Type,
      K_PropertyName,
      T_ItemType,
      T_State,
      T_Refs,
      T_FlowName
    >
    // ) => ItemEffect_RuleOptions<
    //   K_Type,
    //   K_PropertyName,
    //   T_ItemType,
    //   T_State,
    //   T_Refs,
    //   T_FlowName
    // >;
  ) => any;

  type MakeDynamicEffectInlineFunction = <
    K_Type extends T_ItemType,
    T_Options extends any
  >(
    theRule: (
      options: T_Options
    ) => Effect_RuleOptions<K_Type, T_ItemType, T_State, T_FlowName>
  ) => (
    options: T_Options
    // ) => Effect_RuleOptions<K_Type, T_ItemType, T_State, T_FlowName>;
  ) => any;

  type MakeDynamicItemEffectInlineFunction = <
    K_Type extends T_ItemType,
    K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
    T_Options extends any
  >(
    theRule: (
      options: T_Options
    ) => ItemEffect_RuleOptions<
      K_Type,
      K_PropertyName,
      T_ItemType,
      T_State,
      T_Refs,
      T_FlowName
    >
  ) => (
    options: T_Options
    // ) => ItemEffect_RuleOptions<
    //   K_Type,
    //   K_PropertyName,
    //   T_ItemType,
    //   T_State,
    //   T_Refs,
    //   T_FlowName
    // >;
  ) => any;

  function makeEffect<K_Type extends T_ItemType>(
    options: Effect_RuleOptions<K_Type, T_ItemType, T_State, T_FlowName>
  ) {
    return options;
  }

  function makeItemEffect<
    K_Type extends T_ItemType,
    K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>
  >(
    options: ItemEffect_RuleOptions<
      K_Type,
      K_PropertyName,
      T_ItemType,
      T_State,
      T_Refs,
      T_FlowName
    >
  ) {
    return options;
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

  function makeRules<
    K_RuleName extends string,
    K_RulesToAdd extends (
      addItemEffect: MakeItemEffect,
      addEffect: MakeEffect
      // ) => Record<K_RuleName, MakeRule_Rule >
    ) => Record<
      K_RuleName,
      MakeRule_Rule<T_ItemType, T_State, T_Refs, T_FlowName>
    >
  >(
    rulesToAdd: K_RulesToAdd
  ): {
    start: (ruleName: K_RuleName) => void;
    stop: (ruleName: K_RuleName) => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: K_RuleName[];
  } {
    // type RuleName = keyof ReturnType<typeof rulesToAdd>;
    const editedRulesToAdd = rulesToAdd(
      makeItemEffect as any,
      makeEffect as any
    );
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

      if (theRule.onEffect !== undefined) {
        startEffect(theRule as any);
      } else {
        startItemEffect(theRule as any);
      }
    }

    function stop(ruleName: K_RuleName) {
      if (editedRulesToAdd[ruleName as keyof typeof editedRulesToAdd]) {
        stopEffect(ruleNamePrefix + ruleName);
      }
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
    };
  }

  // -----------------
  // make rules dynamic

  function makeDynamicEffectInlineFunction<
    K_Type extends T_ItemType,
    T_Options extends any
  >(
    theRule: (
      options: T_Options
    ) => Effect_RuleOptions<K_Type, T_ItemType, T_State, T_FlowName>
  ) {
    return theRule;
  }
  function makeDynamicItemEffectInlineFunction<
    K_Type extends T_ItemType,
    K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>,
    T_Options extends any
  >(
    theRule: (
      options: T_Options
    ) => ItemEffect_RuleOptions<
      K_Type,
      K_PropertyName,
      T_ItemType,
      T_State,
      T_Refs,
      T_FlowName
    >
  ) {
    return theRule;
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
    ) => MakeRule_Rule<T_ItemType, T_State, T_Refs, T_FlowName>,
    T_RulesToAdd = Record<K_RuleName, T_MakeRule_Function>
  >(
    rulesToAdd: (
      addItemEffect: MakeDynamicItemEffectInlineFunction,
      addEffect: MakeDynamicEffectInlineFunction
    ) => T_RulesToAdd
  ) {
    type RuleName = keyof ReturnType<typeof rulesToAdd>;
    const allRules = rulesToAdd(
      makeDynamicItemEffectInlineFunction,
      makeDynamicEffectInlineFunction
    );

    const ruleNames = Object.keys(allRules) as RuleName[];

    const ruleNamePrefix = `${ruleNames
      .map((loopedName) => (loopedName as string).charAt(0))
      .join("")}`;
    // .join("")}${Math.random()}`;

    function ruleNamePostfixFromOptions(theOptions: any) {
      return JSON.stringify(theOptions);
    }

    function getWholeRuleName(ruleName: string, options: any) {
      return `${ruleNamePrefix}${ruleName}${ruleNamePostfixFromOptions(
        options
      )}`;
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

        if (editedRuleObject.onEffect !== undefined) {
          startEffect(editedRuleObject as any);
        } else {
          startItemEffect(editedRuleObject as any);
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
        console.log("hmm no rule for ", ruleName);
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
  // Patches and Diffs
  // ---------------------------------------------------

  type ItemNamesByType = {
    [K_Type in T_ItemType]: ItemName<K_Type, T_ItemType, T_State>[];
  };

  type StatesPatch = {
    changed: GetPartialState<T_State>;
    added: Partial<ItemNamesByType>;
    removed: Partial<ItemNamesByType>;
  };

  type StatesDiff = {
    changedNext: GetPartialState<T_State>;
    changedPrev: GetPartialState<T_State>;
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
    return {
      itemTypesChanged: [],
      itemsChanged: {},
      propsChanged: {},
      itemsAdded: {},
      itemsRemoved: {},
      itemTypesChangedBool: {},
      itemsChangedBool: {},
      propsChangedBool: {},
      itemsAddedBool: {},
      itemsRemovedBool: {},
    } as DiffInfo<T_ItemType, T_State>;
  }

  function applyPatch(patch: StatesPatch) {
    forEach(itemTypes, (itemType) => {
      // Loop through removed items, and run removeConceptoItem()
      forEach(patch.removed[itemType] ?? [], (itemName) =>
        removeItem({ type: itemType, name: itemName })
      );
      // Loop through added items and run addConceptoItem()
      forEach(patch.added[itemType] ?? [], (itemName) =>
        addItem({ type: itemType, name: itemName })
      );
    });
    // run setState(patch.changed)
    setState(patch.changed);
  }

  function applyPatchHere(
    newStates: GetPartialState<T_State>,
    patch: StatesPatch
  ) {
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
          newStates[itemType] = {} as typeof newStates[typeof itemType];
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
              ) as (keyof typeof changedPropertiesForItem)[];

              forEach(changePropertyNames, (propertyName) => {
                itemTypeState[itemName] =
                  changedPropertiesForItem[propertyName];
              });
            }
          }
        });
      }
    });
  }

  function getPatchOrDiff(
    prevState: GetPartialState<T_State>,
    newState: GetPartialState<T_State>,
    patchOrDiff: "patch"
  ): StatesPatch;
  function getPatchOrDiff(
    prevState: GetPartialState<T_State>,
    newState: GetPartialState<T_State>,
    patchOrDiff: "diff"
  ): StatesDiff;
  function getPatchOrDiff<T_PatchOrDiff extends "patch" | "diff">(
    prevState: GetPartialState<T_State>,
    newState: GetPartialState<T_State>,
    patchOrDiff: T_PatchOrDiff
  ) {
    const newPatch = makeEmptyPatch();
    const tempDiffInfo = makeEmptyDiffInfo();
    const tempManualUpdateChanges = initialRecordedChanges();
    meta.getStatesDiff(
      prevState, // currentState
      newState, // previousState
      tempDiffInfo,
      tempManualUpdateChanges, // manualUpdateChanges
      true // checkAllChanges
    );
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
          T_ItemType,
          T_State
        >[];
        let propertyNamesHaveBeenFound = false;
        forEach(itemNamesAddedForType ?? [], (itemName) => {
          const defaultItemState = defaultStates[itemType](itemName);
          const addedItemState = newItemTypeState?.[itemName];

          if (!propertyNamesHaveBeenFound) {
            propertyNamesForItemType = Object.keys(
              defaultItemState
            ) as PropertyName<typeof itemType, T_ItemType, T_State>[];
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
                let valuesAreTheSame =
                  addedItemState[propertyName] === newPropertyValue;

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
                      newPatchChangedForItemName[
                        propertyName
                      ] = newPropertyValue;
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
          T_ItemType,
          T_State
        >[];
        let propertyNamesHaveBeenFound = false;
        forEach(itemNamesRemovedForType ?? [], (itemName) => {
          const defaultItemState = defaultStates[itemType](itemName);
          const removedItemState = prevItemTypeState?.[itemName];

          if (!propertyNamesHaveBeenFound) {
            propertyNamesForItemType = Object.keys(
              defaultItemState
            ) as PropertyName<typeof itemType, T_ItemType, T_State>[];
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
                  const newDiffChangedForItemType =
                    newDiff.changedPrev[itemType];
                  if (newDiffChangedForItemType) {
                    if (!newDiffChangedForItemType[itemName]) {
                      newDiffChangedForItemType[itemName] = {};
                    }
                    const newDiffChangedForItemName =
                      newDiffChangedForItemType[itemName];

                    if (newDiffChangedForItemName) {
                      newDiffChangedForItemName[
                        propertyName
                      ] = newPropertyValue;
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
    prevState: GetPartialState<T_State>,
    newState: GetPartialState<T_State>
  ) {
    return getPatchOrDiff(prevState, newState, "patch");
  }

  function getPatchAndReversed(
    prevState: GetPartialState<T_State>,
    newState: GetPartialState<T_State>
  ) {
    const patch = getPatch(prevState, newState);
    const reversePatch = getPatch(newState, prevState);
    return [patch, reversePatch];
  }

  function getReversePatch(
    partialState: GetPartialState<T_State>,
    newPatch: StatesPatch
  ) {
    const prevState: GetPartialState<T_State> = {};
    meta.copyStates(partialState, prevState);
    const newState: GetPartialState<T_State> = {};
    meta.copyStates(partialState, newState);
    applyPatchHere(newState, newPatch);
    const reversePatch = getPatch(newState, prevState);
    return reversePatch;
  }

  function combineTwoPatches(prevPatch: StatesPatch, newPatch: StatesPatch) {
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
        combinedPatch.removed[itemType] = combinedPatch.removed[
          itemType
        ]!.filter((itemName) => {
          if (
            itemsRemovedPrev.includes(itemName) &&
            itemsAddedNew.includes(itemName)
          ) {
            return false;
          }

          return true;
        });
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
        }) as ItemName<typeof itemType, T_ItemType, T_State>[];

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
    currentStates: GetPartialState<T_State>,
    thePatch: StatesPatch
  ) {
    const minimalPatch = cloneObjectWithJson(thePatch) as StatesPatch;
    // Loop through the changed items, and each changed property
    forEach(itemTypes, (itemType) => {
      const propertyNames = Object.keys(
        defaultStates[itemType]("anItemName")
      ) as PropertyName<typeof itemType, T_ItemType, T_State>[];

      const changedForType = minimalPatch.changed[itemType];
      if (changedForType) {
        const changedItemNames = Object.keys(changedForType ?? {}) as ItemName<
          typeof itemType,
          T_ItemType,
          T_State
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

  function removePartialPatch(
    thePatch: StatesPatch,
    patchToRemove: StatesPatch
  ) {
    const newPatch = cloneObjectWithJson(thePatch) as StatesPatch;

    forEach(itemTypes, (itemType) => {
      // Loop through removed in patchToRemove, if it’s in newPatch , remove it
      if (newPatch.removed[itemType]) {
        newPatch.removed[itemType] = newPatch.removed[itemType]!.filter(
          (itemName) => !patchToRemove.removed[itemType]!.includes(itemName)
        );
      }
      // Loop through added in patchToRemove, if it’s in newPatch , remove it
      // Keep track of noLongerAddedItems { itemType: []
      const noLongerAddedItems: ItemName<
        T_ItemType,
        T_ItemType,
        T_State
      >[] = [];
      if (newPatch.added[itemType]) {
        newPatch.added[itemType] = newPatch.added[itemType]!.filter(
          (itemName) => {
            const shouldKeep = !patchToRemove.added[itemType]!.includes(
              itemName
            );
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
        ) as ItemName<typeof itemType, T_ItemType, T_State>[];
        forEach(changedItemNames, (itemName) => {
          const removedPatchChangedForItem =
            removedPatchChangedForType[itemName];
          const newPatchChangedForItem = newPatchChangedForType[itemName];

          if (removedPatchChangedForItem && newPatchChangedForItem) {
            // (if the item has no more properties, remove that changed item)
            const removedPatchChangedPropertyNames = Object.keys(
              removedPatchChangedForItem ?? {}
            ) as (keyof typeof removedPatchChangedForItem)[];

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
    prevState: GetPartialState<T_State>,
    newState: GetPartialState<T_State>
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

  return {
    getPreviousState,
    getState,
    setState,
    onNextTick,
    getRefs,
    getItem,
    makeRules,
    makeDynamicRules,
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
    // TODO NOTE
    // make a seperate function that creates the patch+diff functions so it can be used when needed
    // patches and diffs
    // makeEmptyPatch,
    // makeEmptyDiff,
    // applyPatch,
    // applyPatchHere,
    // getPatch,
    // getPatchAndReversed,
    // getReversePatch,
    // combineTwoPatches,
    // combinePatches,
    // makeMinimalPatch,
    // removePartialPatch,
    // getDiff,
    // getDiffFromPatches,
    // getPatchesFromDiff,
    // combineTwoDiffs,
    // combineDiffs,
  };
}
