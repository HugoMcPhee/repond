import { forEach } from "chootils/dist/loops";
import { RepondTypes } from "../declarations";
import { _addEffect, _stopEffect } from "../helpers/effects";
import { repondMeta as meta } from "../meta";
import { EffectDef } from "../types";
import { MakeEffect, makeEffect } from "./effects";

// Make effects based on params

export type ParamEffectsGroup<K_EffectName extends string, T_Params extends any> = {
  defaultParams: T_Params;
  makeEffects: (makeEffect: MakeEffect, params: T_Params) => Record<K_EffectName, EffectDef>;
};

export function makeParamEffects<
  K_EffectName extends string,
  T_ParamKey extends string,
  T_Params extends Record<T_ParamKey, any>
>(
  defaultParams: T_Params,
  effectsToAdd: (makeEffect: MakeEffect, params: T_Params) => Record<K_EffectName, EffectDef>
): ParamEffectsGroup<K_EffectName, T_Params> {
  return {
    defaultParams,
    makeEffects: effectsToAdd,
  };
}

export function initParamEffectGroups<T extends Record<string, ParamEffectsGroup<any, any>>>(groups: T): T {
  const transformedGroups: Record<string, ReturnType<typeof makeParamEffects>> = {};

  Object.entries(groups).forEach(([key, value]) => {
    // Remove "ParamEffects" from the end of the key, if present
    const newKey = key.replace(/ParamEffects$/, "");
    transformedGroups[newKey] = value;
  });

  // Store the transformed groups
  meta.allParamEffectGroups = transformedGroups as any;

  // storedParamEffectsMap

  return groups;
}

// Helper type to strip "Effects" suffix from group names
type RemoveParamEffectsSuffix<T extends string> = T extends `${infer Prefix}ParamEffects` ? Prefix : T;
export type RefinedParamEffectGroups = {
  [K in keyof RepondTypes["ParamEffectGroups"] as RemoveParamEffectsSuffix<K>]: RepondTypes["ParamEffectGroups"][K];
};

function sortAndStringifyObject(obj: Record<string, any>): string {
  const sortedKeys = Object.keys(obj).sort();
  const parts = sortedKeys.map((key) => `${key}_${JSON.stringify(obj[key])}`);
  return parts.join("_");
}

function getParamEffectId<
  K_GroupName extends keyof RefinedParamEffectGroups & string,
  K_EffectName extends keyof ReturnType<RefinedParamEffectGroups[K_GroupName]["makeEffects"]> & string
>(groupName: K_GroupName, effectName: K_EffectName, params: RefinedParamEffectGroups[K_GroupName]["defaultParams"]) {
  return `${groupName}.${effectName}.${sortAndStringifyObject(params)}`;
}

function getGroupPlusParamKey<K_GroupName extends keyof RefinedParamEffectGroups & string>(
  groupName: K_GroupName,
  params: RefinedParamEffectGroups[K_GroupName]["defaultParams"]
) {
  return `${groupName}.${sortAndStringifyObject(params)}`;
}

function findParamEffect<
  K_GroupName extends keyof RefinedParamEffectGroups & string,
  K_EffectName extends keyof ReturnType<RefinedParamEffectGroups[K_GroupName]["makeEffects"]> & string
>(groupName: K_GroupName, effectName: K_EffectName, params: RefinedParamEffectGroups[K_GroupName]["defaultParams"]) {
  const effectId = getParamEffectId(groupName, effectName, params);
  return meta.liveEffectsMap[effectId];
}

function makeAndStoreParamEffectsForGroup<
  K_GroupName extends keyof RefinedParamEffectGroups & string,
  T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]
>(groupName: K_GroupName, params: T_Params) {
  const madeParamEffects = meta.allParamEffectGroups?.[groupName]?.makeEffects(makeEffect, params);

  if (!madeParamEffects) return console.warn("no param effects stored for ", groupName), undefined; // returns undefined instead of void from console.warn

  const effectIds: string[] = [];
  // paramEffectIdsByGroupPlusParamKey

  // Rename the effects to include the group name and params
  const effectNames = Object.keys(madeParamEffects);
  forEach(effectNames, (effectName) => {
    const theEffect = madeParamEffects[effectName];
    theEffect.id = getParamEffectId(groupName, effectName, params);
    effectIds.push(theEffect.id);

    meta.liveEffectsMap[theEffect.id] = theEffect;
  });

  const groupPlusParamKey = getGroupPlusParamKey(groupName, params);
  meta.paramEffectIdsByGroupPlusParamKey[groupPlusParamKey] = effectIds;

  return effectIds;
}

function getEffectIdsForGroupPlusParam<K_GroupName extends keyof RefinedParamEffectGroups & string>(
  groupName: K_GroupName,
  params: RefinedParamEffectGroups[K_GroupName]["defaultParams"]
) {
  const groupPlusParamKey = getGroupPlusParamKey(groupName, params);
  return meta.paramEffectIdsByGroupPlusParamKey[groupPlusParamKey];
}

