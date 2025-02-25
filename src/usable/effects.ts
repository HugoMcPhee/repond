import { forEach } from "chootils/dist/loops";
import { RepondTypes } from "../declarations";
import { _addEffect, _stopEffect, runEffectWithoutChange, storeCachedValuesForEffect } from "../helpers/effects";
import { repondMeta as meta } from "../meta";
import { EffectDef, ItemType, PropName } from "../types";

// Helper type to strip "Effects" suffix from group names
type RemoveEffectsSuffix<T extends string> = (T extends `${infer Prefix}Effects` ? Prefix : T) & string;
export type RefinedEffectGroups = {
  [K in keyof RepondTypes["EffectGroups"] as RemoveEffectsSuffix<K>]: RepondTypes["EffectGroups"][K];
};

export function startNewEffect(theEffect: EffectDef) {
  return _addEffect(theEffect);
}

// This is really startGroupedEffect
export function startEffect<
  K_EffectGroup extends keyof RefinedEffectGroups,
  K_EffectName extends keyof RefinedEffectGroups[K_EffectGroup] & string
>(effectId: `${K_EffectGroup}.${K_EffectName}` | string) {
  const theEffect = meta.storedEffectsMap[effectId];
  if (!theEffect) return console.warn("no effect found for ", effectId);
  _addEffect(theEffect);
}

export function stopEffect<
  K_EffectGroup extends keyof RefinedEffectGroups,
  K_EffectName extends keyof RefinedEffectGroups[K_EffectGroup] & string
>(effectId: `${K_EffectGroup}.${K_EffectName}` | string) {
  const theEffect = (meta.liveEffectsMap as any)[effectId];
  //  NOTE Not logging if it tried to stop a missing event, because react useEffect does a quick start stop at the start
  // if (!theEffect) return console.warn("(stop) no effect found for ", effectId);
  if (!theEffect) return;
  _stopEffect(theEffect.id);
}

export function startEffectsGroup<K_EffectGroup extends keyof RefinedEffectGroups>(groupName: K_EffectGroup & string) {
  forEach(meta.effectIdsByGroup[groupName], (effectId) => startEffect(effectId));
}

export function stopEffectsGroup<K_EffectGroup extends keyof RefinedEffectGroups>(groupName: K_EffectGroup & string) {
  forEach(meta.effectIdsByGroup[groupName], (effectId) => stopEffect(effectId));
}

export function startAllEffectsGroups() {
  forEach(Object.keys(meta.effectIdsByGroup), (groupName) => startEffectsGroup(groupName));
}

export function stopAllEffectsGroups() {
  forEach(Object.keys(meta.effectIdsByGroup), (groupName) => stopEffectsGroup(groupName));
}

export function runEffect<
  K_EffectGroup extends keyof RefinedEffectGroups,
  K_EffectName extends keyof RefinedEffectGroups[K_EffectGroup] & string
>(effectId: `${K_EffectGroup}.${K_EffectName}` | string) {
  const theEffect = meta.liveEffectsMap[effectId];
  if (!theEffect) return console.warn("(run) no effect found for ", effectId);

  runEffectWithoutChange(theEffect);
}

export function runEffectsGroup<K_EffectGroup extends keyof RefinedEffectGroups>(groupName: K_EffectGroup & string) {
  forEach(meta.effectIdsByGroup[groupName], (effectId) => runEffect(effectId));
}

export type MakeEffect = <K_Type extends ItemType>(
  effectRun: EffectDef["run"],
  effectOptions: Omit<EffectDef, "run">
) => EffectDef;

export function makeEffect<K_Type extends ItemType>(
  effectRun: EffectDef["run"],
  effectOptions: Omit<EffectDef, "run">
): EffectDef {
  (effectOptions as EffectDef).run = effectRun;
  return effectOptions as EffectDef;
}

export function makeEffects<K_EffectName extends string>(
  getEffectsToAddCallback: (makeEffect: MakeEffect) => Record<K_EffectName, EffectDef>
) {
  return getEffectsToAddCallback(makeEffect);
}

export function initEffectGroups<T extends Record<string, ReturnType<typeof makeEffects>>>(groups: T): T {
  const transformedGroups: Record<string, ReturnType<typeof makeEffects>> = {};

  Object.entries(groups).forEach(([key, value]) => {
    // Remove "Effects" from the end of the key, if present
    const newKey = key.replace(/Effects$/, "");
    transformedGroups[newKey] = value;
  });

  const groupNames = Object.keys(transformedGroups);

  // loop through the groups and rename the effects
  forEach(groupNames, (groupName) => {
    const theGroup = transformedGroups[groupName];
    const effectNames = Object.keys(theGroup);
    forEach(effectNames, (effectName) => {
      const theEffect = theGroup[effectName];
      theEffect.id = `${groupName}.${effectName}`;
      theEffect._groupName = groupName;
      theEffect._effectName = effectName;
      storeCachedValuesForEffect(theEffect);

      meta.storedEffectsMap[theEffect.id] = theEffect as any;
      meta.effectIdsByGroup[groupName] = meta.effectIdsByGroup[groupName] || [];
      meta.effectIdsByGroup[groupName].push(theEffect.id);
    });
  });

  // Only used for types
  return groups;
}
