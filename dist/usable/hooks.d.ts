import { AllState, DeepReadonly, Effect_Check, Effect_Run, ItemEffect_Check, ItemEffect_Run, ItemEffect_Run_Params, ItemName, ItemType, OneItem_Check, PropName, StepName, UseStoreItem_Params } from "../types";
export declare function useStore<K_Type extends ItemType, T_ReturnedRepondProps>(whatToReturn: (state: DeepReadonly<AllState>) => T_ReturnedRepondProps, check: Effect_Check<K_Type>, hookDeps?: any[]): T_ReturnedRepondProps;
export declare function useStoreEffect<K_Type extends ItemType>(run: Effect_Run, check: Effect_Check<K_Type>, hookDeps?: any[]): void;
export declare function useStoreItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>, T_ReturnType>(run: (loopedInfo: ItemEffect_Run_Params<K_Type, K_PropName>) => T_ReturnType, check: ItemEffect_Check<K_Type, K_PropName>, hookDeps?: any[]): void;
export declare function useStoreItem<K_Type extends ItemType, K_PropName extends PropName<K_Type>, T_ReturnType, T_TheParams = UseStoreItem_Params<K_Type>>(itemEffectCallback: (loopedInfo: T_TheParams) => T_ReturnType, check: OneItem_Check<K_Type, K_PropName>, hookDeps?: any[]): T_ReturnType;
export declare function useStoreItemPropsEffect<K_Type extends ItemType>(checkItem: {
    type: K_Type;
    name: ItemName<K_Type>;
    step?: StepName;
}, onPropChanges: Partial<{
    [K_PropName in PropName<K_Type>]: ItemEffect_Run<K_Type, K_PropName>;
}>, hookDeps?: any[]): void;
