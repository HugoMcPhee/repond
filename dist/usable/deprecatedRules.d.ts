import { AllState, ItemType, MakeRule_Rule, StepName } from "../types";
import { MakeDynamicEffectInlineFunction, MakeDynamicItemEffectInlineFunction, MakeEffect, MakeItemEffect } from "../usable/effects";
/** @deprecated Please use makeEffects instead*/
export declare function makeRules<K_EffectName extends string, K_EffectGroupName extends string>(rulesToAdd: (arg0: {
    itemEffect: MakeItemEffect;
    effect: MakeEffect;
}) => Record<K_EffectName, MakeRule_Rule>, rulesName?: K_EffectGroupName): {
    start: (ruleName: K_EffectName) => void;
    stop: (ruleName: K_EffectName) => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: K_EffectName[];
    run: (ruleName: K_EffectName) => void;
    runAll: () => void;
};
export declare function makeDynamicRules<K_RuleName extends string, T_MakeRule_Function extends (...args: any) => MakeRule_Rule, T_RulesToAdd = Record<K_RuleName, T_MakeRule_Function>>(rulesToAdd: (arg0: {
    itemEffect: MakeDynamicItemEffectInlineFunction;
    effect: MakeDynamicEffectInlineFunction;
}) => T_RulesToAdd): {
    start: <K_ChosenRuleName extends keyof T_RulesToAdd & K_RuleName>(ruleName: K_ChosenRuleName, options: Parameters<T_RulesToAdd[K_ChosenRuleName]>[0]) => void;
    stop: <K_ChosenRuleName_1 extends keyof T_RulesToAdd & K_RuleName>(ruleName: K_ChosenRuleName_1, options: Parameters<T_RulesToAdd[K_ChosenRuleName_1]>[0]) => void;
    ruleNames: (keyof T_RulesToAdd)[];
    startAll: (options: Parameters<T_RulesToAdd[keyof T_RulesToAdd]>[0]) => void;
    stopAll: (options: Parameters<T_RulesToAdd[keyof T_RulesToAdd]>[0]) => void;
};
export declare function makeRuleMaker<T_StoreName extends ItemType & string, T_StoreItemName extends keyof AllState[T_StoreName] & string, T_PropertyName extends keyof AllState[T_StoreName][T_StoreItemName] & string, T_StepName extends StepName, T_UsefulParams extends Record<any, any>>(storeName: T_StoreName, storeItemName: T_StoreItemName, storyProperty: T_PropertyName, stepName?: T_StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName][T_StoreItemName][T_PropertyName], (usefulStuff: T_UsefulParams) => void>>) => {
    start: (ruleName: "whenPropertyChanges") => void;
    stop: (ruleName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: "whenPropertyChanges"[];
    run: (ruleName: "whenPropertyChanges") => void;
    runAll: () => void;
};
export declare function makeLeaveRuleMaker<T_StoreName extends ItemType & string, T_StoreItemName extends keyof AllState[T_StoreName] & string, T_PropertyName extends keyof AllState[T_StoreName][T_StoreItemName] & string, T_StepName extends StepName, T_UsefulParams extends Record<any, any>>(storeName: T_StoreName, storeItemName: T_StoreItemName, storyProperty: T_PropertyName, stepName?: T_StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName][T_StoreItemName][T_PropertyName], (usefulStuff: T_UsefulParams) => void>>) => {
    start: (ruleName: "whenPropertyChanges") => void;
    stop: (ruleName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: "whenPropertyChanges"[];
    run: (ruleName: "whenPropertyChanges") => void;
    runAll: () => void;
};
export declare function makeNestedRuleMaker<T_StoreName1 extends ItemType & string, T_StoreItemName1 extends keyof AllState[T_StoreName1] & string, T_PropertyName1 extends keyof AllState[T_StoreName1][T_StoreItemName1] & string, T_StoreName2 extends ItemType & string, T_StoreItemName2 extends keyof AllState[T_StoreName2] & string, T_PropertyName2 extends keyof AllState[T_StoreName2][T_StoreItemName2] & string, T_StepName extends StepName, T_UsefulParams extends Record<any, any>>(storeInfo1: [T_StoreName1, T_StoreItemName1, T_PropertyName1], storeInfo2: [T_StoreName2, T_StoreItemName2, T_PropertyName2], stepName?: T_StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName1][T_StoreItemName1][T_PropertyName1], Partial<Record<AllState[T_StoreName2][T_StoreItemName2][T_PropertyName2], (usefulStuff: ReturnType<NonNullable<typeof getUsefulParams>>) => void>>>>) => {
    start: (ruleName: "whenPropertyChanges") => void;
    stop: (ruleName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: "whenPropertyChanges"[];
    run: (ruleName: "whenPropertyChanges") => void;
    runAll: () => void;
};
export declare function makeNestedLeaveRuleMaker<T_StoreName1 extends ItemType & string, T_StoreItemName1 extends keyof AllState[T_StoreName1] & string, T_PropertyName1 extends keyof AllState[T_StoreName1][T_StoreItemName1] & string, T_StoreName2 extends ItemType & string, T_StoreItemName2 extends keyof AllState[T_StoreName2] & string, T_PropertyName2 extends keyof AllState[T_StoreName2][T_StoreItemName2] & string, T_UsefulParams extends Record<any, any>>(storeInfo1: [T_StoreName1, T_StoreItemName1, T_PropertyName1], storeInfo2: [T_StoreName2, T_StoreItemName2, T_PropertyName2], stepName?: StepName, getUsefulParams?: () => T_UsefulParams): (callBacksObject: Partial<Record<AllState[T_StoreName1][T_StoreItemName1][T_PropertyName1], Partial<Record<AllState[T_StoreName2][T_StoreItemName2][T_PropertyName2], (usefulStuff: T_UsefulParams) => void>>>>) => {
    start: (ruleName: "whenPropertyChanges") => void;
    stop: (ruleName: "whenPropertyChanges") => void;
    startAll: () => void;
    stopAll: () => void;
    ruleNames: "whenPropertyChanges"[];
    run: (ruleName: "whenPropertyChanges") => void;
    runAll: () => void;
};
