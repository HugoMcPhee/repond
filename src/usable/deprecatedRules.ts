import { forEach } from "chootils/dist/loops";
import meta from "../meta";
import {
  AllState,
  EasyEffect_Check,
  EasyEffect,
  ItemEffect,
  ItemType,
  MakeEffects_Effect,
  PropName,
  StepName,
} from "../types";
import { getPrevState, getRefs, getState } from "../usable/getSet";
import { toMaybeArray } from "../utils";
import {
  MakeDynamicEffectInlineFunction,
  MakeDynamicItemEffectInlineFunction,
  MakeEffect,
  MakeItemEffect,
  makeEffect,
  makeItemEffect,
  startNewEffect,
  startNewItemEffect,
  stopNewEffect,
  toSafeEffectId,
} from "./effects";

/** @deprecated Please use makeEffects instead*/
export function makeRules<K_EffectName extends string, K_EffectGroupName extends string>(
  rulesToAdd: (arg0: { itemEffect: MakeItemEffect; effect: MakeEffect }) => // ) => Record<K_RuleName, MakeRule_Rule >
  Record<K_EffectName, MakeEffects_Effect>,
  rulesName?: K_EffectGroupName // TODO register rules to an object in meta
): {
  start: (ruleName: K_EffectName) => void;
  stop: (ruleName: K_EffectName) => void;
  startAll: () => void;
  stopAll: () => void;
  ruleNames: K_EffectName[];
  run: (ruleName: K_EffectName) => void;
  runAll: () => void;
} {
  // type RuleName = keyof ReturnType<typeof rulesToAdd>;
  const editedRulesToAdd = rulesToAdd({
    itemEffect: makeItemEffect as any,
    effect: makeEffect as any,
  });
  const ruleNames: K_EffectName[] = Object.keys(editedRulesToAdd) as any[];
  const ruleNamePrefix = rulesName ? `${rulesName}_` : toSafeEffectId("makeRules");

  // edit the names for each rule
  forEach(ruleNames, (ruleName) => {
    const loopedRule = editedRulesToAdd[ruleName as any];
    if (loopedRule) {
      loopedRule.name = ruleNamePrefix + ruleName;
    }
  });

  // maybe startRule so it can be {startRule} =

  function start(ruleName: K_EffectName) {
    const theRule = editedRulesToAdd[ruleName as any];
    if (!theRule) return;

    if (theRule._isPerItem) {
      startNewItemEffect(theRule as any);
    } else {
      startNewEffect(theRule as any);
    }
  }

  function stop(ruleName: K_EffectName) {
    if (editedRulesToAdd[ruleName as keyof typeof editedRulesToAdd]) {
      stopNewEffect(ruleNamePrefix + ruleName);
    }
  }

  // type EditedRulesToAdd = typeof editedRulesToAdd;
  // type EditedRulesToAdd222 = EditedRulesToAdd[K_RuleName]["check"];

  // run the rule directly
  function run(ruleName: K_EffectName) {
    // NOTE this doesn't wait for the step chosen for the rule!
    // maybe it should?

    const theRule = editedRulesToAdd[ruleName as any] as MakeEffects_Effect;
    if (!theRule) return;

    if (theRule._isPerItem) {
      // Run the item rule for each item (and prop)
      const itemType = theRule.check.type as ItemType;
      const itemIds = meta.itemIdsByItemType[itemType as string];
      const propNames = toMaybeArray(theRule.check.prop) ?? [];
      const itemsState = (getState() as AllState)[itemType];
      const prevItemsState = (getPrevState() as AllState)[itemType];
      const itemsRefs = (getRefs() as AllState)[itemType];
      forEach(itemIds, (itemId) => {
        forEach(propNames, (propName) => {
          const newValue = itemsState[itemId][propName];
          theRule.run({
            itemId: itemId as any,
            newValue,
            prevValue: prevItemsState[itemId][propName],
            itemState: itemsState[itemId],
            itemRefs: itemsRefs[itemId],
            frameDuration: 16.66666,
          });
        });
      });
    } else {
      // Run the rule once
      theRule.run(meta.diffInfo as any, 16.66666);
    }
  }

  function runAll() {
    forEach(ruleNames, (ruleName) => run(ruleName));
  }

  function startAll() {
    forEach(ruleNames, (ruleName) => start(ruleName));
  }

  function stopAll() {
    forEach(ruleNames, (ruleName) => stop(ruleName));
  }

  return {
    start,
    stop,
    startAll,
    stopAll,
    ruleNames: ruleNames as K_EffectName[],
    run,
    runAll,
  };
}

