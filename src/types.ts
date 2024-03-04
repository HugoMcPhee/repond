import { RepondTypes } from "./declarations";

// https://stackoverflow.com/questions/49401866/all-possible-keys-of-an-union-type
export type KeysOfUnion<T> = T extends any ? keyof T : never;

export type InnerEffectCheck<
  T_State extends { [key: string]: any },
  T_ItemType extends string
> =
  | {
      types?: [T_ItemType];
      names?: string[];
      props?: KeysOfUnion<
        NonNullable<T_State[T_ItemType]>[keyof T_State[T_ItemType]]
      >[];
      addedOrRemoved?: boolean;
    }
  | {
      types?: T_ItemType;
      names?: string[];
      props?: KeysOfUnion<
        NonNullable<T_State[T_ItemType]>[keyof T_State[T_ItemType]]
      >[];
      addedOrRemoved?: boolean;
    };
//

// https://stackoverflow.com/a/55930310 Readonly object , Ben Carp

export type DeepReadonly<T> =
  // tslint:disable-next-line: ban-types
  T extends AnyFunction | Primitive
    ? T // eslint-disable-next-line @typescript-eslint/no-unused-vars
    : T extends ReadonlyArray<infer R>
    ? T
    : T extends ReadonlyMap<infer K, infer V>
    ? IDRMap<K, V>
    : T extends ReadonlySet<infer ItemType>
    ? ReadonlySetDeep<ItemType>
    : T extends object
    ? DeepReadonlyObject<T>
    : T;

export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

export type AnyFunction = (...args: any[]) => any;

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

interface IDRMap<K, V> extends ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>> {}

interface ReadonlySetDeep<ItemType>
  extends ReadonlySet<DeepReadonly<ItemType>> {}
//

// ----------------------------
// stuff from makeRepond

// type Without<T, K> = Pick<T, Exclude<keyof T, K>>;
type WithoutB<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = T | U extends object
  ? (WithoutB<T, U> & U) | (WithoutB<U, T> & T)
  : T | U;
// NOTE: could use ts-xor package (same)

export type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> };

// export type GetReadOnlyState<T_State> = {
//   [P_Type in keyof T_State]?: {
//     [P_Name in keyof T_State[P_Type]]?: {
//       [P_Property in keyof T_State[P_Type][P_Name]]?: P_Property extends keyof T_State[P_Type][P_Name]
//         ? Readonly<T_State[P_Type][P_Name][P_Property]>
//         : never;
//     };
//   };
// };

export type GetPartialState<T_State> = {
  [P_Type in keyof T_State]?: {
    [P_Name in keyof T_State[P_Type]]?: {
      [P_Property in keyof T_State[P_Type][P_Name]]?: P_Property extends keyof T_State[P_Type][P_Name]
        ? T_State[P_Type][P_Name][P_Property]
        : never;
    };
  };
};

export type ExtendsString<T> = T extends string ? T : never;

// ------------------------------------

export type RepondCallback = (frameDuration: number, frameTime: number) => any;

export type SetRepondState<T_State> = (
  newState:
    | GetPartialState<T_State>
    | ((state: DeepReadonly<T_State>) => GetPartialState<T_State> | undefined),
  callback?: RepondCallback
) => void;

export type EffectPhase = "duringStep" | "endOfStep";

// ---------------------------------------------------------------------------------------------------------------------

export type StepName = RepondTypes["StepNames"][number];
type AllStoreInfo = RepondTypes["AllStoreInfo"]; // TODO rename?
export type ItemType = keyof AllStoreInfo;

export type DefaultStates = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["state"];
};
export type DefaultRefs = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["refs"];
};
type Get_DefaultRefs<K_Type extends keyof AllStoreInfo> =
  AllStoreInfo[K_Type]["refs"];

// Make a type that has the start states of all the stores
export type StartStates = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["startStates"];
};

export type StartStatesItemName<K_Type extends keyof AllStoreInfo> =
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

export type ItemName<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = ExtendsString<KeysOfUnion<T_State[K_Type]>>;

