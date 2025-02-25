import { EffectDef } from "../types";
export declare function _addEffect(newEffectDef: EffectDef): string;
export declare function runEffectWithoutChangeForItems(effect: EffectDef): void;
export declare function runEffectWithoutChange(effect: EffectDef): void;
export declare function getItemTypesFromEffect(effect: EffectDef): string[];
export declare function getItemIdsForEffect(effect: EffectDef): string[];
export declare function storeCachedValuesForEffect(effect: EffectDef): void;
export declare function _stopEffect(effectId: string): void;
export declare function toSafeEffectId(prefix?: string): string;