function deleteEffectIdsForGroupPlusParam<K_GroupName extends keyof RefinedParamEffectGroups & string>(
  groupName: K_GroupName,
  params: RefinedParamEffectGroups[K_GroupName]["defaultParams"]
) {
  const groupPlusParamKey = getGroupPlusParamKey(groupName, params);
  delete meta.paramEffectIdsByGroupPlusParamKey[groupPlusParamKey];
}

function getOrMakeEffectIdsForGroupPlusParam<K_GroupName extends keyof RefinedParamEffectGroups & string>(
  groupName: K_GroupName,
  params: RefinedParamEffectGroups[K_GroupName]["defaultParams"]
) {
  const effectIds = getEffectIdsForGroupPlusParam(groupName, params);
  if (effectIds) return effectIds;
  return makeAndStoreParamEffectsForGroup(groupName, params);
}

function findOrMakeParamEffect<
  K_GroupName extends keyof RefinedParamEffectGroups & string,
  K_EffectName extends keyof ReturnType<RefinedParamEffectGroups[K_GroupName]["makeEffects"]> & string,
  T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]
>(groupName: K_GroupName, effectName: K_EffectName, params: T_Params) {
  const foundEffect = findParamEffect(groupName, effectName, params);
  if (foundEffect) return foundEffect;
  makeAndStoreParamEffectsForGroup(groupName, params);
  return findParamEffect(groupName, effectName, params);
}

// ---------- Exported functions

export function startParamEffect<
  K_GroupName extends keyof RefinedParamEffectGroups & string,
  K_EffectName extends keyof ReturnType<RefinedParamEffectGroups[K_GroupName]["makeEffects"]> & string,
  T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]
>(groupName: K_GroupName, effectName: K_EffectName, params: T_Params) {
  const effect = findOrMakeParamEffect(groupName, effectName, params);
  if (!effect) return console.warn("no effect found for ", groupName, effectName, params);
  _addEffect(effect);
}

// NOTE this wont update paramEffectIdsByGroupPlusParamKey is all are stopped in a group, if it's a good idea, it could remove its own id from that list
// unless it's a good to keep that list for startParamEffectsGroup
export function stopParamEffect<
  K_GroupName extends keyof RefinedParamEffectGroups & string,
  K_EffectName extends keyof ReturnType<RefinedParamEffectGroups[K_GroupName]["makeEffects"]> & string,
  T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]
>(groupName: K_GroupName, effectName: K_EffectName, params: T_Params) {
  const effect = findParamEffect(groupName, effectName, params);
  // console.log("stop param effect", effect);
  // if (!effect) return console.warn("no effect found for ", groupName, effectName, params);
  // FIXME repond events is stopping effects that are not found
  if (!effect) return;
  const effectId = getParamEffectId(groupName, effectName, params);
  _stopEffect(effect.id!);
}

export function startParamEffectsGroup<
  K_GroupName extends keyof RefinedParamEffectGroups & string,
  T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]
>(groupName: K_GroupName, params: T_Params) {
  const effectIds = getOrMakeEffectIdsForGroupPlusParam(groupName, params);
  if (!effectIds?.length) return console.warn("no effectIds found for ", groupName);
  forEach(effectIds, (effectId) => {
    const effect = meta.liveEffectsMap[effectId];
    if (!effect) return console.warn("no effect found for ", groupName, effectId);
    _addEffect(effect);
  });
}

export function stopParamEffectsGroup<
  K_GroupName extends keyof RefinedParamEffectGroups & string,
  T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]
>(groupName: K_GroupName, params: T_Params) {
  const effectIds = getEffectIdsForGroupPlusParam(groupName, params);
  if (!effectIds) return console.warn("no effectIds found for ", groupName, params);
  forEach(effectIds, (effectId) => _stopEffect(effectId));
  deleteEffectIdsForGroupPlusParam(groupName, params);
}

export function runParamEffect<
  K_GroupName extends keyof RefinedParamEffectGroups & string,
  K_EffectName extends keyof ReturnType<RefinedParamEffectGroups[K_GroupName]["makeEffects"]> & string,
  T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]
>(groupName: K_GroupName, effectName: K_EffectName, params: T_Params) {
  const effect = findOrMakeParamEffect(groupName, effectName, params);
  if (!effect) return console.warn("no effect found for ", groupName, effectName);
  effect.run("", meta.diffInfo as any, 16.66666, true /* ranWithoutChange */);
}

export function runParamEffectsGroup<
  K_GroupName extends keyof RefinedParamEffectGroups & string,
  T_Params extends RefinedParamEffectGroups[K_GroupName]["defaultParams"]
>(groupName: K_GroupName, params: T_Params) {
  const effectIds = getOrMakeEffectIdsForGroupPlusParam(groupName, params);
  if (!effectIds?.length) return console.warn("no effectIds made for ", groupName, params);
  forEach(effectIds, (effectId) => {
    const effect = meta.liveEffectsMap[effectId];
    if (!effect) return console.warn("no effect found for ", groupName, effectId);
    effect.run("", meta.diffInfo as any, 16.66666, true /* ranWithoutChange */);
  });
}
