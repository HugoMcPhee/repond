import { forEach } from "chootils/dist/loops";
import { easyEffectToEffect, itemEffectToEffect } from "../helpers/effects/converters";
import { _startEffect, _stopEffect } from "../helpers/effects/internal";
import { default as meta } from "../meta";
export function startNewEffect(theEffect) {
    _startEffect(easyEffectToEffect(theEffect));
}
export function startNewItemEffect(itemEffect) {
    const effect = itemEffectToEffect(itemEffect);
    _startEffect(effect);
    return effect.id;
}
export function stopNewEffect(effectName) {
    _stopEffect(effectName);
}
// This is really startGroupedEffect
export function startEffect(groupName, effectName) {
    const theEffect = meta.allEffectGroups[groupName][effectName];
    if (!theEffect)
        return console.warn("no effect found for ", groupName, effectName);
    _startEffect(theEffect);
}
export function stopEffect(groupName, effectName) {
    const theEffect = meta.allEffectGroups[groupName][effectName];
    if (!theEffect)
        return console.warn("no effect found for ", groupName, effectName);
    _stopEffect(theEffect.id);
}
export function startEffectsGroup(groupName) {
    const theGroup = meta.allEffectGroups[groupName];
    forEach(Object.keys(theGroup), (effectName) => startEffect(groupName, effectName));
}
export function stopEffectsGroup(groupName) {
    const theGroup = meta.allEffectGroups[groupName];
    forEach(Object.keys(theGroup), (effectName) => stopEffect(groupName, effectName));
}
export function startAllEffectsGroups() {
    forEach(Object.keys(meta.allEffectGroups), (groupName) => startEffectsGroup(groupName));
}
export function stopAllEffectsGroups() {
    forEach(Object.keys(meta.allEffectGroups), (groupName) => stopEffectsGroup(groupName));
}
export function runEffect(groupName, effectName) {
    const theEffect = meta.allEffectGroups[groupName][effectName];
    if (!theEffect)
        return console.warn("no effect found for ", groupName, effectName);
    theEffect.run(meta.diffInfo, 16.66666, true /* ranWithoutChange */);
}
export function runEffectsGroup(groupName) {
    const theGroup = meta.allEffectGroups[groupName];
    forEach(Object.keys(theGroup), (effectName) => runEffect(groupName, effectName));
}
export function makeEffect(easyEffect) {
    return easyEffectToEffect(easyEffect);
}
export function makeItemEffect(itemEffect) {
    return itemEffectToEffect(itemEffect);
}
export function makeEffects(effectsToAdd) {
    return effectsToAdd({ itemEffect: makeItemEffect, effect: makeEffect });
}
export function initEffectGroups(groups) {
    const transformedGroups = {};
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
    meta.allEffectGroups = transformedGroups;
    return groups;
}
