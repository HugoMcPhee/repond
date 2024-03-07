import { removeItemFromArrayInPlace } from "chootils/dist/arrays";
import { breakableForEach, forEach } from "chootils/dist/loops";
import { default as meta, default as repondMeta } from "../meta";
import { runWhenDoingEffectsRunAtStart, runWhenStartingEffects, runWhenStoppingEffects } from "../settingInternal";
import {
  AllState,
  DiffInfo,
  EasyEffect,
  EasyEffect_Check,
  Effect,
  EffectPhase,
  ItemEffect,
  ItemType,
  MakeEffects_Effect,
  PropName,
  RefinedGroupedEffects,
  UntypedEffect,
} from "../types";
import { getPrevState, getRefs, getState } from "../usable/getSet";
import { toArray, toMaybeArray } from "../utils";

// --------------------------------------------------------------------
// Effects
// --------------------------------------------------------------------
// type MakeRule_Rule = FlexibleRuleOptions<
//   T_ItemType,
//   PropertyName<T_ItemType>
// >;

// NOTE could make options generic and return that
// type MakeEffect = <K_Type extends T_ItemType>(options: Effect_RuleOptions<K_Type>) => Effect_RuleOptions<K_Type>;
export type MakeEffect = <K_Type extends ItemType>(
  options: EasyEffect<K_Type>
  // ) => Effect_RuleOptions<K_Type, T_ItemType, T_State, T_StepName>;
) => any;

// type MakeItemEffect = <K_Type extends T_ItemType, K_PropName extends G_PropertyName[K_Type]>(options: ItemEffect_RuleOptions<K_Type, K_PropName>) => ItemEffect_RuleOptions<K_Type, K_PropName>;
export type MakeItemEffect = <K_Type extends ItemType, K_PropName extends PropName<K_Type>>(
  options: ItemEffect<K_Type, K_PropName>
  // ) => ItemEffect_RuleOptions<
  //   K_Type,
  //   K_PropName,
  //   T_ItemType,
  //   T_State,
  //   T_Refs,
  //   T_StepName
  // >;
) => any;

export type MakeDynamicEffectInlineFunction = <K_Type extends ItemType, T_Options extends any>(
  theRule: (options: T_Options) => EasyEffect<K_Type>
) => (
  options: T_Options
  // ) => Effect_RuleOptions<K_Type, T_ItemType, T_State, T_StepName>;
) => any;

export type MakeDynamicItemEffectInlineFunction = <
  K_Type extends ItemType,
  K_PropName extends PropName<K_Type>,
  T_Options extends any
>(
  theRule: (options: T_Options) => ItemEffect<K_Type, K_PropName>
) => (
  options: T_Options
  // ) => ItemEffect_RuleOptions<
  //   K_Type,
  //   K_PropName,
  //   T_ItemType,
  //   T_State,
  //   T_Refs,
  //   T_StepName
  // >;
) => any;

export function makeEffect<K_Type extends ItemType>(easyEffect: EasyEffect<K_Type>): EasyEffect<K_Type> {
  return easyEffectToEffect(easyEffect);
}

export function makeItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(
  itemEffect: ItemEffect<K_Type, K_PropName>
) {
  return easyEffectToEffect(itemEffectToEasyEffect(itemEffect));
}
//
// // NOTE could make options generic and return that
// // type MakeEffect = <K_Type extends T_ItemType>(options: Effect_RuleOptions<K_Type>) => Effect_RuleOptions<K_Type>;
// type MakeEffect = <K_Type extends T_ItemType>(
//   options: Effect_RuleOptions<K_Type>
// ) => Effect_RuleOptions<K_Type>;
//
// // type MakeItemEffect = <K_Type extends T_ItemType, K_PropName extends G_PropertyName[K_Type]>(options: ItemEffect_RuleOptions<K_Type, K_PropName>) => ItemEffect_RuleOptions<K_Type, K_PropName>;
// type MakeItemEffect = <
//   K_Type extends T_ItemType,
//   K_PropName extends PropertyName<K_Type>
// >(
//   options: ItemEffect_RuleOptions<K_Type, K_PropName>
// ) => ItemEffect_RuleOptions<K_Type, K_PropName>;

// type MakeRule_Utils = {
//   itemEffect: MakeItemEffect;
//   effect: MakeEffect;
// };

// TODO
// -------------------------------------------------------
// utils
// -------------------------------------------------------

