export declare function initRepond<T_AllInfo extends {
    [StoreName: string]: {
        state: (itemName: any) => any;
        refs: (itemName: any, type: any) => any;
        startStates?: Record<any, any>;
    };
}, T_ItemType extends keyof T_AllInfo, T_StepNamesParam extends Readonly<string[]>>(allInfo: T_AllInfo, extraOptions?: {
    stepNames: T_StepNamesParam;
    dontSetMeta?: boolean;
    framerate?: "full" | "half" | "auto";
}): void;
