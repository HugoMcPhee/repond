import { RepondTypes } from "./declarations";
export type KeysOfUnion<T> = T extends any ? keyof T : never;
export type DeepReadonly<T> = T extends AnyFunction | Primitive ? T : T extends ReadonlyArray<infer R> ? T : T extends ReadonlyMap<infer K, infer V> ? IDRMap<K, V> : T extends ReadonlySet<infer ItemType> ? ReadonlySetDeep<ItemType> : T extends object ? DeepReadonlyObject<T> : T;
export type Primitive = null | undefined | string | number | boolean | symbol | bigint;
export type AnyFunction = (...args: any[]) => any;
type DeepReadonlyObject<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
};
interface IDRMap<K, V> extends ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>> {
}
interface ReadonlySetDeep<ItemType> extends ReadonlySet<DeepReadonly<ItemType>> {
}
type WithoutB<T, U> = {
    [P in Exclude<keyof T, keyof U>]?: never;
};
export type XOR<T, U> = T | U extends object ? (WithoutB<T, U> & U) | (WithoutB<U, T> & T) : T | U;
export type RecursivePartial<T> = {
    [P in keyof T]?: RecursivePartial<T[P]>;
};
export type GetPartialState<T_State> = {
    [P_Type in keyof T_State]?: {
        [P_Name in keyof T_State[P_Type]]?: {
            [P_Property in keyof T_State[P_Type][P_Name]]?: P_Property extends keyof T_State[P_Type][P_Name] ? T_State[P_Type][P_Name][P_Property] : never;
        };
    };
};
export type ExtendsString<T> = T extends string ? T : never;
export type RepondCallback = (frameDuration: number, frameTime: number) => any;
export type SetRepondState<T_State> = (newState: GetPartialState<T_State> | ((state: DeepReadonly<T_State>) => GetPartialState<T_State> | undefined), callback?: RepondCallback) => void;
export type EffectPhase = "duringStep" | "endOfStep";
export type StepName = RepondTypes["StepNames"][number];
type RemoveStoreSuffix<T extends string> = T extends `${infer Prefix}Store` ? Prefix : T;
export type AllStoreInfo = {
    [K in keyof RepondTypes["AllStoreInfo"] as RemoveStoreSuffix<K>]: RepondTypes["AllStoreInfo"][K];
};
export type ItemType = keyof AllStoreInfo;
export type DefaultStates = {
    [K_Type in ItemType]: AllStoreInfo[K_Type]["getDefaultState"];
};
export type DefaultRefs = {
    [K_Type in ItemType]: AllStoreInfo[K_Type]["getDefaultRefs"];
};
type Get_DefaultRefs<K_Type extends keyof AllStoreInfo> = AllStoreInfo[K_Type]["getDefaultRefs"];
export type StartStates = {
    [K_Type in ItemType]: AllStoreInfo[K_Type]["startStates"];
};
export type StartStatesItemId<K_Type extends keyof AllStoreInfo> = AllStoreInfo[K_Type]["startStates"] extends Record<string, any> ? keyof AllStoreInfo[K_Type]["startStates"] : string;
export type AllState = {
    [K_Type in ItemType]: AllStoreInfo[K_Type]["startStates"] extends Record<string, any> ? AllStoreInfo[K_Type]["startStates"] : Record<string, ReturnType<AllStoreInfo[K_Type]["getDefaultState"]>>;
};
export type AllRefs = {
    [K_Type in ItemType]: Record<StartStatesItemId<K_Type>, ReturnType<Get_DefaultRefs<K_Type>>>;
};
export type ItemId<K_Type extends ItemType> = ExtendsString<KeysOfUnion<AllState[K_Type]>>;
export type PropName<K_Type extends ItemType> = KeysOfUnion<AllState[K_Type][ItemId<K_Type>]> & string;
export type AllProps = {
    [K_Type in ItemType]: PropName<K_Type>;
}[ItemType];
export type ItemIdsByType = {
    [K_Type in ItemType]: ItemId<K_Type>[];
};
export type ItemPropsByType = {
    [K_Type in ItemType]: PropName<K_Type>[];
};
type DiffInfo_PropsChanged = {
    [K_Type in ItemType]: Record<ItemId<K_Type>, PropName<K_Type>[]> & {
        all__: PropName<K_Type>[];
    };
} & {
    all__: AllProps[];
};
type DiffInfo_PropsChangedBool = {
    [K_Type in ItemType]: Record<ItemId<K_Type>, {
        [K_PropName in PropName<K_Type>]: boolean;
    }> & {
        all__: {
            [K_PropName in PropName<K_Type>]: boolean;
        };
    };
} & {
    all__: {
        [K_PropName in AllProps]: boolean;
    };
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
export type ItemEffect_Run_Params<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = {
    itemId: ItemId<K_Type>;
    newValue: AllState[K_Type][ItemId<K_Type>][K_PropName];
    prevValue: AllState[K_Type][ItemId<K_Type>][K_PropName];
    itemState: AllState[K_Type][ItemId<K_Type>];
    itemRefs: AllRefs[K_Type][ItemId<K_Type>];
    frameDuration: number;
    ranWithoutChange?: boolean;
};
export type ItemEffect_Check_Becomes = undefined | string | number | boolean | ((theValue: any, prevValue: any) => boolean);
type ItemEffect_Check_OneProp<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = {
    prop?: K_PropName;
    type: K_Type;
    id?: ItemId<K_Type>[] | ItemId<K_Type>;
    becomes?: ItemEffect_Check_Becomes;
    addedOrRemoved?: undefined;
};
type ItemEffect_Check_MultiProps<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = {
    prop?: K_PropName[];
    type: K_Type;
    id?: ItemId<K_Type>[] | ItemId<K_Type>;
    becomes?: ItemEffect_Check_Becomes;
    addedOrRemoved?: undefined;
};
export type ItemEffect_Check<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = ItemEffect_Check_OneProp<K_Type, K_PropName> | ItemEffect_Check_MultiProps<K_Type, K_PropName>;
export type ItemEffect_Run<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = (loopedInfo: ItemEffect_Run_Params<K_Type, K_PropName>) => void;
export type ItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = {
    check: ItemEffect_Check<K_Type, K_PropName>;
    run: ItemEffect_Run<K_Type, K_PropName>;
    atStepEnd?: boolean;
    id?: string;
    step?: StepName;
    runAtStart?: boolean;
};
export type UseStoreItem_Check_OneItem_OneProp<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = Omit<ItemEffect_Check_OneProp<K_Type, K_PropName>, "id"> & {
    id: ItemId<K_Type>;
};
export type UseStoreItem_Check_OneItem_MultiProps<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = Omit<ItemEffect_Check_MultiProps<K_Type, K_PropName>, "id"> & {
    id: ItemId<K_Type>;
};
export type UseStoreItem_Check_OneItem<K_Type extends ItemType, K_PropName extends PropName<K_Type>> = UseStoreItem_Check_OneItem_OneProp<K_Type, K_PropName> | UseStoreItem_Check_OneItem_MultiProps<K_Type, K_PropName>;
type EasyEffect_Check_OneItemType<K_Type extends ItemType> = {
    type?: K_Type;
    id?: ItemId<K_Type> | ItemId<K_Type>[];
    prop?: PropName<K_Type>[];
    addedOrRemoved?: boolean;
    becomes?: undefined;
};
type EasyEffect_Check_MultiItemTypes = {
    type?: ItemType[];
    id?: ItemId<ItemType> | ItemId<ItemType>[];
    prop?: AllProps[];
    addedOrRemoved?: boolean;
    becomes?: undefined;
};
export type EasyEffect_OneCheck<K_Type extends ItemType> = EasyEffect_Check_OneItemType<K_Type> | EasyEffect_Check_MultiItemTypes;
export type EasyEffect_Check<K_Type extends ItemType> = EasyEffect_OneCheck<K_Type>[] | EasyEffect_OneCheck<K_Type>;
export type EasyEffect_Run = (diffInfo: DiffInfo, frameDuration: number, ranWithoutChange?: boolean) => void;
export type EasyEffect<K_Type extends ItemType> = {
    id?: string;
    check: EasyEffect_Check<K_Type>;
    run: EasyEffect_Run;
    atStepEnd?: boolean;
    step?: StepName;
    runAtStart?: boolean;
};
export type Effect_OneCheck = {
    types?: ItemType[];
    ids?: ItemId<ItemType>[];
    props?: AllProps[];
    addedOrRemoved?: boolean;
};
export type Effect_Checks = Effect_OneCheck[];
export type Effect = {
    id: string;
    checks: Effect_Checks;
    run: (diffInfo: DiffInfo, frameDuration: number, ranWithoutChange?: boolean) => void;
    atStepEnd?: boolean;
    step?: StepName;
    runAtStart?: boolean;
};
export type FramerateTypeOption = "full" | "half" | "auto";
export type StatePath<T_ItemType extends ItemType> = [
    type: T_ItemType,
    id: ItemId<T_ItemType>,
    prop: PropName<T_ItemType>
];
export {};