// Convert an itemEffect callback to a regular effect callback
function itemEffectRunToEffectRun<K_Type extends ItemType, K_PropName extends PropName<K_Type>>({
  check,
  run,
}: ItemEffect<K_Type, K_PropName>) {
  let allowedIdsMap: { [itemId: string]: boolean } | undefined = undefined;
  const props = toArray(check.prop);
  const type = check.type;
  const ids = toMaybeArray(check.id);
  const becomes = check.becomes;

  if (ids) {
    allowedIdsMap = {};
    forEach(ids, (loopedItemId) => {
      if (allowedIdsMap) allowedIdsMap[loopedItemId as string] = true;
    });
  }

  return (diffInfo: DiffInfo, frameDuration: number, skipChangeCheck?: boolean) => {
    // if skipChangeCheck is true, it will run the run function regardless of the changes
    if (skipChangeCheck) {
      if (ids) {
        const prevItemsState = getPrevState()[type] as any;
        const itemsState = (getState() as AllState)[type];
        const itemsRefs = getRefs()[type];

        forEach(ids, (itemId) => {
          breakableForEach(props, (propName) => {
            const newValue = itemsState[itemId][propName];

            run({
              itemId: itemId,
              newValue,
              prevValue: prevItemsState[itemId][propName],
              itemState: itemsState[itemId],
              itemRefs: itemsRefs[itemId],
              frameDuration,
              ranWithoutChange: true,
            });
            return true; // break out of the loop, so it only runs once
          });
        });
      }
      return true; // return early if skipChangeCheck was true
    }

    const prevItemsState = getPrevState()[type] as any;
    const itemsState = (getState() as AllState)[type];
    const itemsRefs = getRefs()[type];
    forEach(diffInfo.itemsChanged[type], (itemIdThatChanged) => {
      if (!(!allowedIdsMap || (allowedIdsMap && allowedIdsMap[itemIdThatChanged as string]))) return;

      breakableForEach(props, (propName) => {
        if (!(diffInfo.propsChangedBool as any)[type][itemIdThatChanged][propName]) return;

        const newValue = itemsState[itemIdThatChanged][propName];

        let canRunRun = false;

        if (becomes === undefined) canRunRun = true;
        else if (typeof becomes === "function") {
          canRunRun = becomes(newValue, prevItemsState[itemIdThatChanged][propName]);
        } else if (becomes === newValue) canRunRun = true;

        if (!canRunRun) return;

        run({
          itemId: itemIdThatChanged as any,
          newValue,
          prevValue: prevItemsState[itemIdThatChanged][propName],
          itemState: itemsState[itemIdThatChanged],
          itemRefs: itemsRefs[itemIdThatChanged],
          frameDuration,
          ranWithoutChange: false,
        });
        return true; // break out of the loop, so it only runs once
      });
    });
  };
}

// converts an easy effect check to a effect check (an array of checks)
function easyEffectCheckToEffectCheck<K_Type extends ItemType>(effectCheck: EasyEffect_Check<K_Type>) {
  const checksArray = toArray(effectCheck);

  return checksArray.map((check) => ({
    types: toMaybeArray(check.type),
    names: toMaybeArray(check.id),
    props: toMaybeArray(check.prop),
    addedOrRemoved: check.addedOrRemoved,
  }));
}

// converts an easy effect to an effect
function easyEffectToEffect<T_EasyEffect extends EasyEffect<any>>(easyEffect: T_EasyEffect): Effect<ItemType> {
  return {
    id: easyEffect.id ?? toSafeEffectId("effect"),
    check: easyEffectCheckToEffectCheck(easyEffect.check),
    atStepEnd: !!easyEffect.atStepEnd,
    run: easyEffect.run,
    step: easyEffect.step,
  };
}

// --------------------------------------------------------------------
// more utils
// --------------------------------------------------------------------

function _startEffect<K_Type extends ItemType>(newEffect: Effect<K_Type>) {
  const phase: EffectPhase = !!newEffect.atStepEnd ? "endOfStep" : "duringStep";
  const step = newEffect.step ?? "default";

  runWhenStartingEffects(() => {
    meta.allEffects[newEffect.id] = newEffect as unknown as UntypedEffect;
    if (!meta.effectIdsByPhaseByStep[phase][step]) {
      // add the effect to a new array
      meta.effectIdsByPhaseByStep[phase][step] = [newEffect.id];
    } else {
      if (!meta.effectIdsByPhaseByStep[phase][step]?.includes(newEffect.id)) {
        // add the effect to the array if it's not already there
        meta.effectIdsByPhaseByStep[phase][step].push(newEffect.id);
      }
    }
  });
}

function _stopEffect(effectName: string) {
  runWhenStoppingEffects(() => {
    const effect = meta.allEffects[effectName];
    if (!effect) return;
    const phase: EffectPhase = !!effect.atStepEnd ? "endOfStep" : "duringStep";
    const step = effect.step ?? "default";

    removeItemFromArrayInPlace(meta.effectIdsByPhaseByStep[phase][step] ?? [], effect.id);

    delete meta.allEffects[effectName];
  });
}

// --------------------------------------------------------------------
// other functions
// --------------------------------------------------------------------

export function startNewEffect<K_Type extends ItemType>(theEffect: EasyEffect<K_Type>) {
  let effectId = theEffect.id || toSafeEffectId("effect");

  // add the required effectId
  const editedEffect = { ...theEffect, id: effectId };

  if (theEffect.runAtStart) {
    runWhenDoingEffectsRunAtStart(() => theEffect.run(meta.diffInfo as any, 16.66666, true /* ranWithoutChange */));
  }

  _startEffect(easyEffectToEffect(editedEffect) as any);
}

