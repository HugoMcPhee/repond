import { AllRefs, AllState, DeepReadonly, EasyEffect_Check, EasyEffect_Run, ItemEffect_Check, ItemEffect_Run, ItemEffect_Run_Params, ItemId, ItemType, PropName, StepName, UseStoreItem_Check_OneItem } from "../types";
export type UseStoreItem_Params<K_Type extends ItemType> = {
    itemId: ItemId<K_Type>;
    prevItemState: AllState[K_Type][ItemId<K_Type>];
    itemState: AllState[K_Type][ItemId<K_Type>];
    itemRefs: AllRefs[K_Type][ItemId<K_Type>];
};
export declare function useStore<K_Type extends ItemType, T_ReturnedRepondProps>(whatToReturn: (state: DeepReadonly<AllState>) => T_ReturnedRepondProps, check: EasyEffect_Check<K_Type>, hookDeps?: any[]): T_ReturnedRepondProps;
export declare function useStoreEffect<K_Type extends ItemType>(run: EasyEffect_Run, check: EasyEffect_Check<K_Type>, hookDeps?: any[]): void;
export declare function useStoreItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>, T_ReturnType>(run: (loopedInfo: ItemEffect_Run_Params<K_Type, K_PropName>) => T_ReturnType, check: ItemEffect_Check<K_Type, K_PropName>, hookDeps?: any[]): void;
export declare function useStoreItem<K_Type extends ItemType, K_PropName extends PropName<K_Type>, T_ReturnType, T_TheParams = UseStoreItem_Params<K_Type>>(itemEffectCallback: (loopedInfo: T_TheParams) => T_ReturnType, check: UseStoreItem_Check_OneItem<K_Type, K_PropName>, hookDeps?: any[]): T_ReturnType;
export declare function useStoreItemPropsEffect<K_Type extends ItemType>(checkItem: {
    type: K_Type;
    id: ItemId<K_Type>;
    step?: StepName;
}, onPropChanges: Partial<{
    [K_PropName in PropName<K_Type>]: ItemEffect_Run<K_Type, K_PropName>;
}>, hookDeps?: any[]): void;
