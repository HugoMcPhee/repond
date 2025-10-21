import { forEach } from "chootils/dist/loops";
import { _addEffect, _stopEffect } from "../helpers/effects";
import { warn } from "../helpers/logging";
import { repondMeta as meta } from "../meta";
import { makeEffect } from "./effects";
export function makeParamEffects(defaultParams, effectsToAdd) {
    return {
        defaultParams,
        makeEffects: effectsToAdd,
    };
}
export function initParamEffectGroups(groups) {
    const transformedGroups = {};
    Object.entries(groups).forEach(([key, value]) => {
        // Remove "ParamEffects" from the end of the key, if present
        const newKey = key.replace(/ParamEffects$/, "");
        transformedGroups[newKey] = value;
    });
    // Store the transformed groups
    meta.allParamEffectGroups = transformedGroups;
    // storedParamEffectsMap
    return groups;
}
function sortAndStringifyObject(obj) {
    const sortedKeys = Object.keys(obj).sort();
    const parts = sortedKeys.map((key) => `${key}_${JSON.stringify(obj[key])}`);
    return parts.join("_");
}
function getParamEffectId(groupName, effectName, params) {
    return `${groupName}.${effectName}.${sortAndStringifyObject(params)}`;
}
function getGroupPlusParamKey(groupName, params) {
    return `${groupName}.${sortAndStringifyObject(params)}`;
}
function findParamEffect(groupName, effectName, params) {
    const effectId = getParamEffectId(groupName, effectName, params);
    return meta.liveEffectsMap[effectId];
}
function makeAndStoreParamEffectsForGroup(groupName, params) {
    const madeParamEffects = meta.allParamEffectGroups?.[groupName]?.makeEffects(makeEffect, params);
    if (!madeParamEffects)
        return warn("no param effects stored for ", groupName), undefined; // returns undefined instead of void from console.warn
    const effectIds = [];
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
function getEffectIdsForGroupPlusParam(groupName, params) {
    const groupPlusParamKey = getGroupPlusParamKey(groupName, params);
    return meta.paramEffectIdsByGroupPlusParamKey[groupPlusParamKey];
}
function deleteEffectIdsForGroupPlusParam(groupName, params) {
    const groupPlusParamKey = getGroupPlusParamKey(groupName, params);
    delete meta.paramEffectIdsByGroupPlusParamKey[groupPlusParamKey];
}
function getOrMakeEffectIdsForGroupPlusParam(groupName, params) {
    const effectIds = getEffectIdsForGroupPlusParam(groupName, params);
    if (effectIds)
        return effectIds;
    return makeAndStoreParamEffectsForGroup(groupName, params);
}
function findOrMakeParamEffect(groupName, effectName, params) {
    const foundEffect = findParamEffect(groupName, effectName, params);
    if (foundEffect)
        return foundEffect;
    makeAndStoreParamEffectsForGroup(groupName, params);
    return findParamEffect(groupName, effectName, params);
}
// ---------- Exported functions
export function startParamEffect(groupName, effectName, params) {
    const effect = findOrMakeParamEffect(groupName, effectName, params);
    if (!effect)
        return warn("no effect found for ", groupName, effectName, params);
    _addEffect(effect);
}
// NOTE this wont update paramEffectIdsByGroupPlusParamKey is all are stopped in a group, if it's a good idea, it could remove its own id from that list
// unless it's a good to keep that list for startParamEffectsGroup
export function stopParamEffect(groupName, effectName, params) {
    const effect = findParamEffect(groupName, effectName, params);
    // console.log("stop param effect", effect);
    // if (!effect) return warn("no effect found for ", groupName, effectName, params);
    // FIXME repond events is stopping effects that are not found
    if (!effect)
        return;
    const effectId = getParamEffectId(groupName, effectName, params);
    _stopEffect(effect.id);
}
export function startParamEffectsGroup(groupName, params) {
    const effectIds = getOrMakeEffectIdsForGroupPlusParam(groupName, params);
    if (!effectIds?.length)
        return warn("no effectIds found for ", groupName);
    forEach(effectIds, (effectId) => {
        const effect = meta.liveEffectsMap[effectId];
        if (!effect)
            return warn("no effect found for ", groupName, effectId);
        _addEffect(effect);
    });
}
export function stopParamEffectsGroup(groupName, params) {
    const effectIds = getEffectIdsForGroupPlusParam(groupName, params);
    if (!effectIds)
        return warn("no effectIds found for ", groupName, params);
    forEach(effectIds, (effectId) => _stopEffect(effectId));
    deleteEffectIdsForGroupPlusParam(groupName, params);
}
export function runParamEffect(groupName, effectName, params) {
    const effect = findOrMakeParamEffect(groupName, effectName, params);
    if (!effect)
        return warn("no effect found for ", groupName, effectName);
    effect.run("", meta.diffInfo, 16.66666, true /* ranWithoutChange */);
}
export function runParamEffectsGroup(groupName, params) {
    const effectIds = getOrMakeEffectIdsForGroupPlusParam(groupName, params);
    if (!effectIds?.length)
        return warn("no effectIds made for ", groupName, params);
    forEach(effectIds, (effectId) => {
        const effect = meta.liveEffectsMap[effectId];
        if (!effect)
            return warn("no effect found for ", groupName, effectId);
        effect.run("", meta.diffInfo, 16.66666, true /* ranWithoutChange */);
    });
}
