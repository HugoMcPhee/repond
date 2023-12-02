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
}
export interface CustomRepondTypes {
}
export interface RepondTypes extends Omit<RepondTypesUntyped, keyof CustomRepondTypes>, CustomRepondTypes {
}
