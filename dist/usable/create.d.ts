import { ItemTypeDefsUntyped } from "../declarations";
import { RepondConfig } from "../meta";
export declare function initRepond<T_ItemTypeDefs extends ItemTypeDefsUntyped, T_StepNamesParam extends Readonly<string[]>>(itemTypeDefs: T_ItemTypeDefs, stepNames: T_StepNamesParam, config?: RepondConfig): void;
