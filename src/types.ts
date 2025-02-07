import { RepondTypes } from "./declarations";

// https://stackoverflow.com/questions/49401866/all-possible-keys-of-an-union-type
export type KeysOfUnion<T> = T extends any ? keyof T : never;

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

export type Primitive = null | undefined | string | number | boolean | symbol | bigint;

export type AnyFunction = (...args: any[]) => any;

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

interface IDRMap<K, V> extends ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>> {}

interface ReadonlySetDeep<ItemType> extends ReadonlySet<DeepReadonly<ItemType>> {}
//

// ----------------------------
// stuff from makeRepond

// type Without<T, K> = Pick<T, Exclude<keyof T, K>>;
type WithoutB<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = T | U extends object ? (WithoutB<T, U> & U) | (WithoutB<U, T> & T) : T | U;
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
  newState: GetPartialState<T_State> | ((state: DeepReadonly<T_State>) => GetPartialState<T_State> | undefined),
  callback?: RepondCallback
) => void;

export type EffectPhase = "duringStep" | "endOfStep";

// ---------------------------------------------------------------------------------------------------------------------

export type StepName = RepondTypes["StepNames"][number];
type AllStoreInfoWithoutRename = RepondTypes["AllStoreInfo"]; // TODO rename?

type RemoveStoreSuffix<T extends string> = T extends `${infer Prefix}Store` ? Prefix : T;
export type AllStoreInfo = {
  [K in keyof RepondTypes["AllStoreInfo"] as RemoveStoreSuffix<K>]: RepondTypes["AllStoreInfo"][K];
};

export type ItemType = keyof AllStoreInfo & string;

export type DefaultStates = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["getDefaultState"];
};
export type DefaultRefs = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["getDefaultRefs"];
};
type Get_DefaultRefs<K_Type extends keyof AllStoreInfo> = AllStoreInfo[K_Type]["getDefaultRefs"];

// Make a type that has the start states of all the stores
export type StartStates = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["startStates"];
};

export type StartStatesItemId<K_Type extends keyof AllStoreInfo> = AllStoreInfo[K_Type]["startStates"] extends Record<
  string,
  any
>
  ? keyof AllStoreInfo[K_Type]["startStates"]
  : string;

// make an AllState type that conditionally uses the keys and values of startStates if available or otherwise uses string as the key and the return type of the default "state"  (for that store) as the value
export type AllState = {
  [K_Type in ItemType]: AllStoreInfo[K_Type]["startStates"] extends Record<string, any>
    ? AllStoreInfo[K_Type]["startStates"]
    : Record<string, ReturnType<AllStoreInfo[K_Type]["getDefaultState"]>>;
};

// Make an AllRefs type that uses Get_DefaultRefs for each store
export type AllRefs = {
  [K_Type in ItemType]: Record<
    StartStatesItemId<K_Type>,
    ReturnType<Get_DefaultRefs<K_Type>> // NOTE: refs wont be generic typed, generic ReturnType doesn't seem to work with nested generic function types like Blah<_T_Blah>["blah"]<T_Paramter>
  >;
};

export type ItemId<K_Type extends ItemType> = ExtendsString<KeysOfUnion<AllState[K_Type]>>;
export type PropName<K_Type extends ItemType> = KeysOfUnion<AllState[K_Type][ItemId<K_Type>]> & string;
export type AllProps = { [K_Type in ItemType]: PropName<K_Type> }[ItemType];

export type ItemIdsByType = {
  [K_Type in ItemType]: ItemId<K_Type>[];
};

export type ItemPropsByType = {
  [K_Type in ItemType]: PropName<K_Type>[];
};

// ------------------------------------------------------------
// DiffInfo

type DiffInfo_PropsChanged = {
  [K_Type in ItemType]: Record<ItemId<K_Type>, PropName<K_Type>[]> & {
    all__: PropName<K_Type>[];
  };
} & { all__: AllProps[] };

type DiffInfo_PropsChangedBool = {
  [K_Type in ItemType]: Record<ItemId<K_Type>, { [K_PropName in PropName<K_Type>]: boolean }> & {
    all__: {
      [K_PropName in PropName<K_Type>]: boolean;
    };
  };
} & {
  all__: { [K_PropName in AllProps]: boolean };
};

type DiffInfo_ItemsChanged = Record<ItemType | "all__", ItemId<ItemType>[]>;

type DiffInfo_ItemsChangedBool = Record<ItemType | "all__", Record<ItemId<ItemType>, boolean>>;

export type DiffInfo = {
  itemTypesChanged: ItemType[];
  itemsChanged: DiffInfo_ItemsChanged;
  propsChanged: DiffInfo_PropsChanged;
  itemsAdded: DiffInfo_ItemsChanged;
  itemsRemoved: DiffInfo_ItemsChanged;
  itemTypesChangedBool: Record<ItemType | "all__", boolean>;
  itemsChangedBool: DiffInfo_ItemsChangedBool;
  propsChangedBool: DiffInfo_PropsChangedBool;
  itemsAddedBool: DiffInfo_ItemsChangedBool;
  itemsRemovedBool: DiffInfo_ItemsChangedBool;
};

// -----------------
// Use Store Item

export type Effect_CheckOneItem = {
  itemId: string;
  changes: string[];
};

// itemId is the first itemId if it's not per item
export type Effect_Run_Params = [itemId: string, diffInfo: DiffInfo, frameDuration: number, ranWithoutChange?: boolean];
export type Effect_Run = (...params: Effect_Run_Params) => void;

export type Effect = {
  // required, but optional when making an effect, a default id will be generated
  // for saved group effects, the id will be "groupName.effectName"
  id?: string;
  changes: string[];
  itemIds?: string[];
  run: Effect_Run;
  isPerItem?: boolean;
  atStepEnd?: boolean;
  step?: StepName;
  runAtStart?: boolean;
  becomes?: boolean | string | number;
  // cached when the effect is created and saved
  _itemTypes?: ItemType[];
  _groupName?: string;
  _effectName?: string;
  _allowedIdsMap?: { [itemId: string]: boolean };
  _propsByItemType?: { [itemId: string]: string[] };
  _checkAddedByItemType?: { [itemId: string]: boolean };
  _checkRemovedByItemType?: { [itemId: string]: boolean };
};

export type FramerateTypeOption = "full" | "half" | "auto";

export type StatePath<T_ItemType extends ItemType> = [
  type: T_ItemType,
  id: ItemId<T_ItemType>,
  prop: PropName<T_ItemType>
];
