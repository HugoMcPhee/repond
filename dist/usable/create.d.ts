import { AllStoreInfoUntyped } from "../declarations";
import { FramerateTypeOption } from "../types";
export declare function initRepond<T_AllInfo extends AllStoreInfoUntyped, T_StepNamesParam extends Readonly<string[]>>(allStoresInfoOriginal: T_AllInfo, extraOptions?: {
    stepNames: T_StepNamesParam;
    dontSetMeta?: boolean;
    framerate?: FramerateTypeOption;
}): void;