export function itemEffectToEasyEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(
  itemEffect: ItemEffect<K_Type, K_PropName>
): EasyEffect<K_Type> {
  let effectName = itemEffect.id || "unnamedItemEffect" + Math.random();

  return easyEffectToEffect({
    ...itemEffect,
    id: effectName,
    check: { ...itemEffect.check, becomes: undefined, prop: toMaybeArray(itemEffect.check.prop) },
    run: itemEffectRunToEffectRun(itemEffect),
  });
}

export function startNewItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(
  itemEffect: ItemEffect<K_Type, K_PropName>
) {
  const effect = itemEffectToEasyEffect(itemEffect);
  startNewEffect(effect);
  return effect.id;
}

export function stopNewEffect(effectName: string) {
  _stopEffect(effectName);
}

// ---------------------------------------------------
// Make Effects
// ---------------------------------------------------

// This is really startGroupedEffect
export function startEffect<
  K_EffectGroup extends keyof RefinedGroupedEffects,
  K_EffectName extends keyof RefinedGroupedEffects[K_EffectGroup] & string
>(groupName: K_EffectGroup, effectName: K_EffectName) {
  const theEffect = (meta.allGroupedEffects as any)[groupName][effectName] as Effect<ItemType>;
  if (!theEffect) return console.warn("no effect found for ", groupName, effectName);
  startNewEffect(theEffect);
}

export function stopEffect<
  K_EffectGroup extends keyof RefinedGroupedEffects,
  K_EffectName extends keyof RefinedGroupedEffects[K_EffectGroup] & string
>(groupName: K_EffectGroup, effectName: K_EffectName) {
  const theEffect = (meta.allGroupedEffects as any)[groupName][effectName] as Effect<ItemType>;
  if (!theEffect) return console.warn("no effect found for ", groupName, effectName);
  stopNewEffect(theEffect.id);
}

export function startGroupEffects<K_EffectGroup extends keyof RefinedGroupedEffects>(groupName: K_EffectGroup) {
  const theGroup = (meta.allGroupedEffects as any)[groupName];
  forEach(Object.keys(theGroup), (effectName) => startEffect(groupName, effectName));
}

export function stopGroupEffects<K_EffectGroup extends keyof RefinedGroupedEffects>(groupName: K_EffectGroup) {
  const theGroup = (meta.allGroupedEffects as any)[groupName];
  forEach(Object.keys(theGroup), (effectName) => stopEffect(groupName, effectName));
}

export function startAllGroupedEffects() {
  forEach(Object.keys(meta.allGroupedEffects), (groupName) => startGroupEffects(groupName));
}

export function stopAllGroupedEffects() {
  forEach(Object.keys(meta.allGroupedEffects), (groupName) => stopGroupEffects(groupName));
}

export function runEffect<
  K_EffectGroup extends keyof RefinedGroupedEffects,
  K_EffectName extends keyof RefinedGroupedEffects[K_EffectGroup] & string
>(groupName: K_EffectGroup, effectName: K_EffectName) {
  const theEffect = (meta.allGroupedEffects as any)[groupName][effectName];
  if (!theEffect) return console.warn("no effect found for ", groupName, effectName);
  theEffect.run(meta.diffInfo as any, 16.66666, true /* ranWithoutChange */);
}

export function runGroupEffects<K_EffectGroup extends keyof RefinedGroupedEffects>(groupName: K_EffectGroup) {
  const theGroup = (meta.allGroupedEffects as any)[groupName];
  forEach(Object.keys(theGroup), (effectName) => runEffect(groupName, effectName));
}

export function makeEffects<K_EffectName extends string>(
  effectsToAdd: (makers: { itemEffect: MakeItemEffect; effect: MakeEffect }) => Record<K_EffectName, MakeEffects_Effect>
) {
  return effectsToAdd({ itemEffect: makeItemEffect, effect: makeEffect });
}

export function initGroupedEffects<T extends Record<string, ReturnType<typeof makeEffects>>>(groups: T): T {
  const transformedGroups: Record<string, ReturnType<typeof makeEffects>> = {};

  Object.entries(groups).forEach(([key, value]) => {
    // Remove "Effects" from the key, if present
    const newKey = key.replace("Effects", "");
    transformedGroups[newKey] = value;
  });

  const groupNames = Object.keys(transformedGroups);

  // loop through the groups and rename the effects
  forEach(groupNames, (groupName) => {
    const theGroup = transformedGroups[groupName];
    const effectNames = Object.keys(theGroup);
    forEach(effectNames, (effectName) => {
      const theEffect = theGroup[effectName];
      theEffect.id = `${groupName}_${effectName}`;
    });
  });

  // Store the transformed groups
  meta.allGroupedEffects = transformedGroups as any;

  return groups;
}

export function toSafeEffectId(prefix?: string): string {
  const counterNumber = repondMeta.autoEffectIdCounter;
  repondMeta.autoEffectIdCounter += 1;
  return (prefix || "autoEffect") + "_" + counterNumber;
}
