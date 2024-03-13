import { forEach } from "chootils/dist/loops";
import { easyEffectToEffect, itemEffectToEffect } from "../helpers/effects/converters";
import { _startEffect, _stopEffect } from "../helpers/effects/internal";
import { default as meta } from "../meta";
import { EasyEffect, Effect, ItemEffect, ItemType, PropName } from "../types";
import { RepondTypes } from "../declarations";

// Helper type to strip "Effects" suffix from group names
type RemoveEffectsSuffix<T extends string> = T extends `${infer Prefix}Effects` ? Prefix : T;
export type RefinedEffectGroups = {
  [K in keyof RepondTypes["EffectGroups"] as RemoveEffectsSuffix<K>]: RepondTypes["EffectGroups"][K];
};

export function startNewEffect<K_Type extends ItemType>(theEffect: EasyEffect<K_Type>) {
  _startEffect(easyEffectToEffect(theEffect));
}

export function startNewItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(
  itemEffect: ItemEffect<K_Type, K_PropName>
) {
  const effect = itemEffectToEffect(itemEffect);

  _startEffect(effect);
  return effect.id;
}

export function stopNewEffect(effectName: string) {
  _stopEffect(effectName);
}

// This is really startGroupedEffect
export function startEffect<
  K_EffectGroup extends keyof RefinedEffectGroups,
  K_EffectName extends keyof RefinedEffectGroups[K_EffectGroup] & string
>(groupName: K_EffectGroup, effectName: K_EffectName) {
  const theEffect = (meta.allEffectGroups as any)[groupName][effectName];
  if (!theEffect) return console.warn("no effect found for ", groupName, effectName);
  _startEffect(theEffect);
}

export function stopEffect<
  K_EffectGroup extends keyof RefinedEffectGroups,
  K_EffectName extends keyof RefinedEffectGroups[K_EffectGroup] & string
>(groupName: K_EffectGroup, effectName: K_EffectName) {
  const theEffect = (meta.allEffectGroups as any)[groupName][effectName];
  if (!theEffect) return console.warn("no effect found for ", groupName, effectName);
  _stopEffect(theEffect.id);
}

export function startEffectsGroup<K_EffectGroup extends keyof RefinedEffectGroups>(groupName: K_EffectGroup) {
  const theGroup = (meta.allEffectGroups as any)[groupName];
  forEach(Object.keys(theGroup), (effectName) => startEffect(groupName, effectName));
}

export function stopEffectsGroup<K_EffectGroup extends keyof RefinedEffectGroups>(groupName: K_EffectGroup) {
  const theGroup = (meta.allEffectGroups as any)[groupName];
  forEach(Object.keys(theGroup), (effectName) => stopEffect(groupName, effectName));
}

export function startAllEffectsGroups() {
  forEach(Object.keys(meta.allEffectGroups), (groupName) => startEffectsGroup(groupName));
}

export function stopAllEffectsGroups() {
  forEach(Object.keys(meta.allEffectGroups), (groupName) => stopEffectsGroup(groupName));
}

export function runEffect<
  K_EffectGroup extends keyof RefinedEffectGroups,
  K_EffectName extends keyof RefinedEffectGroups[K_EffectGroup] & string
>(groupName: K_EffectGroup, effectName: K_EffectName) {
  const theEffect = (meta.allEffectGroups as any)[groupName][effectName];
  if (!theEffect) return console.warn("no effect found for ", groupName, effectName);
  theEffect.run(meta.diffInfo as any, 16.66666, true /* ranWithoutChange */);
}

export function runEffectsGroup<K_EffectGroup extends keyof RefinedEffectGroups>(groupName: K_EffectGroup) {
  const theGroup = (meta.allEffectGroups as any)[groupName];
  forEach(Object.keys(theGroup), (effectName) => runEffect(groupName, effectName));
}

export type MakeEffect = <K_Type extends ItemType>(easyEffect: EasyEffect<K_Type>) => Effect;
export type MakeItemEffect = <K_Type extends ItemType, K_PropName extends PropName<K_Type>>(
  itemEffect: ItemEffect<K_Type, K_PropName>
) => Effect;

export function makeEffect<K_Type extends ItemType>(easyEffect: EasyEffect<K_Type>): Effect {
  return easyEffectToEffect(easyEffect);
}

export function makeItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(
  itemEffect: ItemEffect<K_Type, K_PropName>
): Effect {
  return itemEffectToEffect(itemEffect);
}

export function makeEffects<K_EffectName extends string>(
  effectsToAdd: (arg0: { itemEffect: MakeItemEffect; effect: MakeEffect }) => Record<K_EffectName, Effect>
) {
  return effectsToAdd({ itemEffect: makeItemEffect, effect: makeEffect });
}

export function initEffectGroups<T extends Record<string, ReturnType<typeof makeEffects>>>(groups: T): T {
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
  meta.allEffectGroups = transformedGroups as any;

  return groups;
}
