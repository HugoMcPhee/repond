import { forEach } from "chootils/dist/loops";
import meta from "../meta";
import { AllState, EasyEffect, EasyEffect_Check, Effect, ItemEffect, ItemType, PropName, StepName } from "../types";
import { getPrevState, getState } from "../usable/getSet";
import {
  MakeEffect,
  MakeItemEffect,
  _startEffect,
  easyEffectToEffect,
  itemEffectToEffect,
  makeEffect,
  makeItemEffect,
  stopNewEffect,
  toSafeEffectId,
} from "./effects";

export type MakeDynamicEffect = <K_Type extends ItemType, T_Params extends any>(
  itemEffectGetter: (params: T_Params) => EasyEffect<K_Type>
) => (params: T_Params) => Effect;

export type MakeDynamicItemEffect = <
  K_Type extends ItemType,
  K_PropName extends PropName<K_Type>,
  T_Options extends any
>(
  itemEffectGetter: (params: T_Options) => ItemEffect<K_Type, K_PropName>
) => (params: T_Options) => Effect;

/** @deprecated Please use makeEffects instead*/
export function makeRules<K_EffectName extends string, K_EffectGroupName extends string>(
  getEffectsToAdd: (arg0: {
    itemEffect: MakeItemEffect;
    effect: MakeEffect;
  }) => // ) => Record<K_RuleName, MakeRule_Rule >
  Record<K_EffectName, Effect>,
  rulesName?: K_EffectGroupName // TODO register rules to an object in meta
) {
  const effectsToAdd = getEffectsToAdd({ itemEffect: makeItemEffect, effect: makeEffect });
  const effectNames: K_EffectName[] = Object.keys(effectsToAdd) as any[];
  const effectIdPrefix = rulesName ? `${rulesName}_` : toSafeEffectId("makeRules");

  // edit the ids for each rule
  forEach(effectNames, (effectName) => (effectsToAdd[effectName].id = effectIdPrefix + effectName));

  const start = (effectName: K_EffectName) => _startEffect(effectsToAdd[effectName]);
  const stop = (effectName: K_EffectName) => stopNewEffect(effectIdPrefix + effectName);
  // NOTE wont wait for the effects step
  const run = (effectName: K_EffectName) => effectsToAdd[effectName].run(meta.diffInfo, 16.66666, true); // true = ranWithoutChange
  const runAll = () => forEach(effectNames, (effectName) => run(effectName));
  const startAll = () => forEach(effectNames, (effectName) => start(effectName));
  const stopAll = () => forEach(effectNames, (effectName) => stop(effectName));
  return { start, stop, startAll, stopAll, effectNames, run, runAll };
}

// -----------------
// Make and remake rules with params

function makeDynamicEffect<K_Type extends ItemType, T_Params extends any>(
  easyEffectGetter: (params: T_Params) => EasyEffect<K_Type>
) {
  return (params: T_Params) => easyEffectToEffect({ ...easyEffectGetter(params) });
}
function makeDynamicItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>, T_Params extends any>(
  itemEffectGetter: (params: T_Params) => ItemEffect<K_Type, K_PropName>
) {
  return (params: T_Params) => itemEffectToEffect(itemEffectGetter(params));
}

/** @deprecated This may change to a way to define paramed effects*/
export function makeDynamicRules<
  K_EffectName extends string,
  T_MakeRule_Function extends (...args: any) => Effect,
  T_EffectGettersToAdd extends Record<K_EffectName, T_MakeRule_Function>
>(getEffectGetters: (arg0: { itemEffect: MakeDynamicItemEffect; effect: MakeDynamicEffect }) => T_EffectGettersToAdd) {
  const allEffectGetters = getEffectGetters({
    itemEffect: makeDynamicItemEffect,
    effect: makeDynamicEffect,
  });

  const effectNames = Object.keys(allEffectGetters!) as K_EffectName[];
  const effectIdPrefix = toSafeEffectId("makeDynamicRules");

  function ruleNamePostfixFromParams(params: any) {
    return JSON.stringify(params);
  }

  function getEffectId(effectName: string, params: any) {
    return `${effectIdPrefix}${effectName}${ruleNamePostfixFromParams(params)}`;
  }

  function start<K_ChosenRuleName extends keyof T_EffectGettersToAdd & K_EffectName>(
    ruleName: K_ChosenRuleName,
    params: Parameters<T_EffectGettersToAdd[K_ChosenRuleName]>[0]
  ) {
    const effectGetter = allEffectGetters[ruleName];
    if (effectGetter && typeof effectGetter === "function") {
      const effect = effectGetter(params);
      if (!effect.id) effect.id = getEffectId(ruleName, params);
      _startEffect(effect);
    }
  }

  function stop<K_ChosenRuleName extends K_EffectName>(
    ruleName: K_ChosenRuleName,
    params: Parameters<T_EffectGettersToAdd[K_ChosenRuleName]>[0]
  ) {
    const effectGetter = allEffectGetters[ruleName];
    if (effectGetter && typeof effectGetter === "function") {
      const foundOrMadeRuleName = effectGetter(params)?.id || getEffectId(ruleName, params);
      stopNewEffect(foundOrMadeRuleName);
    } else {
      console.log("no rule set for ", ruleName);
    }
  }

  // NOTE Experimental, if all the rules have the same params
  function startAll(params: Parameters<T_EffectGettersToAdd[K_EffectName]>[0]) {
    forEach(effectNames, (ruleName: K_EffectName) => start(ruleName, params));
  }

  function stopAll(params: Parameters<T_EffectGettersToAdd[K_EffectName]>[0]) {
    forEach(effectNames, (ruleName: K_EffectName) => stop(ruleName, params));
  }

  return { start, stop, effectNames, startAll, stopAll };
}

