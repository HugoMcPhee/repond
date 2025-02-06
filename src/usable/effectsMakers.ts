import { toSafeEffectId } from "../helpers/effects/internal";
import { AllState, ItemType, StepName } from "../types";
import { makeEffects } from "./effects";
import { getPrevState, getState } from "./getSet";

export function makeEffectsMaker<
  T_StoreName extends ItemType & string,
  T_StoreItemId extends keyof AllState[T_StoreName] & string,
  T_PropertyName extends keyof AllState[T_StoreName][T_StoreItemId] & string,
  T_StepName extends StepName,
  T_UsefulParams extends Record<any, any>
>(
  storeName: T_StoreName,
  storeItemId: T_StoreItemId,
  storyProperty: T_PropertyName,
  stepName?: T_StepName,
  getUsefulParams?: () => T_UsefulParams
) {
  type StoreState = AllState[T_StoreName][T_StoreItemId];

  type PropertyValue = StoreState[T_PropertyName];
  type CallbacksMap = Partial<Record<PropertyValue, (usefulStuff: T_UsefulParams) => void>>;
  const mainEffectId = toSafeEffectId(`customEffectFor_${storeName}_${storyProperty}`);

  function newEffectMaker(callbacksMap: CallbacksMap) {
    return makeEffects((makeEffect) => ({
      whenPropertyChanges: makeEffect(
        (_, _diffInfo) => {
          const usefulParams = getUsefulParams?.();
          const latestValue = getState(storeName, storeItemId)[storyProperty] as PropertyValue;

          callbacksMap[latestValue]?.(usefulParams!);
        },
        {
          changes: [`${storeName}.${storyProperty}`],
          itemIds: [storeItemId],
          step: stepName ?? "default",
          atStepEnd: true,
          id: mainEffectId,
          isPerItem: false,
        }
      ),
    }));
  }

  return newEffectMaker;
}

export function makeLeaveEffectsMaker<
  T_StoreName extends ItemType & string,
  T_StoreItemId extends keyof AllState[T_StoreName] & string,
  T_PropertyName extends keyof AllState[T_StoreName][T_StoreItemId] & string,
  T_StepName extends StepName,
  T_UsefulParams extends Record<any, any>
>(
  storeName: T_StoreName,
  storeItemId: T_StoreItemId,
  storyProperty: T_PropertyName,
  stepName?: T_StepName,
  getUsefulParams?: () => T_UsefulParams
) {
  type StoreState = AllState[T_StoreName][T_StoreItemId];

  type PropertyValue = StoreState[T_PropertyName];
  type RulesOptions = Partial<Record<PropertyValue, (usefulStuff: T_UsefulParams) => void>>;
  const mainEffectId = toSafeEffectId(`customEffectFor_${storeName}_${storyProperty}`);
  function newEffectsMaker(callBacksObject: RulesOptions) {
    return makeEffects((makeEffect) => ({
      whenPropertyChanges: makeEffect(
        (_, _diffInfo) => {
          const usefulStoryStuff = getUsefulParams?.();
          const prevValue = getPrevState(storeName, storeItemId)[storyProperty] as PropertyValue;

          callBacksObject[prevValue]?.(usefulStoryStuff!);
        },
        {
          changes: [`${storeName}.${storyProperty}`],
          itemIds: [storeItemId],
          step: stepName ?? "default",
          atStepEnd: true,
          id: mainEffectId,
          isPerItem: false,
        }
      ),
    }));
  }

  return newEffectsMaker;
}

/** Similar to makeEffectsMaker but accepts parameters for two store properties (can be from different stores) , and the callback fires when properties of both stores change */
export function makeNestedEffectsMaker<
  T_StoreName1 extends ItemType & string,
  T_StoreItemId1 extends keyof AllState[T_StoreName1] & string,
  T_PropName1 extends keyof AllState[T_StoreName1][T_StoreItemId1] & string,
  T_StoreName2 extends ItemType & string,
  T_StoreItemId2 extends keyof AllState[T_StoreName2] & string,
  T_PropName2 extends keyof AllState[T_StoreName2][T_StoreItemId2] & string,
  T_StepName extends StepName,
  T_UsefulParams extends Record<any, any>
