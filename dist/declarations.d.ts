export interface AllStoreInfoUntyped {
    [StoreName: string]: {
        state: (itemName: any) => any;
        refs: (itemName: any, type: any) => any;
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