export type PropName<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = KeysOfUnion<T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>]> &
  string;

export type AllProps<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  [K_Type in T_ItemType]: PropName<K_Type, T_ItemType, T_State>;
}[T_ItemType];

type OriginalGroupNames = keyof RepondTypes["GroupedEffects"];
type RefinedGroupNames = RemoveEffectsSuffix<OriginalGroupNames>;

// Helper type to strip "Effects" suffix from group names
type RemoveEffectsSuffix<T extends string> = T extends `${infer Prefix}Effects`
  ? Prefix
  : T;

export type RefinedGroupedEffects = {
  [K in keyof RepondTypes["GroupedEffects"] as RemoveEffectsSuffix<K>]: RepondTypes["GroupedEffects"][K];
};

// ------------------------------------------------------------
// DiffInfo

type DiffInfo_PropsChanged<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  [K_Type in T_ItemType]: Record<
    ItemName<K_Type, T_ItemType, T_State>,
    PropName<K_Type, T_ItemType, T_State>[]
  > & {
    all__: PropName<K_Type, T_ItemType, T_State>[];
  };
} & {
  all__: AllProps<T_ItemType, T_State>[];
};

type DiffInfo_PropsChangedBool<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  [K_Type in T_ItemType]: Record<
    ItemName<K_Type, T_ItemType, T_State>,
    { [K_PropName in PropName<K_Type, T_ItemType, T_State>]: boolean }
  > & {
    all__: {
      [K_PropName in PropName<K_Type, T_ItemType, T_State>]: boolean;
    };
  };
} & {
  all__: { [K_PropName in AllProps<T_ItemType, T_State>]: boolean };
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

export type DiffInfo<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  itemTypesChanged: T_ItemType[];
  itemsChanged: DiffInfo_ItemsChanged<T_ItemType, T_State>;
  propsChanged: DiffInfo_PropsChanged<T_ItemType, T_State>;
  itemsAdded: DiffInfo_ItemsChanged<T_ItemType, T_State>;
  itemsRemoved: DiffInfo_ItemsChanged<T_ItemType, T_State>;
  itemTypesChangedBool: Record<T_ItemType | "all__", boolean>;
  itemsChangedBool: DiffInfo_ItemsChangedBool<T_ItemType, T_State>;
  propsChangedBool: DiffInfo_PropsChangedBool<T_ItemType, T_State>;
  itemsAddedBool: DiffInfo_ItemsChangedBool<T_ItemType, T_State>;
  itemsRemovedBool: DiffInfo_ItemsChangedBool<T_ItemType, T_State>;
};

// ------------------------------------------------------------

export type ItemEffect_Run_Params<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>
> = {
  itemName: ItemName<K_Type, T_ItemType, T_State>;
  newValue: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>][K_PropName];
  prevValue: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>][K_PropName];
  itemState: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>];
  // itemRefs: T_Refs[K_Type][keyof T_Refs[K_Type]];
  itemRefs: T_Refs[K_Type][ItemName<K_Type, T_ItemType, T_State>];
  // itemRefs: Get_T_Refs<K_Type>[ItemName<K_Type>];
  frameDuration: number;
};

export type ItemEffect_Check_Becomes =
  | undefined
  | string
  | number
  | boolean
  | ((theValue: any, prevValue: any) => boolean);

// for useStoreItem

type OneItem_OneCheck_OneProperty<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  prop?: K_PropName;
  type: K_Type;
  name: ItemName<K_Type, T_ItemType, T_State>;
  becomes?: ItemEffect_Check_Becomes;
  addedOrRemoved?: undefined;
};

type OneItem_ACheck_MultiProperties<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  prop?: K_PropName[];
  type: K_Type; // maybe ideally optional (and handle adding effect with any item type)
  name: ItemName<K_Type, T_ItemType, T_State>;
  becomes?: ItemEffect_Check_Becomes;
  addedOrRemoved?: undefined;
};

export type OneItem_Check<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | OneItem_OneCheck_OneProperty<K_Type, K_PropName, T_ItemType, T_State>
  | OneItem_ACheck_MultiProperties<K_Type, K_PropName, T_ItemType, T_State>;

