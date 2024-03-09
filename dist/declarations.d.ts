export interface AllStoreInfoUntyped {
    [StoreName: string]: {
        state: (itemId: any) => any;
        refs: (itemId: any, type: any) => any;
        startStates?: Record<any, any>;
    };
}
export interface RepondTypesUntyped {
    AllStoreInfo: AllStoreInfoUntyped;
    StepNames: string[] | readonly string[];
    GroupedEffects: Record<string, Record<string, any>>;
}
export interface CustomRepondTypes {
}
export interface RepondTypes extends Omit<RepondTypesUntyped, keyof CustomRepondTypes>, CustomRepondTypes {
}
