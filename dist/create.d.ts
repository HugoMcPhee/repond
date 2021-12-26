import { KeysOfUnion, DeepReadonly, SetPietemState, XOR, ExtendsString, PietemCallback } from "./types";
declare type ItemName<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = ExtendsString<KeysOfUnion<T_State[K_Type]>>;
declare type PropertyName<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = KeysOfUnion<T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>]>;
declare type AllProperties<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    [K_Type in T_ItemType]: PropertyName<K_Type, T_ItemType, T_State>;
}[T_ItemType];
declare type DiffInfo_PropertiesChanged<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    [K_Type in T_ItemType]: Record<ItemName<K_Type, T_ItemType, T_State>, PropertyName<K_Type, T_ItemType, T_State>[]> & {
        all__: PropertyName<K_Type, T_ItemType, T_State>[];
    };
} & {
    all__: AllProperties<T_ItemType, T_State>[];
};
declare type DiffInfo_PropertiesChangedBool<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    [K_Type in T_ItemType]: Record<ItemName<K_Type, T_ItemType, T_State>, {
        [K_PropName in PropertyName<K_Type, T_ItemType, T_State>]: boolean;
    }> & {
        all__: {
            [K_PropName in PropertyName<K_Type, T_ItemType, T_State>]: boolean;
        };
    };
} & {
    all__: {
        [K_PropName in AllProperties<T_ItemType, T_State>]: boolean;
    };
};
declare type DiffInfo_ItemsChanged<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = Record<T_ItemType | "all__", ItemName<T_ItemType, T_ItemType, T_State>[]>;
declare type DiffInfo_ItemsChangedBool<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = Record<T_ItemType | "all__", Record<ItemName<T_ItemType, T_ItemType, T_State>, boolean>>;
declare type DiffInfo<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
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
declare type ItemEffectCallbackParams<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>> = {
    itemName: ItemName<K_Type, T_ItemType, T_State>;
    newValue: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>][K_PropertyName];
    previousValue: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>][K_PropertyName];
    itemState: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>];
    itemRefs: T_Refs[K_Type][ItemName<K_Type, T_ItemType, T_State>];
    frameDuration: number;
};
declare type ACheck_Becomes = undefined | string | number | boolean | ((theValue: any, prevValue: any) => boolean);
declare type OneItem_ACheck_SingleProperty<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    prop?: K_PropertyName;
    type: K_Type;
    name: ItemName<K_Type, T_ItemType, T_State>;
    becomes?: ACheck_Becomes;
    addedOrRemoved?: undefined;
};
declare type OneItem_ACheck_MultiProperties<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    prop?: K_PropertyName[];
    type: K_Type;
    name: ItemName<K_Type, T_ItemType, T_State>;
    becomes?: ACheck_Becomes;
    addedOrRemoved?: undefined;
};
declare type OneItem_Check<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = OneItem_ACheck_SingleProperty<K_Type, K_PropertyName, T_ItemType, T_State> | OneItem_ACheck_MultiProperties<K_Type, K_PropertyName, T_ItemType, T_State>;
declare type ItemEffectRule_Check_SingleProperty<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    prop?: K_PropertyName;
    type: K_Type;
    name?: ItemName<K_Type, T_ItemType, T_State>[] | ItemName<K_Type, T_ItemType, T_State>;
    becomes?: ACheck_Becomes;
    addedOrRemoved?: undefined;
};
declare type ItemEffectRule_Check_MultiProperties<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    prop?: K_PropertyName[];
    type: K_Type;
    name?: ItemName<K_Type, T_ItemType, T_State>[] | ItemName<K_Type, T_ItemType, T_State>;
    becomes?: ACheck_Becomes;
    addedOrRemoved?: undefined;
};
declare type ItemEffectRule_Check<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = ItemEffectRule_Check_SingleProperty<K_Type, K_PropertyName, T_ItemType, T_State> | ItemEffectRule_Check_MultiProperties<K_Type, K_PropertyName, T_ItemType, T_State>;
declare type ItemEffectCallback<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>> = (loopedInfo: ItemEffectCallbackParams<K_Type, K_PropertyName, T_ItemType, T_State, T_Refs>) => void;
declare type ItemEffect_RuleOptions<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>, T_StepName extends string> = {
    check: ItemEffectRule_Check<K_Type, K_PropertyName, T_ItemType, T_State>;
    run: ItemEffectCallback<K_Type, K_PropertyName, T_ItemType, T_State, T_Refs>;
    atStepEnd?: boolean;
    name?: string;
    step?: T_StepName;
};
declare type EffectRule_ACheck_OneItemType<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    type?: K_Type;
    name?: ItemName<K_Type, T_ItemType, T_State> | ItemName<K_Type, T_ItemType, T_State>[];
    prop?: PropertyName<K_Type, T_ItemType, T_State>[];
    addedOrRemoved?: boolean;
    becomes?: undefined;
};
declare type EffectRule_ACheck_MultipleItemTypes<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    type?: T_ItemType[];
    name?: ItemName<T_ItemType, T_ItemType, T_State> | ItemName<T_ItemType, T_ItemType, T_State>[];
    prop?: AllProperties<T_ItemType, T_State>[];
    addedOrRemoved?: boolean;
    becomes?: undefined;
};
declare type EffectRule_ACheck<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = EffectRule_ACheck_OneItemType<K_Type, T_ItemType, T_State> | EffectRule_ACheck_MultipleItemTypes<T_ItemType, T_State>;
declare type EffectRule_Check<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = EffectRule_ACheck<K_Type, T_ItemType, T_State>[] | EffectRule_ACheck<K_Type, T_ItemType, T_State>;
declare type EffectCallback<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = (diffInfo: DiffInfo<T_ItemType, T_State>, frameDuration: number) => void;
declare type Effect_RuleOptions<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_StepName extends string> = {
    name?: string;
    check: EffectRule_Check<K_Type, T_ItemType, T_State>;
    run: EffectCallback<T_ItemType, T_State>;
    atStepEnd?: boolean;
    step?: T_StepName;
};
declare type FlexibleRuleOptions<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>, T_StepName extends string> = XOR<Effect_RuleOptions<K_Type, T_ItemType, T_State, T_StepName>, ItemEffect_RuleOptions<K_Type, K_PropertyName, T_ItemType, T_State, T_Refs, T_StepName>>;
declare type MakeRule_Rule<T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>, T_StepName extends string> = FlexibleRuleOptions<T_ItemType, PropertyName<T_ItemType, T_ItemType, T_State>, T_ItemType, T_State, T_Refs, T_StepName>;
declare type UseStoreItemParams<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>> = {
    itemName: ItemName<K_Type, T_ItemType, T_State>;
    prevItemState: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>];
    itemState: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>];
    itemRefs: T_Refs[K_Type][ItemName<K_Type, T_ItemType, T_State>];
};
export declare function _createStoreHelpers<T_AllInfo extends {
    [T_ItemType: string]: {
        state: (itemName: any) => any;
        refs: (itemName: any, type: any) => any;
        startStates?: Record<any, any>;
    };
}, T_ItemType extends keyof T_AllInfo, T_StepNamesParam extends Readonly<string[]>>(allInfo: T_AllInfo, extraOptions?: {
    stepNames: T_StepNamesParam;
    dontSetMeta?: boolean;
}): {
    getPreviousState: () => { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; };
    getState: () => DeepReadonly<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }>;
    setState: SetPietemState<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }>;
    onNextTick: (callback: PietemCallback) => void;
    getRefs: () => { [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; };
    getItem: <K_Type_2 extends T_ItemType, T_ItemName extends ExtendsString<KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_2]>>>(type: K_Type_2, name: T_ItemName) => [{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_2][T_ItemName], { [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; }[K_Type_2][T_ItemName], { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_2][T_ItemName]];
    makeRules: <K_RuleName extends string, K_RulesToAdd extends (arg0: {
        itemEffect: <K_Type_3 extends T_ItemType, K_PropertyName extends KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_3][ExtendsString<KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_3]>>]>>(options: ItemEffect_RuleOptions<K_Type_3, K_PropertyName, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, { [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; }, "default" | T_StepNamesParam[number]>) => any;
        effect: <K_Type_4 extends T_ItemType>(options: Effect_RuleOptions<K_Type_4, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, "default" | T_StepNamesParam[number]>) => any;
    }) => Record<K_RuleName, MakeRule_Rule<T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, { [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; }, "default" | T_StepNamesParam[number]>>>(rulesToAdd: K_RulesToAdd) => {
        start: (ruleName: K_RuleName) => void;
        stop: (ruleName: K_RuleName) => void;
        startAll: () => void;
        stopAll: () => void;
        ruleNames: K_RuleName[];
    };
    makeDynamicRules: <K_RuleName_1 extends string, T_MakeRule_Function extends (...args: any) => MakeRule_Rule<T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, { [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; }, "default" | T_StepNamesParam[number]>, T_RulesToAdd = Record<K_RuleName_1, T_MakeRule_Function>>(rulesToAdd: (arg0: {
        itemEffect: <K_Type_5 extends T_ItemType, K_PropertyName_1 extends KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_5][ExtendsString<KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_5]>>]>, T_Options extends unknown>(theRule: (options: T_Options) => ItemEffect_RuleOptions<K_Type_5, K_PropertyName_1, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, { [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; }, "default" | T_StepNamesParam[number]>) => (options: T_Options) => any;
        effect: <K_Type_6 extends T_ItemType, T_Options_1 extends unknown>(theRule: (options: T_Options_1) => Effect_RuleOptions<K_Type_6, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, "default" | T_StepNamesParam[number]>) => (options: T_Options_1) => any;
    }) => T_RulesToAdd) => {
        start: <K_ChosenRuleName extends keyof T_RulesToAdd & K_RuleName_1>(ruleName: K_ChosenRuleName, options: Parameters<T_RulesToAdd[K_ChosenRuleName]>[0]) => void;
        stop: <K_ChosenRuleName_1 extends keyof T_RulesToAdd & K_RuleName_1>(ruleName: K_ChosenRuleName_1, options: Parameters<T_RulesToAdd[K_ChosenRuleName_1]>[0]) => void;
        ruleNames: (keyof T_RulesToAdd)[];
        startAll: (options: Parameters<T_RulesToAdd[keyof T_RulesToAdd]>[0]) => void;
        stopAll: (options: Parameters<T_RulesToAdd[keyof T_RulesToAdd]>[0]) => void;
    };
    startEffect: <K_Type_7 extends T_ItemType>(theEffect: Effect_RuleOptions<K_Type_7, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, "default" | T_StepNamesParam[number]>) => void;
    startItemEffect: <K_Type_8 extends T_ItemType, K_PropertyName_2 extends KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_8][ExtendsString<KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_8]>>]>>({ check, run, atStepEnd, name, step, }: ItemEffect_RuleOptions<K_Type_8, K_PropertyName_2, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, { [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; }, "default" | T_StepNamesParam[number]>) => string;
    stopEffect: (listenerName: string) => void;
    useStore: <K_Type_9 extends T_ItemType, T_ReturnedPietemProps>(whatToReturn: (state: DeepReadonly<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }>) => T_ReturnedPietemProps, check: EffectRule_Check<K_Type_9, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }>, hookDeps?: any[]) => T_ReturnedPietemProps;
    useStoreEffect: <K_Type_10 extends T_ItemType>(run: EffectCallback<T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }>, check: EffectRule_Check<K_Type_10, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }>, hookDeps?: any[]) => void;
    useStoreItem: <K_Type_11 extends T_ItemType, K_PropertyName_3 extends KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_11][ExtendsString<KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_11]>>]>, T_ReturnType, T_TheParameters = UseStoreItemParams<K_Type_11, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, { [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; }>>(itemEffectCallback: (loopedInfo: T_TheParameters) => T_ReturnType, check: OneItem_Check<K_Type_11, K_PropertyName_3, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }>, hookDeps?: any[]) => T_ReturnType;
    useStoreItemEffect: <K_Type_12 extends T_ItemType, K_PropertyName_4 extends KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_12][ExtendsString<KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_12]>>]>, T_ReturnType_1>(run: (loopedInfo: ItemEffectCallbackParams<K_Type_12, K_PropertyName_4, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, { [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; }>) => T_ReturnType_1, check: ItemEffectRule_Check<K_Type_12, K_PropertyName_4, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }>, hookDeps?: any[]) => void;
    useStoreItemPropsEffect: <K_Type_13 extends T_ItemType>(checkItem: {
        type: K_Type_13;
        name: ExtendsString<KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_13]>>;
        step?: "default" | T_StepNamesParam[number];
    }, onPropChanges: Partial<{ [K_PropertyName_5 in KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_13][ExtendsString<KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_13]>>]>]: ItemEffectCallback<K_Type_13, K_PropertyName_5, T_ItemType, { [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }, { [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; }>; }>, hookDeps?: any[]) => void;
    addItem: <K_Type_14 extends T_ItemType>(addItemOptions: {
        type: K_Type_14;
        name: string;
        state?: Partial<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_14][ExtendsString<KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_14]>>]>;
        refs?: Partial<{ [K_Type_1 in T_ItemType]: Record<T_AllInfo[K_Type_1]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type_1]["startStates"] : string, ReturnType<T_AllInfo[K_Type_1]["refs"]>>; }[K_Type_14][ExtendsString<KeysOfUnion<{ [K_Type in T_ItemType]: Record<T_AllInfo[K_Type]["startStates"] extends Record<string, any> ? keyof T_AllInfo[K_Type]["startStates"] : string, ReturnType<T_AllInfo[K_Type]["state"]>>; }[K_Type_14]>>]>;
    }, callback?: any) => void;
    removeItem: (itemInfo: {
        type: T_ItemType;
        name: string;
    }) => void;
};
export {};
