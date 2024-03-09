export declare function initRepond<T_AllInfo extends {
    [StoreName: string]: {
        state: (itemId: any) => any;
        refs: (itemId: any, type: any) => any;
        startStates?: Record<any, any>;
    };
}, T_StepNamesParam extends Readonly<string[]>>(allInfo: T_AllInfo, extraOptions?: {
    stepNames: T_StepNamesParam;
    dontSetMeta?: boolean;
    framerate?: "full" | "half" | "auto";
}): void;