// ---------------------------------------------------
// Make Rule Makers
// ---------------------------------------------------

export function makeRuleMaker<
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
  const effectId = toSafeEffectId(`customEffectFor_${storeName}_${storyProperty}`);
  function newRuleMaker(callbacksMap: CallbacksMap) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulParams = getUsefulParams?.();
          const latestValue = getState()[storeName][storeItemId][storyProperty] as PropertyValue;

          callbacksMap[latestValue]?.(usefulParams!);
        },
        check: { prop: [storyProperty], id: storeItemId, type: storeName } as unknown as EasyEffect_Check<T_StoreName>,
        step: stepName ?? "default",
        atStepEnd: true,
        id: effectId,
      }),
    }));
  }

  return newRuleMaker;
}

export function makeLeaveRuleMaker<
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
  const ruleName = `customRuleFor_${storeName}_${storyProperty}${Math.random()}`;
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulStoryStuff = getUsefulParams?.();
          const prevValue = (getPrevState() as AllState)[storeName][storeItemId][storyProperty] as PropertyValue;

          callBacksObject[prevValue]?.(usefulStoryStuff!);
        },
        check: { prop: [storyProperty], id: storeItemId, type: storeName } as unknown as EasyEffect_Check<T_StoreName>,
        step: stepName ?? "default",
        atStepEnd: true,
        id: ruleName,
      }),
    }));
  }

  return newRuleMaker;
}

// makeNestedRuleMaker, similar to makeRuleMaker but accepts parameters for two store properties (can be from different stores) , and the callback fires when properties of both stores change
export function makeNestedRuleMaker<
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
  const ruleName = toSafeEffectId(`customRuleFor_${storeName1}_${storyProp1}_${storeName2}_${storyProp2}`);
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulStoryStuff = getUsefulParams?.();
          const latestValue1 = (getState() as AllState)[storeName1][storeItemId1][storyProp1] as PropValue1;
          const latestValue2 = (getState() as AllState)[storeName2][storeItemId2][storyProp2] as PropValue2;

          callBacksObject[latestValue1]?.[latestValue2]?.(usefulStoryStuff!);
        },
        check: [
          { prop: [storyProp1], id: storeItemId1, type: storeName1 },
          { prop: [storyProp2], id: storeItemId2, type: storeName2 },
        ] as unknown as EasyEffect_Check<T_StoreName1 | T_StoreName2>,
        step: stepName ?? "default",
        atStepEnd: true,
        id: ruleName,
      }),
    }));
  }

  return newRuleMaker;
}

// makeNestedLeaveRuleMaker, the same as makeNestedRuleMaker , but the callback fires when the properties of both stores become NOT the specified values, but were previously
export function makeNestedLeaveRuleMaker<
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
  const ruleName = toSafeEffectId(`customLeaveRuleFor_${storeName1}_${storyProperty1}_${storeName2}_${storyProperty2}`);
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulParams = getUsefulParams?.();
          const latestValue1 = getState()[storeName1][storeItemId1][storyProperty1] as PropertyValue1;
          const latestValue2 = getState()[storeName2][storeItemId2][storyProperty2] as PropertyValue2;
          const prevValue1 = getPrevState()[storeName1][storeItemId1][storyProperty1] as PropertyValue1;
          const prevValue2 = getPrevState()[storeName2][storeItemId2][storyProperty2] as PropertyValue2;

          const callback = callBacksObject[prevValue1]?.[prevValue2];
          if (callback) callback(usefulParams!);
        },
        check: [
          { prop: [storyProperty1], id: storeItemId1, type: storeName1 },
          { prop: [storyProperty2], id: storeItemId2, type: storeName2 },
        ] as unknown as EasyEffect_Check<T_StoreName1 | T_StoreName2>,
        step: stepName ?? "default",
        atStepEnd: true,
        id: ruleName,
      }),
    }));
  }

  return newRuleMaker;
}
