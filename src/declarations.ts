import { ParamEffectsGroup } from "./usable/paramEffects";

export type ItemTypeDefUntyped = {
  newState: (itemId?: any) => any; // NOTE the itemId and type might not be realiably passed in
  newRefs: (itemId?: any, type?: any) => any; // NOTE the itemId and type might not be realiably passed in
};

export type ItemTypeDefs = Record<string, ItemTypeDefUntyped>;

export interface RepondTypesUntyped {
  ItemTypeDefs: ItemTypeDefs;
  StepNames: string[] | readonly string[];
  EffectGroups: Record<string, Record<string, any>>; // TOTO maybe rename groupedEffects
  ParamEffectGroups: Record<string, ParamEffectsGroup<any, any>>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CustomRepondTypes {}

// The final usable types, with the custom types overriding the default ones
export interface RepondTypes extends Omit<RepondTypesUntyped, keyof CustomRepondTypes>, CustomRepondTypes {}
