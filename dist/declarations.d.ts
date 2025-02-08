import { ParamEffectsGroup } from "./usable/paramEffects";
export type ItemTypeDefUntyped = {
    newState: (itemId?: any) => any;
    newRefs: (itemId?: any, type?: any) => any;
};
export type ItemTypeDefsUntyped = Record<string, ItemTypeDefUntyped>;
export interface RepondTypesUntyped {
    ItemTypeDefs: ItemTypeDefsUntyped;
    StepNames: string[] | readonly string[];
    EffectGroups: Record<string, Record<string, any>>;
    ParamEffectGroups: Record<string, ParamEffectsGroup<any, any>>;
}
export interface CustomRepondTypes {
}
export interface RepondTypes extends Omit<RepondTypesUntyped, keyof CustomRepondTypes>, CustomRepondTypes {
}
