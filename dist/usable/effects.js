import { forEach } from "chootils/dist/loops";
import { _startEffect, _stopEffect, runEffectWithoutChange, storeCachedValuesForEffect } from "../helpers/effects";
import { repondMeta as meta } from "../meta";
export function startNewEffect(theEffect) {
    return _startEffect(theEffect);
}
// This is really startGroupedEffect
export function startEffect(effectId) {
    const theEffect = meta.storedEffectsMap[effectId];
    if (!theEffect)
        return console.warn("no effect found for ", effectId);
    _startEffect(theEffect);
}
export function stopEffect(effectId) {
    const theEffect = meta.liveEffectsMap[effectId];
    //  NOTE Not logging if it tried to stop a missing event, because react useEffect does a quick start stop at the start
    // if (!theEffect) return console.warn("(stop) no effect found for ", effectId);
    if (!theEffect)
        return;
    _stopEffect(theEffect.id);
}
export function startEffectsGroup(groupName) {
    forEach(meta.effectIdsByGroup[groupName], (effectId) => startEffect(effectId));
}
export function stopEffectsGroup(groupName) {
    forEach(meta.effectIdsByGroup[groupName], (effectId) => stopEffect(effectId));
}
export function startAllEffectsGroups() {
    forEach(Object.keys(meta.effectIdsByGroup), (groupName) => startEffectsGroup(groupName));
}
export function stopAllEffectsGroups() {
    forEach(Object.keys(meta.effectIdsByGroup), (groupName) => stopEffectsGroup(groupName));
}
export function runEffect(effectId) {
    const theEffect = meta.liveEffectsMap[effectId];
    if (!theEffect)
        return console.warn("(run) no effect found for ", effectId);
    runEffectWithoutChange(theEffect);
}
export function runEffectsGroup(groupName) {
    forEach(meta.effectIdsByGroup[groupName], (effectId) => runEffect(effectId));
}
export function makeEffect(effectRun, effectOptions) {
    effectOptions.run = effectRun;
    return effectOptions;
}
export function makeEffects(getEffectsToAddCallback) {
    return getEffectsToAddCallback(makeEffect);
}
export function initEffectGroups(groups) {
    const transformedGroups = {};
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
            meta.storedEffectsMap[theEffect.id] = theEffect;
            meta.effectIdsByGroup[groupName] = meta.effectIdsByGroup[groupName] || [];
            meta.effectIdsByGroup[groupName].push(theEffect.id);
        });
    });
    // Only used for types
    return groups;
}
