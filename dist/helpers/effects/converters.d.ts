import { EasyEffect, Effect, ItemEffect, ItemType, PropName } from "../../types";
export declare function easyEffectToEffect<T_EasyEffect extends EasyEffect<any>>(easyEffect: T_EasyEffect): Effect;
export declare function itemEffectToEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(itemEffect: ItemEffect<K_Type, K_PropName>): Effect;
