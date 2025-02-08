import { RepondTypes } from "./declarations";

// https://stackoverflow.com/questions/49401866/all-possible-keys-of-an-union-type
export type KeysOfUnion<T> = T extends any ? keyof T : never;

// ------------------------------------------------------------
// Patches and diffs

export type GetPartialState<T_State> = {
  [P_Type in keyof T_State]?: {
    [P_Name in keyof T_State[P_Type]]?: {
      [P_Property in keyof T_State[P_Type][P_Name]]?: P_Property extends keyof T_State[P_Type][P_Name]
        ? T_State[P_Type][P_Name][P_Property]
        : never;
    };
  };
};

export type ItemIdsByType = { [K_Type in ItemType]: ItemId[] };

// ------------------------------------------------------------

export type RepondCallback = (frameDuration: number, frameTime: number) => any;

export type EffectPhase = "duringStep" | "endOfStep";

// ------------------------------------------------------------

export type StepName = RepondTypes["StepNames"][number];

type RemoveStoreSuffix<T extends string> = T extends `${infer Prefix}Store` ? Prefix : T;
export type ItemTypeDefs = {
  [K in keyof RepondTypes["ItemTypeDefs"] as RemoveStoreSuffix<K>]: RepondTypes["ItemTypeDefs"][K];
};

export type ItemType = keyof ItemTypeDefs & string;

export type DefaultStates = { [K_Type in ItemType]: ItemTypeDefs[K_Type]["newState"] };
export type DefaultRefs = { [K_Type in ItemType]: ItemTypeDefs[K_Type]["newRefs"] };
type Get_DefaultRefs<K_Type extends keyof ItemTypeDefs> = ItemTypeDefs[K_Type]["newRefs"];

export type AllState = { [K_Type in ItemType]: Record<string, ReturnType<ItemTypeDefs[K_Type]["newState"]>> };
export type AllRefs = { [K_Type in ItemType]: Record<string, ReturnType<Get_DefaultRefs<K_Type>>> };

export type ItemId = string;
export type PropName<K_Type extends ItemType> = KeysOfUnion<AllState[K_Type][ItemId]> & string;
export type AllProps = { [K_Type in ItemType]: PropName<K_Type> }[ItemType];

export type ItemPropsByType = { [K_Type in ItemType]: PropName<K_Type>[] };

// ------------------------------------------------------------
// DiffInfo

type DiffInfo_PropsChanged = {
  [K_Type in ItemType]: Record<ItemId, PropName<K_Type>[]> & {
    all__: PropName<K_Type>[];
  };
} & { all__: AllProps[] };

type DiffInfo_PropsChangedBool = {
  [K_Type in ItemType]: Record<ItemId, { [K_PropName in PropName<K_Type>]: boolean }> & {
    all__: {
      [K_PropName in PropName<K_Type>]: boolean;
    };
  };
} & {
  all__: { [K_PropName in AllProps]: boolean };
};

type DiffInfo_ItemsChanged = Record<ItemType | "all__", ItemId[]>;
type DiffInfo_ItemsChangedBool = Record<ItemType | "all__", Record<ItemId, boolean>>;

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

// ------------------------------------------------------------
// Effect

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

export type StatePath<T_ItemType extends ItemType> = [type: T_ItemType, id: ItemId, prop: PropName<T_ItemType>];
