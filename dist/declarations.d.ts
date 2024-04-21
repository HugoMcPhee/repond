import { ParamEffectsGroup } from "./usable/paramEffects";
export type StoreInfoUntyped = {
    getDefaultState: (itemId?: any) => any;
    getDefaultRefs: (itemId?: any, type?: any) => any;
    startStates?: Record<any, any>;
};
export type AllStoreInfoUntyped = Record<string, StoreInfoUntyped>;
export interface RepondTypesUntyped {
    AllStoreInfo: AllStoreInfoUntyped;
    StepNames: string[] | readonly string[];
    EffectGroups: Record<string, Record<string, any>>;
    ParamEffectGroups: Record<string, ParamEffectsGroup<any, any>>;
}
export interface CustomRepondTypes {
}
export interface RepondTypes extends Omit<RepondTypesUntyped, keyof CustomRepondTypes>, CustomRepondTypes {
}
