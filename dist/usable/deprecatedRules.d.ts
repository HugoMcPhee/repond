import { AllState, EasyEffect, Effect, ItemEffect, ItemType, PropName, StepName } from "../types";
import { MakeEffect, MakeItemEffect } from "./effects";
export type MakeDynamicEffect = <K_Type extends ItemType, T_Params extends any>(itemEffectGetter: (params: T_Params) => EasyEffect<K_Type>) => (params: T_Params) => Effect;
export type MakeDynamicItemEffect = <K_Type extends ItemType, K_PropName extends PropName<K_Type>, T_Options extends any>(itemEffectGetter: (params: T_Options) => ItemEffect<K_Type, K_PropName>) => (params: T_Options) => Effect;
/** @deprecated Please use makeEffects instead*/
export declare function makeRules<K_EffectName extends string, K_EffectGroupName extends string>(getEffectsToAdd: (arg0: {
    itemEffect: MakeItemEffect;
    effect: MakeEffect;
}) => Record<K_EffectName, Effect>, rulesName?: K_EffectGroupName): {
    start: (effectName: K_EffectName) => void;
    stop: (effectName: K_EffectName) => void;
    startAll: () => void;
    stopAll: () => void;
    effectNames: K_EffectName[];
    run: (effectName: K_EffectName) => void;
    runAll: () => void;
};
/** @deprecated This may change to a way to define paramed effects*/
export declare function makeDynamicRules<K_EffectName extends string, T_MakeRule_Function extends (...args: any) => Effect, T_EffectGettersToAdd extends Record<K_EffectName, T_MakeRule_Function>>(getEffectGetters: (arg0: {
    itemEffect: MakeDynamicItemEffect;
    effect: MakeDynamicEffect;
}) => T_EffectGettersToAdd): {
    start: <K_ChosenRuleName extends keyof T_EffectGettersToAdd & K_EffectName>(ruleName: K_ChosenRuleName, params: Parameters<T_EffectGettersToAdd[K_ChosenRuleName]>[0]) => void;
    stop: <K_ChosenRuleName_1 extends K_EffectName>(ruleName: K_ChosenRuleName_1, params: Parameters<T_EffectGettersToAdd[K_ChosenRuleName_1]>[0]) => void;
    effectNames: K_EffectName[];
    startAll: (params: Parameters<T_EffectGettersToAdd[K_EffectName]>[0]) => void;
    stopAll: (params: Parameters<T_EffectGettersToAdd[K_EffectName]>[0]) => void;
};
export declare function makeRuleMaker<T_StoreName extends ItemType & string, T_StoreItemId extends keyof AllState[T_StoreName] & string, T_PropertyName extends keyof AllState[T_StoreName][T_StoreItemId] & string, T_StepName extends StepName, T_UsefulParams extends Record<any, any>>(storeName: T_StoreName, storeItemId: T_StoreItemId, storyProperty: T_PropertyName, stepName?: T_StepName, getUsefulParams?: () => T_UsefulParams): (callbacksMap: Partial<Record<AllState[T_StoreName][T_StoreItemId][T_PropertyName], (usefulStuff: T_UsefulParams) => void>>) => {
    start: (effectName: "whenPropertyChanges") => void;
    stop: (effectName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    effectNames: "whenPropertyChanges"[];
    run: (effectName: "whenPropertyChanges") => void;
    runAll: () => void;
};
export declare function makeLeaveRuleMaker<T_StoreName extends ItemType & string, T_StoreItemId extends keyof AllState[T_StoreName] & string, T_PropertyName extends keyof AllState[T_StoreName][T_StoreItemId] & string, T_StepName extends StepName, T_UsefulParams extends Record<any, any>>(storeName: T_StoreName, storeItemId: T_StoreItemId, storyProperty: T_PropertyName, stepName?: T_StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName][T_StoreItemId][T_PropertyName], (usefulStuff: T_UsefulParams) => void>>) => {
    start: (effectName: "whenPropertyChanges") => void;
    stop: (effectName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    effectNames: "whenPropertyChanges"[];
    run: (effectName: "whenPropertyChanges") => void;
    runAll: () => void;
};
export declare function makeNestedRuleMaker<T_StoreName1 extends ItemType & string, T_StoreItemId1 extends keyof AllState[T_StoreName1] & string, T_PropName1 extends keyof AllState[T_StoreName1][T_StoreItemId1] & string, T_StoreName2 extends ItemType & string, T_StoreItemId2 extends keyof AllState[T_StoreName2] & string, T_PropName2 extends keyof AllState[T_StoreName2][T_StoreItemId2] & string, T_StepName extends StepName, T_UsefulParams extends Record<any, any>>(storeInfo1: [T_StoreName1, T_StoreItemId1, T_PropName1], storeInfo2: [T_StoreName2, T_StoreItemId2, T_PropName2], stepName?: T_StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName1][T_StoreItemId1][T_PropName1], Partial<Record<AllState[T_StoreName2][T_StoreItemId2][T_PropName2], (usefulStuff: ReturnType<NonNullable<typeof getUsefulParams>>) => void>>>>) => {
    start: (effectName: "whenPropertyChanges") => void;
    stop: (effectName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    effectNames: "whenPropertyChanges"[];
    run: (effectName: "whenPropertyChanges") => void;
    runAll: () => void;
};
export declare function makeNestedLeaveRuleMaker<T_StoreName1 extends ItemType & string, T_StoreItemId1 extends keyof AllState[T_StoreName1] & string, T_PropertyName1 extends keyof AllState[T_StoreName1][T_StoreItemId1] & string, T_StoreName2 extends ItemType & string, T_StoreItemId2 extends keyof AllState[T_StoreName2] & string, T_PropertyName2 extends keyof AllState[T_StoreName2][T_StoreItemId2] & string, T_UsefulParams extends Record<any, any>>(storeInfo1: [T_StoreName1, T_StoreItemId1, T_PropertyName1], storeInfo2: [T_StoreName2, T_StoreItemId2, T_PropertyName2], stepName?: StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName1][T_StoreItemId1][T_PropertyName1], Partial<Record<AllState[T_StoreName2][T_StoreItemId2][T_PropertyName2], (usefulStuff: T_UsefulParams) => void>>>>) => {
    start: (effectName: "whenPropertyChanges") => void;
    stop: (effectName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    effectNames: "whenPropertyChanges"[];
    run: (effectName: "whenPropertyChanges") => void;
    runAll: () => void;
};
