import { EasyEffect, Effect, ItemEffect, ItemType, PropName } from "../types";
import { RepondTypes } from "../declarations";
type RemoveEffectsSuffix<T extends string> = T extends `${infer Prefix}Effects` ? Prefix : T;
export type RefinedEffectGroups = {
    [K in keyof RepondTypes["EffectGroups"] as RemoveEffectsSuffix<K>]: RepondTypes["EffectGroups"][K];
};
export declare function startNewEffect<K_Type extends ItemType>(theEffect: EasyEffect<K_Type>): void;
export declare function startNewItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(itemEffect: ItemEffect<K_Type, K_PropName>): string;
export declare function stopNewEffect(effectName: string): void;
export declare function startEffect<K_EffectGroup extends keyof RefinedEffectGroups, K_EffectName extends keyof RefinedEffectGroups[K_EffectGroup] & string>(groupName: K_EffectGroup, effectName: K_EffectName): void;
export declare function stopEffect<K_EffectGroup extends keyof RefinedEffectGroups, K_EffectName extends keyof RefinedEffectGroups[K_EffectGroup] & string>(groupName: K_EffectGroup, effectName: K_EffectName): void;
export declare function startEffectsGroup<K_EffectGroup extends keyof RefinedEffectGroups>(groupName: K_EffectGroup): void;
export declare function stopEffectsGroup<K_EffectGroup extends keyof RefinedEffectGroups>(groupName: K_EffectGroup): void;
export declare function startAllEffectsGroups(): void;
export declare function stopAllEffectsGroups(): void;
export declare function runEffect<K_EffectGroup extends keyof RefinedEffectGroups, K_EffectName extends keyof RefinedEffectGroups[K_EffectGroup] & string>(groupName: K_EffectGroup, effectName: K_EffectName): void;
export declare function runEffectsGroup<K_EffectGroup extends keyof RefinedEffectGroups>(groupName: K_EffectGroup): void;
export type MakeEffect = <K_Type extends ItemType>(easyEffect: EasyEffect<K_Type>) => Effect;
export type MakeItemEffect = <K_Type extends ItemType, K_PropName extends PropName<K_Type>>(itemEffect: ItemEffect<K_Type, K_PropName>) => Effect;
export declare function makeEffect<K_Type extends ItemType>(easyEffect: EasyEffect<K_Type>): Effect;
export declare function makeItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(itemEffect: ItemEffect<K_Type, K_PropName>): Effect;
export declare function makeEffects<K_EffectName extends string>(effectsToAdd: (arg0: {
    itemEffect: MakeItemEffect;
    effect: MakeEffect;
}) => Record<K_EffectName, Effect>): Record<K_EffectName, Effect>;
export declare function initEffectGroups<T extends Record<string, ReturnType<typeof makeEffects>>>(groups: T): T;
export {};
