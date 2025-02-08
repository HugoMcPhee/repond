import { RepondTypes } from "../declarations";
import { Effect } from "../types";
import { MakeEffect } from "./effects";
export type ParamEffectsGroup<K_EffectName extends string, T_Params extends any> = {
    defaultParams: T_Params;
    makeEffects: (makeEffect: MakeEffect, params: T_Params) => Record<K_EffectName, Effect>;
};
export declare function makeParamEffects<K_EffectName extends string, T_ParamKey extends string, T_Params extends Record<T_ParamKey, any>>(defaultParams: T_Params, effectsToAdd: (makeEffect: MakeEffect, params: T_Params) => Record<K_EffectName, Effect>): ParamEffectsGroup<K_EffectName, T_Params>;
export declare function initParamEffectGroups<T extends Record<string, ParamEffectsGroup<any, any>>>(groups: T): T;
type RemoveParamEffectsSuffix<T extends string> = T extends `${infer Prefix}ParamEffects` ? Prefix : T;
export type RefinedParamEffectGroups = {
    [K in keyof RepondTypes["ParamEffectGroups"] as RemoveParamEffectsSuffix<K>]: RepondTypes["ParamEffectGroups"][K];
};
export declare function startParamEffect<K_GroupName extends keyof RefinedParamEffectGroups & string, K_EffectName extends keyof ReturnType<RefinedParamEffectGroups[K_GroupName]["makeEffects"]> & string, T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]>(groupName: K_GroupName, effectName: K_EffectName, params: T_Params): void;
export declare function stopParamEffect<K_GroupName extends keyof RefinedParamEffectGroups & string, K_EffectName extends keyof ReturnType<RefinedParamEffectGroups[K_GroupName]["makeEffects"]> & string, T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]>(groupName: K_GroupName, effectName: K_EffectName, params: T_Params): void;
export declare function startParamEffectsGroup<K_GroupName extends keyof RefinedParamEffectGroups & string, T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]>(groupName: K_GroupName, params: T_Params): void;
export declare function stopParamEffectsGroup<K_GroupName extends keyof RefinedParamEffectGroups & string, T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]>(groupName: K_GroupName, params: T_Params): void;
export declare function runParamEffect<K_GroupName extends keyof RefinedParamEffectGroups & string, K_EffectName extends keyof ReturnType<RefinedParamEffectGroups[K_GroupName]["makeEffects"]> & string, T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]>(groupName: K_GroupName, effectName: K_EffectName, params: T_Params): void;
export declare function runParamEffectsGroup<K_GroupName extends keyof RefinedParamEffectGroups & string, T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]>(groupName: K_GroupName, params: T_Params): void;
export {};