// -----------------
//

// for itemEffectCallback
type ItemEffect_Check_SingleProperty<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  prop?: K_PropName;
  type: K_Type;
  name?:
    | ItemName<K_Type, T_ItemType, T_State>[]
    | ItemName<K_Type, T_ItemType, T_State>;
  becomes?: ItemEffect_Check_Becomes;
  addedOrRemoved?: undefined;
};

type ItemEffect_Check_MultiProperties<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  prop?: K_PropName[];
  type: K_Type; // maybe ideally optional (and handle adding listener with any item type)
  name?:
    | ItemName<K_Type, T_ItemType, T_State>[]
    | ItemName<K_Type, T_ItemType, T_State>;
  becomes?: ItemEffect_Check_Becomes;
  addedOrRemoved?: undefined;
};

export type ItemEffect_Check<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | ItemEffect_Check_SingleProperty<K_Type, K_PropName, T_ItemType, T_State>
  | ItemEffect_Check_MultiProperties<K_Type, K_PropName, T_ItemType, T_State>;

export type ItemEffect_Run<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>
> = (
  loopedInfo: ItemEffect_Run_Params<
    K_Type,
    K_PropName,
    T_ItemType,
    T_State,
    T_Refs
  >
) => void;

export type ItemEffect_Options<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_StepName extends string
> = {
  check: ItemEffect_Check<K_Type, K_PropName, T_ItemType, T_State>;
  // can use function to check value, ideally it uses the type of the selected property
  run: ItemEffect_Run<K_Type, K_PropName, T_ItemType, T_State, T_Refs>;
  atStepEnd?: boolean;
  name?: string;
  step?: T_StepName;
  runAtStart?: boolean;
  _isPerItem?: true;
};

export type ItemEffect_Options_NoMeta<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_StepName extends string
> = {
  check: ItemEffect_Check<K_Type, K_PropName, T_ItemType, T_State>;
  // can use function to check value, ideally it uses the type of the selected property
  run: ItemEffect_Run<K_Type, K_PropName, T_ItemType, T_State, T_Refs>;
  atStepEnd?: boolean;
  name?: string;
  step?: T_StepName;
  runAtStart?: boolean;
};

// -----------------
// AnyChangeRule ( like a slightly different and typed repond listener )

type Effect_OneCheck_OneItemType<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  type?: K_Type;
  name?:
    | ItemName<K_Type, T_ItemType, T_State>
    | ItemName<K_Type, T_ItemType, T_State>[];
  prop?: PropName<K_Type, T_ItemType, T_State>[];
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
  // the MultiItemTypes type's chosen
  */
type Effect_OneCheck_MultiItemTypes<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  type?: T_ItemType[];
  name?:
    | ItemName<T_ItemType, T_ItemType, T_State>
    | ItemName<T_ItemType, T_ItemType, T_State>[];
  prop?: AllProps<T_ItemType, T_State>[];
  addedOrRemoved?: boolean;
  becomes?: undefined;
};

export type Effect_OneCheck<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | Effect_OneCheck_OneItemType<K_Type, T_ItemType, T_State>
  | Effect_OneCheck_MultiItemTypes<T_ItemType, T_State>;

export type Effect_Check<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | Effect_OneCheck<K_Type, T_ItemType, T_State>[]
  | Effect_OneCheck<K_Type, T_ItemType, T_State>;

export type Effect_Run<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = (
  diffInfo: DiffInfo<T_ItemType, T_State>,
  frameDuration: number,
  skipChangeCheck?: boolean // for useStoreItemEffect, to run the effect regardless of changes
) => void;

export type Effect_Options<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_StepName extends string
> = {
  name?: string; // ruleName NOTE used to be required (probably still for dangerouslyAddingRule ? (adding single rules without making rules first))
  check: Effect_Check<K_Type, T_ItemType, T_State>;
  run: Effect_Run<T_ItemType, T_State>;
  atStepEnd?: boolean;
  step?: T_StepName;
  runAtStart?: boolean;
  _isPerItem?: false;
};

