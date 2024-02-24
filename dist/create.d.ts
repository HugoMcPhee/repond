import { KeysOfUnion, DeepReadonly, SetRepondState, XOR, ExtendsString, GetPartialState, RepondCallback } from "./types";
import { RepondTypes } from "./declarations";
type StepName = RepondTypes["StepNames"][number];
type AllStoreInfo = RepondTypes["AllStoreInfo"];
export type ItemType = keyof AllStoreInfo;
type Get_DefaultRefs<K_Type extends keyof AllStoreInfo> = AllStoreInfo[K_Type]["refs"];
type StartStatesItemName<K_Type extends keyof AllStoreInfo> = AllStoreInfo[K_Type]["startStates"] extends Record<string, any> ? keyof AllStoreInfo[K_Type]["startStates"] : string;
export type AllState = {
    [K_Type in ItemType]: AllStoreInfo[K_Type]["startStates"] extends Record<string, any> ? AllStoreInfo[K_Type]["startStates"] : Record<string, ReturnType<AllStoreInfo[K_Type]["state"]>>;
};
export type AllRefs = {
    [K_Type in ItemType]: Record<StartStatesItemName<K_Type>, ReturnType<Get_DefaultRefs<K_Type>>>;
};
type ItemName<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = ExtendsString<KeysOfUnion<T_State[K_Type]>>;
type PropertyName<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = KeysOfUnion<T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>]> & string;
type AllProperties<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    [K_Type in T_ItemType]: PropertyName<K_Type, T_ItemType, T_State>;
}[T_ItemType];
type DiffInfo_PropertiesChanged<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    [K_Type in T_ItemType]: Record<ItemName<K_Type, T_ItemType, T_State>, PropertyName<K_Type, T_ItemType, T_State>[]> & {
        all__: PropertyName<K_Type, T_ItemType, T_State>[];
    };
} & {
    all__: AllProperties<T_ItemType, T_State>[];
};
type DiffInfo_PropertiesChangedBool<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
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
type DiffInfo_ItemsChanged<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = Record<T_ItemType | "all__", ItemName<T_ItemType, T_ItemType, T_State>[]>;
type DiffInfo_ItemsChangedBool<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = Record<T_ItemType | "all__", Record<ItemName<T_ItemType, T_ItemType, T_State>, boolean>>;
type DiffInfo<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
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
type ItemEffectCallbackParams<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>> = {
    itemName: ItemName<K_Type, T_ItemType, T_State>;
    newValue: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>][K_PropertyName];
    previousValue: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>][K_PropertyName];
    itemState: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>];
    itemRefs: T_Refs[K_Type][ItemName<K_Type, T_ItemType, T_State>];
    frameDuration: number;
};
type ACheck_Becomes = undefined | string | number | boolean | ((theValue: any, prevValue: any) => boolean);
type OneItem_ACheck_SingleProperty<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    prop?: K_PropertyName;
    type: K_Type;
    name: ItemName<K_Type, T_ItemType, T_State>;
    becomes?: ACheck_Becomes;
    addedOrRemoved?: undefined;
};
type OneItem_ACheck_MultiProperties<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    prop?: K_PropertyName[];
    type: K_Type;
    name: ItemName<K_Type, T_ItemType, T_State>;
    becomes?: ACheck_Becomes;
    addedOrRemoved?: undefined;
};
type OneItem_Check<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = OneItem_ACheck_SingleProperty<K_Type, K_PropertyName, T_ItemType, T_State> | OneItem_ACheck_MultiProperties<K_Type, K_PropertyName, T_ItemType, T_State>;
type ItemEffectRule_Check_SingleProperty<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    prop?: K_PropertyName;
    type: K_Type;
    name?: ItemName<K_Type, T_ItemType, T_State>[] | ItemName<K_Type, T_ItemType, T_State>;
    becomes?: ACheck_Becomes;
    addedOrRemoved?: undefined;
};
type ItemEffectRule_Check_MultiProperties<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    prop?: K_PropertyName[];
    type: K_Type;
    name?: ItemName<K_Type, T_ItemType, T_State>[] | ItemName<K_Type, T_ItemType, T_State>;
    becomes?: ACheck_Becomes;
    addedOrRemoved?: undefined;
};
type ItemEffectRule_Check<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = ItemEffectRule_Check_SingleProperty<K_Type, K_PropertyName, T_ItemType, T_State> | ItemEffectRule_Check_MultiProperties<K_Type, K_PropertyName, T_ItemType, T_State>;
type ItemEffectCallback<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>> = (loopedInfo: ItemEffectCallbackParams<K_Type, K_PropertyName, T_ItemType, T_State, T_Refs>) => void;
type ItemEffect_RuleOptions<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>, T_StepName extends string> = {
    check: ItemEffectRule_Check<K_Type, K_PropertyName, T_ItemType, T_State>;
    run: ItemEffectCallback<K_Type, K_PropertyName, T_ItemType, T_State, T_Refs>;
    atStepEnd?: boolean;
    name?: string;
    step?: T_StepName;
    runAtStart?: boolean;
    _isPerItem?: true;
};
type ItemEffect_RuleOptions__NoMeta<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>, T_StepName extends string> = {
    check: ItemEffectRule_Check<K_Type, K_PropertyName, T_ItemType, T_State>;
    run: ItemEffectCallback<K_Type, K_PropertyName, T_ItemType, T_State, T_Refs>;
    atStepEnd?: boolean;
    name?: string;
    step?: T_StepName;
    runAtStart?: boolean;
};
type EffectRule_ACheck_OneItemType<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    type?: K_Type;
    name?: ItemName<K_Type, T_ItemType, T_State> | ItemName<K_Type, T_ItemType, T_State>[];
    prop?: PropertyName<K_Type, T_ItemType, T_State>[];
    addedOrRemoved?: boolean;
    becomes?: undefined;
};
type EffectRule_ACheck_MultipleItemTypes<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = {
    type?: T_ItemType[];
    name?: ItemName<T_ItemType, T_ItemType, T_State> | ItemName<T_ItemType, T_ItemType, T_State>[];
    prop?: AllProperties<T_ItemType, T_State>[];
    addedOrRemoved?: boolean;
    becomes?: undefined;
};
type EffectRule_ACheck<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = EffectRule_ACheck_OneItemType<K_Type, T_ItemType, T_State> | EffectRule_ACheck_MultipleItemTypes<T_ItemType, T_State>;
type EffectRule_Check<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = EffectRule_ACheck<K_Type, T_ItemType, T_State>[] | EffectRule_ACheck<K_Type, T_ItemType, T_State>;
type EffectCallback<T_ItemType extends string | number | symbol, T_State extends Record<any, any>> = (diffInfo: DiffInfo<T_ItemType, T_State>, frameDuration: number, skipChangeCheck?: boolean) => void;
type Effect_RuleOptions<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_StepName extends string> = {
    name?: string;
    check: EffectRule_Check<K_Type, T_ItemType, T_State>;
    run: EffectCallback<T_ItemType, T_State>;
    atStepEnd?: boolean;
    step?: T_StepName;
    runAtStart?: boolean;
    _isPerItem?: false;
};
type Effect_RuleOptions__NoMeta<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_StepName extends string> = {
    name?: string;
    check: EffectRule_Check<K_Type, T_ItemType, T_State>;
    run: EffectCallback<T_ItemType, T_State>;
    atStepEnd?: boolean;
    step?: T_StepName;
    runAtStart?: boolean;
};
type FlexibleRuleOptions<K_Type extends T_ItemType, K_PropertyName extends PropertyName<K_Type, T_ItemType, T_State>, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>, T_StepName extends string> = XOR<Effect_RuleOptions<K_Type, T_ItemType, T_State, T_StepName>, ItemEffect_RuleOptions<K_Type, K_PropertyName, T_ItemType, T_State, T_Refs, T_StepName>>;
type MakeRule_Rule<T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>, T_StepName extends string> = FlexibleRuleOptions<T_ItemType, PropertyName<T_ItemType, T_ItemType, T_State>, T_ItemType, T_State, T_Refs, T_StepName>;
type UseStoreItemParams<K_Type extends T_ItemType, T_ItemType extends string | number | symbol, T_State extends Record<any, any>, T_Refs extends Record<any, any>> = {
    itemName: ItemName<K_Type, T_ItemType, T_State>;
    prevItemState: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>];
    itemState: T_State[K_Type][ItemName<K_Type, T_ItemType, T_State>];
    itemRefs: T_Refs[K_Type][ItemName<K_Type, T_ItemType, T_State>];
};
export declare function initRepond<T_AllInfo extends {
    [StoreName: string]: {
        state: (itemName: any) => any;
        refs: (itemName: any, type: any) => any;
        startStates?: Record<any, any>;
    };
}, T_ItemType extends keyof T_AllInfo, T_StepNamesParam extends Readonly<string[]>>(allInfo: T_AllInfo, extraOptions?: {
    stepNames: T_StepNamesParam;
    dontSetMeta?: boolean;
    framerate?: "full" | "half" | "auto";
}): {
    getPreviousState: () => AllState;
    getState: () => {
        readonly [x: string]: {
            readonly [x: string]: any;
        };
        readonly [x: number]: {
            readonly [x: string]: any;
        };
    };
    setState: SetRepondState<AllState>;
    onNextTick: typeof onNextTick;
    getRefs: () => AllRefs;
    getItem: typeof getItem;
    makeRules: typeof makeRules;
    makeDynamicRules: typeof makeDynamicRules;
    makeRuleMaker: typeof makeRuleMaker;
    makeLeaveRuleMaker: typeof makeLeaveRuleMaker;
    makeNestedRuleMaker: typeof makeNestedRuleMaker;
    makeNestedLeaveRuleMaker: typeof makeNestedLeaveRuleMaker;
    startEffect: typeof startEffect;
    startItemEffect: typeof startItemEffect;
    stopEffect: typeof stopEffect;
    useStore: typeof useStore;
    useStoreEffect: typeof useStoreEffect;
    useStoreItem: typeof useStoreItem;
    useStoreItemEffect: typeof useStoreItemEffect;
    useStoreItemPropsEffect: typeof useStoreItemPropsEffect;
    addItem: typeof addItem;
    removeItem: typeof removeItem;
    makeEmptyPatch: typeof makeEmptyPatch;
    makeEmptyDiff: typeof makeEmptyDiff;
    applyPatch: typeof applyPatch;
    applyPatchHere: typeof applyPatchHere;
    getPatch: typeof getPatch;
    getPatchAndReversed: typeof getPatchAndReversed;
    getReversePatch: typeof getReversePatch;
    combineTwoPatches: typeof combineTwoPatches;
    combinePatches: typeof combinePatches;
    makeMinimalPatch: typeof makeMinimalPatch;
    removePartialPatch: typeof removePartialPatch;
    getDiff: typeof getDiff;
    getDiffFromPatches: typeof getDiffFromPatches;
    getPatchesFromDiff: typeof getPatchesFromDiff;
    combineTwoDiffs: typeof combineTwoDiffs;
    combineDiffs: typeof combineDiffs;
};
declare const getState: () => DeepReadonly<AllState>;
declare const setState: SetRepondState<AllState>;
declare function onNextTick(callback: RepondCallback): void;
declare const getPreviousState: () => AllState;
declare const getRefs: () => AllRefs;
declare function getItem<K_Type extends ItemType, T_ItemName extends ItemName<K_Type, ItemType, AllState>>(type: K_Type, name: T_ItemName): [AllState[K_Type][T_ItemName], AllRefs[K_Type][T_ItemName], AllState[K_Type][T_ItemName]];
declare function startEffect<K_Type extends ItemType>(theEffect: Effect_RuleOptions__NoMeta<K_Type, ItemType, AllState, StepName>): void;
declare function startItemEffect<K_Type extends ItemType, K_PropertyName extends PropertyName<K_Type, ItemType, AllState>>({ check, run, atStepEnd, name, step, runAtStart, }: ItemEffect_RuleOptions__NoMeta<K_Type, K_PropertyName, ItemType, AllState, AllRefs, StepName>): string;
declare function stopEffect(listenerName: string): void;
declare function useStore<K_Type extends ItemType, T_ReturnedRepondProps>(whatToReturn: (state: DeepReadonly<AllState>) => T_ReturnedRepondProps, check: EffectRule_Check<K_Type, ItemType, AllState>, hookDeps?: any[]): T_ReturnedRepondProps;
declare function useStoreEffect<K_Type extends ItemType>(run: EffectCallback<ItemType, AllState>, check: EffectRule_Check<K_Type, ItemType, AllState>, hookDeps?: any[]): void;
declare function useStoreItemEffect<K_Type extends ItemType, K_PropertyName extends PropertyName<K_Type, ItemType, AllState>, T_ReturnType>(run: (loopedInfo: ItemEffectCallbackParams<K_Type, K_PropertyName, ItemType, AllState, AllRefs>) => T_ReturnType, check: ItemEffectRule_Check<K_Type, K_PropertyName, ItemType, AllState>, hookDeps?: any[]): void;
declare function useStoreItem<K_Type extends ItemType, K_PropertyName extends PropertyName<K_Type, ItemType, AllState>, T_ReturnType, T_TheParameters = UseStoreItemParams<K_Type, ItemType, AllState, AllRefs>>(itemEffectCallback: (loopedInfo: T_TheParameters) => T_ReturnType, check: OneItem_Check<K_Type, K_PropertyName, ItemType, AllState>, hookDeps?: any[]): T_ReturnType;
declare function useStoreItemPropsEffect<K_Type extends ItemType>(checkItem: {
    type: K_Type;
    name: ItemName<K_Type, ItemType, AllState>;
    step?: StepName;
}, onPropChanges: Partial<{
    [K_PropertyName in PropertyName<K_Type, ItemType, AllState>]: ItemEffectCallback<K_Type, K_PropertyName, ItemType, AllState, AllRefs>;
}>, hookDeps?: any[]): void;
type AddItemOptions<K_Type extends ItemType> = {
    type: K_Type;
    name: string;
    state?: Partial<AllState[K_Type][ItemName<K_Type, ItemType, AllState>]>;
    refs?: Partial<AllRefs[K_Type][ItemName<K_Type, ItemType, AllState>]>;
};
declare function addItem<K_Type extends ItemType>(addItemOptions: AddItemOptions<K_Type>, callback?: any): void;
declare function removeItem(itemInfo: {
    type: ItemType;
    name: string;
}): void;
type MakeEffect = <K_Type extends ItemType>(options: Effect_RuleOptions__NoMeta<K_Type, ItemType, AllState, StepName>) => any;
type MakeItemEffect = <K_Type extends ItemType, K_PropertyName extends PropertyName<K_Type, ItemType, AllState>>(options: ItemEffect_RuleOptions__NoMeta<K_Type, K_PropertyName, ItemType, AllState, AllRefs, StepName>) => any;
type MakeDynamicEffectInlineFunction = <K_Type extends ItemType, T_Options extends any>(theRule: (options: T_Options) => Effect_RuleOptions__NoMeta<K_Type, ItemType, AllState, StepName>) => (options: T_Options) => any;
type MakeDynamicItemEffectInlineFunction = <K_Type extends ItemType, K_PropertyName extends PropertyName<K_Type, ItemType, AllState>, T_Options extends any>(theRule: (options: T_Options) => ItemEffect_RuleOptions__NoMeta<K_Type, K_PropertyName, ItemType, AllState, AllRefs, StepName>) => (options: T_Options) => any;
declare function makeRules<K_RuleName extends string>(rulesToAdd: (arg0: {
    itemEffect: MakeItemEffect;
    effect: MakeEffect;
}) => Record<K_RuleName, MakeRule_Rule<ItemType, AllState, AllRefs, StepName>>): {
    start: (ruleName: K_RuleName) => void;
    stop: (ruleName: K_RuleName) => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: K_RuleName[];
    run: (ruleName: K_RuleName) => void;
    runAll: () => void;
};
declare function makeDynamicRules<K_RuleName extends string, T_MakeRule_Function extends (...args: any) => MakeRule_Rule<ItemType, AllState, AllRefs, StepName>, T_RulesToAdd = Record<K_RuleName, T_MakeRule_Function>>(rulesToAdd: (arg0: {
    itemEffect: MakeDynamicItemEffectInlineFunction;
    effect: MakeDynamicEffectInlineFunction;
}) => T_RulesToAdd): {
    start: <K_ChosenRuleName extends keyof T_RulesToAdd & K_RuleName>(ruleName: K_ChosenRuleName, options: Parameters<T_RulesToAdd[K_ChosenRuleName]>[0]) => void;
    stop: <K_ChosenRuleName_1 extends keyof T_RulesToAdd & K_RuleName>(ruleName: K_ChosenRuleName_1, options: Parameters<T_RulesToAdd[K_ChosenRuleName_1]>[0]) => void;
    ruleNames: (keyof T_RulesToAdd)[];
    startAll: (options: Parameters<T_RulesToAdd[keyof T_RulesToAdd]>[0]) => void;
    stopAll: (options: Parameters<T_RulesToAdd[keyof T_RulesToAdd]>[0]) => void;
};
declare function makeRuleMaker<T_StoreName extends ItemType & string, T_StoreItemName extends keyof AllState[T_StoreName] & string, T_PropertyName extends keyof AllState[T_StoreName][T_StoreItemName] & string, T_StepName extends StepName, T_UsefulParams extends Record<any, any>>(storeName: T_StoreName, storeItemName: T_StoreItemName, storyProperty: T_PropertyName, stepName?: T_StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName][T_StoreItemName][T_PropertyName], (usefulStuff: T_UsefulParams) => void>>) => {
    start: (ruleName: "whenPropertyChanges") => void;
    stop: (ruleName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: "whenPropertyChanges"[];
    run: (ruleName: "whenPropertyChanges") => void;
    runAll: () => void;
};
declare function makeLeaveRuleMaker<T_StoreName extends ItemType & string, T_StoreItemName extends keyof AllState[T_StoreName] & string, T_PropertyName extends keyof AllState[T_StoreName][T_StoreItemName] & string, T_StepName extends StepName, T_UsefulParams extends Record<any, any>>(storeName: T_StoreName, storeItemName: T_StoreItemName, storyProperty: T_PropertyName, stepName?: T_StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName][T_StoreItemName][T_PropertyName], (usefulStuff: T_UsefulParams) => void>>) => {
    start: (ruleName: "whenPropertyChanges") => void;
    stop: (ruleName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: "whenPropertyChanges"[];
    run: (ruleName: "whenPropertyChanges") => void;
    runAll: () => void;
};
declare function makeNestedRuleMaker<T_StoreName1 extends ItemType & string, T_StoreItemName1 extends keyof AllState[T_StoreName1] & string, T_PropertyName1 extends keyof AllState[T_StoreName1][T_StoreItemName1] & string, T_StoreName2 extends ItemType & string, T_StoreItemName2 extends keyof AllState[T_StoreName2] & string, T_PropertyName2 extends keyof AllState[T_StoreName2][T_StoreItemName2] & string, T_StepName extends StepName, T_UsefulParams extends Record<any, any>>(storeInfo1: [T_StoreName1, T_StoreItemName1, T_PropertyName1], storeInfo2: [T_StoreName2, T_StoreItemName2, T_PropertyName2], stepName?: T_StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName1][T_StoreItemName1][T_PropertyName1], Partial<Record<AllState[T_StoreName2][T_StoreItemName2][T_PropertyName2], (usefulStuff: ReturnType<NonNullable<typeof getUsefulParams>>) => void>>>>) => {
    start: (ruleName: "whenPropertyChanges") => void;
    stop: (ruleName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: "whenPropertyChanges"[];
    run: (ruleName: "whenPropertyChanges") => void;
    runAll: () => void;
};
declare function makeNestedLeaveRuleMaker<T_StoreName1 extends ItemType & string, T_StoreItemName1 extends keyof AllState[T_StoreName1] & string, T_PropertyName1 extends keyof AllState[T_StoreName1][T_StoreItemName1] & string, T_StoreName2 extends ItemType & string, T_StoreItemName2 extends keyof AllState[T_StoreName2] & string, T_PropertyName2 extends keyof AllState[T_StoreName2][T_StoreItemName2] & string, T_UsefulParams extends Record<any, any>>(storeInfo1: [T_StoreName1, T_StoreItemName1, T_PropertyName1], storeInfo2: [T_StoreName2, T_StoreItemName2, T_PropertyName2], stepName?: StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName1][T_StoreItemName1][T_PropertyName1], Partial<Record<AllState[T_StoreName2][T_StoreItemName2][T_PropertyName2], (usefulStuff: T_UsefulParams) => void>>>>) => {
    start: (ruleName: "whenPropertyChanges") => void;
    stop: (ruleName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: "whenPropertyChanges"[];
    run: (ruleName: "whenPropertyChanges") => void;
    runAll: () => void;
};
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
declare function makeEmptyPatch(): StatesPatch;
declare function makeEmptyDiff(): StatesDiff;
declare function applyPatch(patch: StatesPatch): void;
declare function applyPatchHere(newStates: GetPartialState<AllState>, patch: StatesPatch): void;
declare function getPatch(prevState: GetPartialState<AllState>, newState: GetPartialState<AllState>): StatesPatch;
declare function getPatchAndReversed(prevState: GetPartialState<AllState>, newState: GetPartialState<AllState>): StatesPatch[];
declare function getReversePatch(partialState: GetPartialState<AllState>, newPatch: StatesPatch): StatesPatch;
declare function combineTwoPatches(prevPatch: StatesPatch, newPatch: StatesPatch): StatesPatch;
declare function combinePatches(patchesArray: StatesPatch[]): StatesPatch;
declare function makeMinimalPatch(currentStates: GetPartialState<AllState>, thePatch: StatesPatch): void;
declare function removePartialPatch(thePatch: StatesPatch, patchToRemove: StatesPatch): void;
declare function getDiff(prevState: GetPartialState<AllState>, newState: GetPartialState<AllState>): StatesDiff;
declare function getDiffFromPatches(forwardPatch: StatesPatch, reversePatch: StatesPatch): StatesDiff;
declare function getPatchesFromDiff(theDiff: StatesDiff): [StatesPatch, StatesPatch];
declare function combineTwoDiffs(prevDiff: StatesDiff, newDiff: StatesDiff): StatesDiff;
declare function combineDiffs(diffsArray: StatesDiff[]): StatesDiff;
export { getPreviousState, getState, setState, onNextTick, getRefs, getItem, makeRules, makeDynamicRules, makeRuleMaker, makeLeaveRuleMaker, makeNestedRuleMaker, makeNestedLeaveRuleMaker, startEffect, startItemEffect, stopEffect, useStore, useStoreEffect, useStoreItem, useStoreItemEffect, useStoreItemPropsEffect, addItem, removeItem, makeEmptyPatch, makeEmptyDiff, applyPatch, applyPatchHere, getPatch, getPatchAndReversed, getReversePatch, combineTwoPatches, combinePatches, makeMinimalPatch, removePartialPatch, getDiff, getDiffFromPatches, getPatchesFromDiff, combineTwoDiffs, combineDiffs, };