>(
  storeInfo1: [T_StoreName1, T_StoreItemId1, T_PropName1],
  storeInfo2: [T_StoreName2, T_StoreItemId2, T_PropName2],
  stepName?: T_StepName,
  getUsefulParams?: () => T_UsefulParams
) {
  const [storeName1, storeItemId1, storyProp1] = storeInfo1;
  const [storeName2, storeItemId2, storyProp2] = storeInfo2;

  type StoreState1 = AllState[T_StoreName1][T_StoreItemId1];
  type StoreState2 = AllState[T_StoreName2][T_StoreItemId2];

  type PropValue1 = StoreState1[T_PropName1];
  type PropValue2 = StoreState2[T_PropName2];
  type RulesOptions = Partial<
    Record<
      PropValue1,
      Partial<Record<PropValue2, (usefulStuff: ReturnType<NonNullable<typeof getUsefulParams>>) => void>>
    >
  >;
  const mainEffectId = toSafeEffectId(`customEffectFor_${storeName1}_${storyProp1}_${storeName2}_${storyProp2}`);
  function newEffectsMaker(callBacksObject: RulesOptions) {
    return makeEffects((makeEffect) => ({
      whenPropertyChanges: makeEffect(
        (_, diffInfo) => {
          const usefulStoryStuff = getUsefulParams?.();
          const latestValue1 = getState(storeName1, storeItemId1)?.[storyProp1] as PropValue1;
          const latestValue2 = getState(storeName2, storeItemId2)?.[storyProp2] as PropValue2;

          // Make sure value1 changed for itemType1 etc, since it listens for both itemIIds for both stores (might not be neccesary)
          const didValue1Change = diffInfo.propsChangedBool[storeName1][storeItemId1][storyProp1];
          const didValue2Change = diffInfo.propsChangedBool[storeName2][storeItemId2][storyProp2];
          if (didValue1Change || didValue2Change) return;

          callBacksObject[latestValue1]?.[latestValue2]?.(usefulStoryStuff!);
        },
        {
          changes: [`${storeName1}.${storyProp1}`, `${storeName2}.${storyProp2}`],
          itemIds: [storeItemId1, storeItemId2],
          step: stepName ?? "default",
          atStepEnd: true,
          id: mainEffectId,
        }
      ),
    }));
  }

  return newEffectsMaker;
}

/** The same as makeNestedRuleMaker , but the callback fires when the properties of both stores become NOT the specified values, but were previously */
export function makeNestedLeaveEffectsMaker<
  T_StoreName1 extends ItemType & string,
  T_StoreItemId1 extends keyof AllState[T_StoreName1] & string,
  T_PropertyName1 extends keyof AllState[T_StoreName1][T_StoreItemId1] & string,
  T_StoreName2 extends ItemType & string,
  T_StoreItemId2 extends keyof AllState[T_StoreName2] & string,
  T_PropertyName2 extends keyof AllState[T_StoreName2][T_StoreItemId2] & string,
  T_UsefulParams extends Record<any, any>
>(
  storeInfo1: [T_StoreName1, T_StoreItemId1, T_PropertyName1],
  storeInfo2: [T_StoreName2, T_StoreItemId2, T_PropertyName2],
  stepName?: StepName,
  getUsefulParams?: () => T_UsefulParams
) {
  const [storeName1, storeItemId1, storyProperty1] = storeInfo1;
  const [storeName2, storeItemId2, storyProperty2] = storeInfo2;

  type StoreState1 = AllState[T_StoreName1][T_StoreItemId1];
  type StoreState2 = AllState[T_StoreName2][T_StoreItemId2];

  type PropertyValue1 = StoreState1[T_PropertyName1];
  type PropertyValue2 = StoreState2[T_PropertyName2];
  type RulesOptions = Partial<
    Record<PropertyValue1, Partial<Record<PropertyValue2, (usefulStuff: T_UsefulParams) => void>>>
  >;
  const mainEffectId = toSafeEffectId(
    `customLeaveEffectFor_${storeName1}_${storyProperty1}_${storeName2}_${storyProperty2}`
  );
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeEffects((makeEffect) => ({
      whenPropertyChanges: makeEffect(
        (_, diffInfo) => {
          const usefulParams = getUsefulParams?.();
          const latestValue1 = getState(storeName1, storeItemId1)?.[storyProperty1] as PropertyValue1;
          const latestValue2 = getState(storeName2, storeItemId2)?.[storyProperty2] as PropertyValue2;
          const prevValue1 = getPrevState(storeName1, storeItemId1)[storyProperty1] as PropertyValue1;
          const prevValue2 = getPrevState(storeName2, storeItemId2)[storyProperty2] as PropertyValue2;

          // Make sure value1 changed for itemType1 etc, since it listens for both itemIIds for both stores (might not be neccesary)
          const didValue1Change = diffInfo.propsChangedBool[storeName1][storeItemId1][storyProperty1];
          const didValue2Change = diffInfo.propsChangedBool[storeName2][storeItemId2][storyProperty2];
          if (didValue1Change || didValue2Change) return;

          const callback = callBacksObject[prevValue1]?.[prevValue2];
          if (callback) callback(usefulParams!);
        },
        {
          changes: [`${storeName1}.${storyProperty1}`, `${storeName2}.${storyProperty2}`],
          itemIds: [storeItemId1, storeItemId2],
          step: stepName ?? "default",
          atStepEnd: true,
          id: mainEffectId,
          isPerItem: false,
        }
      ),
    }));
  }

  return newRuleMaker;
}
