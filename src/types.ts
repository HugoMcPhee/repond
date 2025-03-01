import { RepondTypes } from "./declarations";

export type DeepPartial<T> = T extends Record<string, unknown> ? { [P in keyof T]?: DeepPartial<T[P]> } : T;

export type GetPartialState<T_State> = {
  [P_Type in keyof T_State]?: DeepPartial<T_State[P_Type]>;
};

export type ItemIdsByType = { [K in ItemType]: ItemId[] };

export type RepondCallback = (frameDuration: number, frameTime: number) => any;
export type EffectPhase = "duringStep" | "endOfStep";
export type StepName = RepondTypes["StepNames"][number];

type RemoveStoreSuffix<T extends string> = T extends `${infer Prefix}Store` ? Prefix : T;
export type ItemTypeDefs = {
  [K in keyof RepondTypes["ItemTypeDefs"] as RemoveStoreSuffix<K>]: RepondTypes["ItemTypeDefs"][K];
};
export type ItemType = keyof ItemTypeDefs & string;

type GetNewState<K extends keyof ItemTypeDefs> = ItemTypeDefs[K]["newState"];
type GetNewRefs<K extends keyof ItemTypeDefs> = ItemTypeDefs[K]["newRefs"];
export type GetNewStateByType = { [K in ItemType]: ItemTypeDefs[K]["newState"] };
export type GetNewRefsByType = { [K in ItemType]: ItemTypeDefs[K]["newRefs"] };

export type ItemDefaultState<K extends ItemType> = ReturnType<GetNewState<K>>;
export type ItemDefaultRefs<K extends ItemType> = ReturnType<GetNewRefs<K>>;

export type AllState = { [K in ItemType]: Record<string, ItemDefaultState<K>> };
export type AllRefs = { [K in ItemType]: Record<string, ItemDefaultRefs<K>> };

export type ItemId = string;
export type RefPropName<K extends ItemType> = keyof ItemDefaultRefs<K> & string;
export type RefPropValue<K extends ItemType, P extends RefPropName<K>> = ItemDefaultRefs<K>[P];
export type PropName<K extends ItemType> = keyof ItemDefaultState<K> & string;
export type AllProps = { [K in ItemType]: PropName<K> }[ItemType];
export type PropValue<K extends ItemType, P extends PropName<K>> = ItemDefaultState<K>[P];
export type ItemPropsByType = { [K in ItemType]: PropName<K>[] };
// Create a generic PropId for a specific ItemType:
export type PropIdFor<T extends ItemType> = `${T}.${PropName<T>}`;

// And a union of PropIds for all item types:
export type PropId = { [K in ItemType]: PropIdFor<K> }[ItemType];

export type PropValueFromPropId<T extends PropId> = T extends `${infer K}.${infer P}` ? PropValue<K, P> : never;

// Diffs
type DiffRecord<K extends ItemType, T> = Record<K, Record<ItemId, T>> & { __all: T };
type DiffInfo_PropsChanged = DiffRecord<ItemType, PropName<ItemType>[]>;
type DiffInfo_PropsChangedBool = DiffRecord<ItemType, Record<AllProps, boolean>>;
type DiffInfo_ItemsChanged = Record<ItemType | "__all", ItemId[]>;
type DiffInfo_ItemsChangedBool = Record<ItemType | "__all", Record<ItemId, boolean>>;

export type DiffInfo = {
  itemTypesChanged: ItemType[];
  itemTypesWithAdded: ItemType[];
  itemTypesWithRemoved: ItemType[];
  itemsChanged: DiffInfo_ItemsChanged;
  propsChanged: DiffInfo_PropsChanged;
  itemsAdded: DiffInfo_ItemsChanged;
  itemsRemoved: DiffInfo_ItemsChanged;
  itemTypesChangedBool: Record<ItemType | "__all", boolean>;
  itemTypesWithAddedBool: Record<ItemType, boolean>;
  itemTypesWithRemovedBool: Record<ItemType, boolean>;
  itemsChangedBool: DiffInfo_ItemsChangedBool;
  propsChangedBool: DiffInfo_PropsChangedBool;
  itemsAddedBool: DiffInfo_ItemsChangedBool;
  itemsRemovedBool: DiffInfo_ItemsChangedBool;
};

// Effects
export type EffectDef_Run_Params = [
  itemId: string,
  diffInfo: DiffInfo,
  frameDuration: number,
  ranWithoutChange?: boolean
];
export type EffectDef_Run = (...params: EffectDef_Run_Params) => void;

export type EffectDef = {
  id?: string; // required, but optional when making an effect, a default id will be generated, for saved group effects, the id will be "groupName.effectName"
  changes: string[];
  itemIds?: string[];
  run: EffectDef_Run;
  isPerItem?: boolean;
  atStepEnd?: boolean;
  step?: StepName;
  runAtStart?: boolean;
  becomes?: boolean | string | number;
  _itemTypes?: ItemType[];
  _groupName?: string;
  _effectName?: string;
  _allowedIdsMap?: { [itemId: string]: boolean };
  _propsByItemType?: { [itemId: string]: string[] };
  _checkAddedByItemType?: { [itemId: string]: boolean };
  _checkRemovedByItemType?: { [itemId: string]: boolean };
};

export type StatePath<T extends ItemType> = [type: T, id: ItemId, prop: PropName<T>];
