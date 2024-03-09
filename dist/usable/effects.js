import { removeItemFromArrayInPlace } from "chootils/dist/arrays";
import { breakableForEach, forEach } from "chootils/dist/loops";
import { default as meta, default as repondMeta } from "../meta";
import { runWhenDoingEffectsRunAtStart, runWhenStartingEffects, runWhenStoppingEffects } from "../settingInternal";
import { getPrevState, getRefs, getState } from "../usable/getSet";
import { toArray, toMaybeArray } from "../utils";
// -------------------------------------------------------
// Converters
// -------------------------------------------------------
// Convert an itemEffect callback to a regular effect callback
function itemEffectRunToEffectRun({ check, run, }) {
    let allowedIdsMap = undefined;
    const props = toArray(check.prop);
    const type = check.type;
    const ids = toMaybeArray(check.id);
    const becomes = check.becomes;
    if (ids) {
        allowedIdsMap = {};
        forEach(ids, (itemId) => {
            if (allowedIdsMap)
                allowedIdsMap[itemId] = true;
        });
    }
    return (diffInfo, frameDuration, skipChangeCheck) => {
        // if skipChangeCheck is true, it will run the run function regardless of the changes
        if (skipChangeCheck) {
            const idsToRun = ids?.length ? ids : meta.itemIdsByItemType[type];
            if (idsToRun?.length) {
                const prevItemsState = getPrevState()[type];
                const itemsState = getState()[type];
                const itemsRefs = getRefs()[type];
                forEach(idsToRun, (itemId) => {
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
                        return true; // break out of the props loop, so it only runs once per item
                    });
                });
            }
            return true; // return early if skipChangeCheck was true
        }
        const prevItemsState = getPrevState()[type];
        const itemsState = getState()[type];
        const itemsRefs = getRefs()[type];
        forEach(diffInfo.itemsChanged[type], (itemIdThatChanged) => {
            if (!(!allowedIdsMap || (allowedIdsMap && allowedIdsMap[itemIdThatChanged])))
                return;
            breakableForEach(props, (propName) => {
                if (!diffInfo.propsChangedBool[type][itemIdThatChanged][propName])
                    return;
                const newValue = itemsState[itemIdThatChanged][propName];
                let canRunRun = false;
                if (becomes === undefined)
                    canRunRun = true;
                else if (typeof becomes === "function") {
                    canRunRun = becomes(newValue, prevItemsState[itemIdThatChanged][propName]);
                }
                else if (becomes === newValue)
                    canRunRun = true;
                if (!canRunRun)
                    return;
                run({
                    itemId: itemIdThatChanged,
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
function easyEffectCheckToEffectChecks(effectCheck) {
    const checksArray = toArray(effectCheck);
    return checksArray.map((check) => ({
        types: toMaybeArray(check.type),
        names: toMaybeArray(check.id),
        props: toMaybeArray(check.prop),
        addedOrRemoved: check.addedOrRemoved,
    }));
}
export function easyEffectToEffect(easyEffect) {
    return {
        ...easyEffect,
        id: easyEffect.id ?? toSafeEffectId("effect"),
        checks: easyEffectCheckToEffectChecks(easyEffect.check),
    };
}
export function itemEffectToEffect(itemEffect) {
    let effectName = itemEffect.id || "unnamedItemEffect" + Math.random();
    return easyEffectToEffect({
        ...itemEffect,
        id: effectName,
        check: { ...itemEffect.check, becomes: undefined, prop: toMaybeArray(itemEffect.check.prop) },
        run: itemEffectRunToEffectRun(itemEffect),
    });
}
// --------------------------------------------------------------------
// Internal functions
// --------------------------------------------------------------------
export function _startEffect(newEffect) {
    const phase = !!newEffect.atStepEnd ? "endOfStep" : "duringStep";
    const step = newEffect.step ?? "default";
    if (newEffect.runAtStart) {
        runWhenDoingEffectsRunAtStart(() => newEffect.run(meta.diffInfo, 16.66666, true /* ranWithoutChange */));
    }
    runWhenStartingEffects(() => {
        meta.allEffects[newEffect.id] = newEffect;
        if (!meta.effectIdsByPhaseByStep[phase][step]) {
            // add the effect to a new array
            meta.effectIdsByPhaseByStep[phase][step] = [newEffect.id];
        }
        else {
            if (!meta.effectIdsByPhaseByStep[phase][step]?.includes(newEffect.id)) {
                // add the effect to the array if it's not already there
                meta.effectIdsByPhaseByStep[phase][step].push(newEffect.id);
            }
        }
    });
}
export function _stopEffect(effectName) {
    runWhenStoppingEffects(() => {
        const effect = meta.allEffects[effectName];
        if (!effect)
            return;
        const phase = !!effect.atStepEnd ? "endOfStep" : "duringStep";
        const step = effect.step ?? "default";
        removeItemFromArrayInPlace(meta.effectIdsByPhaseByStep[phase][step] ?? [], effect.id);
        delete meta.allEffects[effectName];
    });
}
export function toSafeEffectId(prefix) {
    const counterNumber = repondMeta.autoEffectIdCounter;
    repondMeta.autoEffectIdCounter += 1;
    return (prefix || "autoEffect") + "_" + counterNumber;
}
// --------------------------------------------------------------------
// Usable functions
// --------------------------------------------------------------------
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
    const theEffect = meta.allGroupedEffects[groupName][effectName];
    if (!theEffect)
        return console.warn("no effect found for ", groupName, effectName);
    _startEffect(theEffect);
}
export function stopEffect(groupName, effectName) {
    const theEffect = meta.allGroupedEffects[groupName][effectName];
    if (!theEffect)
        return console.warn("no effect found for ", groupName, effectName);
    _stopEffect(theEffect.id);
}
export function startGroupEffects(groupName) {
    const theGroup = meta.allGroupedEffects[groupName];
    forEach(Object.keys(theGroup), (effectName) => startEffect(groupName, effectName));
}
export function stopGroupEffects(groupName) {
    const theGroup = meta.allGroupedEffects[groupName];
    forEach(Object.keys(theGroup), (effectName) => stopEffect(groupName, effectName));
}
export function startAllGroupsEffects() {
    forEach(Object.keys(meta.allGroupedEffects), (groupName) => startGroupEffects(groupName));
}
export function stopAllGroupsEffects() {
    forEach(Object.keys(meta.allGroupedEffects), (groupName) => stopGroupEffects(groupName));
}
export function runEffect(groupName, effectName) {
    const theEffect = meta.allGroupedEffects[groupName][effectName];
    if (!theEffect)
        return console.warn("no effect found for ", groupName, effectName);
    theEffect.run(meta.diffInfo, 16.66666, true /* ranWithoutChange */);
}
export function runGroupEffects(groupName) {
    const theGroup = meta.allGroupedEffects[groupName];
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
export function initGroupedEffects(groups) {
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
    meta.allGroupedEffects = transformedGroups;
    return groups;
}