// -----------------
// make rules dynamic

function makeDynamicEffectInlineFunction<K_Type extends ItemType, T_Options extends any>(
  theRule: (options: T_Options) => EasyEffect<K_Type>
) {
  // return theRule;
  return (options: T_Options) => ({ ...theRule(options), _isPerItem: false });
}
function makeDynamicItemEffectInlineFunction<
  K_Type extends ItemType,
  K_PropName extends PropName<K_Type>,
  T_Options extends any
>(theRule: (options: T_Options) => ItemEffect<K_Type, K_PropName>) {
  // return theRule;
  return (options: T_Options) => ({ ...theRule(options), _isPerItem: true });
}
//
// type MakeDynamicEffectInlineFunction = <
//   K_Type extends T_ItemType,
//   T_Options extends any
// >(
//   theRule: (options: T_Options) => Effect_RuleOptions<K_Type>
// ) => (options: T_Options) => Effect_RuleOptions<K_Type>;
//
// type MakeDynamicItemEffectInlineFunction = <
//   K_Type extends T_ItemType,
//   K_PropName extends PropertyName<K_Type>,
//   T_Options extends any
// >(
//   theRule: (
//     options: T_Options
//   ) => ItemEffect_RuleOptions<K_Type, K_PropName>
// ) => (options: T_Options) => ItemEffect_RuleOptions<K_Type, K_PropName>;

export function makeDynamicRules<
  K_RuleName extends string,
  T_MakeRule_Function extends (...args: any) => MakeEffects_Effect,
  T_RulesToAdd = Record<K_RuleName, T_MakeRule_Function>