export type Effect_Options_NoMeta<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_StepName extends string
> = {
  name?: string; // effectName NOTE used to be required (probably still for startNewEffect
  check: Effect_Check<K_Type, T_ItemType, T_State>;
  run: Effect_Run<T_ItemType, T_State>;
  atStepEnd?: boolean;
  step?: T_StepName;
  runAtStart?: boolean;
};

export type Effect_Options_NameRequired<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_StepName extends string
> = Effect_Options<K_Type, T_ItemType, T_State, T_StepName> & {
  name: string;
};

type AnyEffect_Options<
  K_Type extends T_ItemType,
  K_PropName extends PropName<K_Type, T_ItemType, T_State>,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_StepName extends string
> = XOR<
  Effect_Options<K_Type, T_ItemType, T_State, T_StepName>,
  ItemEffect_Options<
    K_Type,
    K_PropName,
    T_ItemType,
    T_State,
    T_Refs,
    T_StepName
  >
>;

export type MakeRule_Rule<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_Refs extends Record<any, any>,
  T_StepName extends string
> = AnyEffect_Options<
  T_ItemType,
  PropName<T_ItemType, T_ItemType, T_State>,
  T_ItemType,
  T_State,
  T_Refs,
  T_StepName
>;

// ----------------------------
//  Listener types

type InnerEffect_OneCheck_OneItemType<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  types?: K_Type;
  names?: ItemName<K_Type, T_ItemType, T_State>[];
  props?: PropName<K_Type, T_ItemType, T_State>;
  addedOrRemoved?: boolean;
};

export type InnerEffect_OneCheck_MultiItemTypes<
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  types?: (keyof T_State)[];
  names?: ItemName<T_ItemType, T_ItemType, T_State>[];
  props?: AllProps<T_ItemType, T_State>[];
  addedOrRemoved?: boolean;
};

// NOTE: the type works, but autocomplete doesn't work ATM when
// trying to make properties/addedOrRemoved exclusive
// type TestChangeToCheckUnionWithProperties<T, K> = XOR<
//   Omit<TestChangeToCheckMultiItemTypes<T>, "addedOrRemoved">,
//   Omit<TestChangeToCheckOneItemType<T, K>, "addedOrRemoved">
// >;
// type TestChangeToCheckUnionWithoutProperties<T, K> = XOR<
//   Omit<TestChangeToCheckMultiItemTypes<T>, "properties">,
//   Omit<TestChangeToCheckOneItemType<T, K>, "properties">
// >;

// type TestChangeToCheckUnion<T, K> = XOR<
//   TestChangeToCheckUnionWithProperties<T, K>,
//   TestChangeToCheckUnionWithoutProperties<T, K>
// >;

export type InnerEffect_OneCheck<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | InnerEffect_OneCheck_OneItemType<K_Type, T_ItemType, T_State>
  | InnerEffect_OneCheck_MultiItemTypes<T_ItemType, T_State>;

export type InnerEffect_Check<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> =
  | InnerEffect_OneCheck<K_Type, T_ItemType, T_State>[]
  | InnerEffect_OneCheck<K_Type, T_ItemType, T_State>;

export type AddItem_OptionsUntyped<
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

export type InnerEffect_Loose<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>,
  T_StepName extends string
> = {
  name: string;
  check: InnerEffect_Check<K_Type, T_ItemType, T_State>;
  run: (diffInfo: DiffInfo<T_ItemType, T_State>, frameDuration: number) => void;
  atStepEnd?: boolean;
  step?: T_StepName;
};

// After normalizing
export type InnerEffect<
  K_Type extends T_ItemType,
  T_ItemType extends string | number | symbol,
  T_State extends Record<any, any>
> = {
  name: string;
  check: InnerEffect_OneCheck<K_Type, T_ItemType, T_State>[];
  run: (diffInfo: DiffInfo<T_ItemType, T_State>, frameDuration: number) => void;
  atStepEnd?: boolean;
  step?: string;
};

// -----------------
//

export type UseStoreItem_Params<
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