>(
  rulesToAdd: (arg0: {
    itemEffect: MakeDynamicItemEffectInlineFunction;
    effect: MakeDynamicEffectInlineFunction;
  }) => T_RulesToAdd
) {
  type RuleName = keyof ReturnType<typeof rulesToAdd>;
  const allRules = rulesToAdd({
    itemEffect: makeDynamicItemEffectInlineFunction,
    effect: makeDynamicEffectInlineFunction,
  });

  const ruleNames = Object.keys(allRules!) as RuleName[];

  const ruleNamePrefix = `${ruleNames.map((loopedName) => (loopedName as string).charAt(0)).join("")}`;
  // .join("")}${Math.random()}`;

  function ruleNamePostfixFromOptions(theOptions: any) {
    return JSON.stringify(theOptions);
  }

  function getWholeRuleName(ruleName: string, options: any) {
    return `${ruleNamePrefix}${ruleName}${ruleNamePostfixFromOptions(options)}`;
  }

  function start<K_ChosenRuleName extends keyof T_RulesToAdd & K_RuleName>(
    ruleName: K_ChosenRuleName,
    // @ts-ignore
    options: Parameters<T_RulesToAdd[K_ChosenRuleName]>[0]
  ) {
    const theRuleFunction = allRules[ruleName];
    if (theRuleFunction && typeof theRuleFunction === "function") {
      const editedRuleObject = theRuleFunction(options);
      if (!editedRuleObject.id) {
        editedRuleObject.id = getWholeRuleName(ruleName, options);
      }

      if (editedRuleObject._isPerItem !== undefined) {
        startNewItemEffect(editedRuleObject as any);
      } else {
        startNewEffect(editedRuleObject as any);
      }
    }
  }

  function stop<K_ChosenRuleName extends keyof T_RulesToAdd & K_RuleName>(
    ruleName: K_ChosenRuleName,
    // @ts-ignore
    options: Parameters<T_RulesToAdd[K_ChosenRuleName]>[0]
  ) {
    const theRuleFunction = allRules[ruleName];
    if (theRuleFunction && typeof theRuleFunction === "function") {
      const foundOrMadeRuleName = theRuleFunction(options)?.id || getWholeRuleName(ruleName, options);
      stopNewEffect(foundOrMadeRuleName);
    } else {
      console.log("no rule set for ", ruleName);
    }
  }

  // NOTE Experimental, if all the rules have the same options (BUT not typesafe at the moment)
  // ideally it can set startAll type as never if any of the options are different
  function startAll(
    // @ts-ignore
    options: Parameters<T_RulesToAdd[RuleName]>[0]
  ) {
    forEach(ruleNames, (ruleName: RuleName) => {
      // @ts-ignore
      start(ruleName, options);
    });
  }

  function stopAll(
    // @ts-ignore
    options: Parameters<T_RulesToAdd[RuleName]>[0]
  ) {
    forEach(ruleNames, (ruleName: RuleName) => {
      // @ts-ignore
      stop(ruleName, options);
    });
  }

  return {
    start,
    stop,
    ruleNames,
    startAll,
    stopAll,
  };
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
  type RulesOptions = Partial<Record<PropertyValue, (usefulStuff: T_UsefulParams) => void>>;
  const ruleName = `customRuleFor_${storeName}_${storyProperty}${Math.random()}`;
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulStoryStuff = getUsefulParams?.();
          const latestValue = (getState() as AllState)[storeName][storeItemId][storyProperty] as PropertyValue;

          callBacksObject[latestValue]?.(usefulStoryStuff!);
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
  T_PropertyName1 extends keyof AllState[T_StoreName1][T_StoreItemId1] & string,
  T_StoreName2 extends ItemType & string,
  T_StoreItemId2 extends keyof AllState[T_StoreName2] & string,
  T_PropertyName2 extends keyof AllState[T_StoreName2][T_StoreItemId2] & string,
  T_StepName extends StepName,
  T_UsefulParams extends Record<any, any>
>(
  storeInfo1: [T_StoreName1, T_StoreItemId1, T_PropertyName1],
  storeInfo2: [T_StoreName2, T_StoreItemId2, T_PropertyName2],
  stepName?: T_StepName,
  getUsefulParams?: () => T_UsefulParams
) {
  const [storeName1, storeItemId1, storyProperty1] = storeInfo1;
  const [storeName2, storeItemId2, storyProperty2] = storeInfo2;

  type StoreState1 = AllState[T_StoreName1][T_StoreItemId1];
  type StoreState2 = AllState[T_StoreName2][T_StoreItemId2];

  type PropertyValue1 = StoreState1[T_PropertyName1];
  type PropertyValue2 = StoreState2[T_PropertyName2];
  type RulesOptions = Partial<
    Record<
      PropertyValue1,
      Partial<Record<PropertyValue2, (usefulStuff: ReturnType<NonNullable<typeof getUsefulParams>>) => void>>
    >
  >;
  const ruleName = `customRuleFor_${storeName1}_${storyProperty1}_${storeName2}_${storyProperty2}${Math.random()}`;
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulStoryStuff = getUsefulParams?.();
          const latestValue1 = (getState() as AllState)[storeName1][storeItemId1][storyProperty1] as PropertyValue1;
          const latestValue2 = (getState() as AllState)[storeName2][storeItemId2][storyProperty2] as PropertyValue2;

          callBacksObject[latestValue1]?.[latestValue2]?.(usefulStoryStuff!);
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
  const ruleName = `customLeaveRuleFor_${storeName1}_${storyProperty1}_${storeName2}_${storyProperty2}${Math.random()}`;
  function newRuleMaker(callBacksObject: RulesOptions) {
    return makeRules(({ effect }) => ({
      whenPropertyChanges: effect({
        run(_diffInfo) {
          const usefulParams = getUsefulParams?.();
          const latestValue1 = (getState() as AllState)[storeName1][storeItemId1][storyProperty1] as PropertyValue1;
          const latestValue2 = (getState() as AllState)[storeName2][storeItemId2][storyProperty2] as PropertyValue2;
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
