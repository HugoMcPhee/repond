import { addItemToUniqueArray, removeItemFromArray } from "chootils/dist/arrays";
import { breakableForEach, forEach } from "chootils/dist/loops";
import meta, { toSafeEffectName } from "../meta";
import { runWhenDoingInnerEffectsRunAtStart, runWhenStartingInnerEffects, runWhenStoppingInnerEffects, } from "../settingInternal";
import { asArray, toSafeArray } from "../utils";
import { getPrevState, getRefs, getState } from "../usable/getSet";
export function makeEffect(options) {
    return { ...options, _isPerItem: false };
}
export function makeItemEffect(options) {
    return { ...options, _isPerItem: true };
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
// NOTE: not typed but only internal
function itemEffectRunToEffectRun({ type, name, prop, run, becomes, }) {
    const editedItemTypes = asArray(type);
    let allowedNames = undefined;
    if (name) {
        allowedNames = {};
        forEach(name, (loopedItemName) => {
            if (allowedNames)
                allowedNames[loopedItemName] = true;
        });
    }
    return (diffInfo, frameDuration, skipChangeCheck) => {
        // if skipChangeCheck is true, it will run the run function regardless of the changes
        if (skipChangeCheck) {
            if (name) {
                forEach(editedItemTypes, (theItemType) => {
                    const prevItemsState = getPrevState()[theItemType];
                    const itemsState = getState()[theItemType];
                    const itemsRefs = getRefs()[theItemType];
                    forEach(name, (loopedItemName) => {
                        breakableForEach(prop, (thePropertyName) => {
                            const newValue = itemsState[loopedItemName][thePropertyName];
                            run({
                                itemName: name,
                                newValue,
                                prevValue: prevItemsState[loopedItemName][thePropertyName],
                                itemState: itemsState[loopedItemName],
                                itemRefs: itemsRefs[loopedItemName],
                                frameDuration,
                                ranWithoutChange: true,
                            });
                            return true; // break out of the loop, so it only runs once
                        });
                    });
                });
            }
            return true; // return early if skipChangeCheck was true
        }
        forEach(editedItemTypes, (theItemType) => {
            const prevItemsState = getPrevState()[theItemType];
            const itemsState = getState()[theItemType];
            const itemsRefs = getRefs()[theItemType];
            forEach(diffInfo.itemsChanged[theItemType], (itemNameThatChanged) => {
                if (!(!allowedNames || (allowedNames && allowedNames[itemNameThatChanged])))
                    return;
                breakableForEach(prop, (thePropertyName) => {
                    if (!diffInfo.propsChangedBool[theItemType][itemNameThatChanged][thePropertyName])
                        return;
                    const newValue = itemsState[itemNameThatChanged][thePropertyName];
                    let canRunRun = false;
                    if (becomes === undefined)
                        canRunRun = true;
                    else if (typeof becomes === "function") {
                        canRunRun = becomes(newValue, prevItemsState[itemNameThatChanged][thePropertyName]);
                    }
                    else if (becomes === newValue)
                        canRunRun = true;
                    if (!canRunRun)
                        return;
                    run({
                        itemName: itemNameThatChanged,
                        newValue,
                        prevValue: prevItemsState[itemNameThatChanged][thePropertyName],
                        itemState: itemsState[itemNameThatChanged],
                        itemRefs: itemsRefs[itemNameThatChanged],
                        frameDuration,
                        ranWithoutChange: false,
                    });
                    return true; // break out of the loop, so it only runs once
                });
            });
        });
    };
}
// converts a repond effect to a normalised 'inner effect', where the names are an array instead of one
function effectOneCheckToInnerEffectOneCheck(effectOneCheck) {
    return {
        names: toSafeArray(effectOneCheck.name),
        types: effectOneCheck.type,
        props: effectOneCheck.prop,
        addedOrRemoved: effectOneCheck.addedOrRemoved,
    };
}
// converts a effect check to a innerEffect check (where it's an array of checks)
function effectCheckToInnerEffectCheck(effectCheck) {
    if (Array.isArray(effectCheck)) {
        return effectCheck.map((loopedCheckProperty) => effectOneCheckToInnerEffectOneCheck(loopedCheckProperty));
    }
    return effectOneCheckToInnerEffectOneCheck(effectCheck);
}
// converts a effect to an innerEffect
function convertEffectToInnerEffect(effectOptions) {
    return {
        check: effectCheckToInnerEffectCheck(effectOptions.check),
        atStepEnd: !!effectOptions.atStepEnd,
        name: effectOptions.name,
        run: effectOptions.run,
        step: effectOptions.step,
    };
}
// --------------------------------------------------------------------
// more utils
// --------------------------------------------------------------------
function normaliseInnerEffectCheck(check) {
    const checksArray = asArray(check);
    return checksArray.map((check) => ({
        types: toSafeArray(check.types),
        names: check.names,
        props: check.props,
        addedOrRemoved: check.addedOrRemoved,
    }));
}
function _startInnerEffect(newListener) {
    const atStepEnd = !!newListener.atStepEnd;
    const phase = atStepEnd ? "endOfStep" : "duringStep";
    const editedListener = {
        name: newListener.name,
        check: normaliseInnerEffectCheck(newListener.check),
        run: newListener.run,
    };
    if (atStepEnd)
        editedListener.atStepEnd = atStepEnd;
    if (newListener.step)
        editedListener.step = newListener.step;
    runWhenStartingInnerEffects(() => {
        // add the new innerEffect to all innerEffects and update innerEffectNamesByPhaseByStep
        meta.allInnerEffects[editedListener.name] = editedListener;
        meta.innerEffectNamesByPhaseByStep[phase][editedListener.step ?? "default"] = addItemToUniqueArray(meta.innerEffectNamesByPhaseByStep[phase][editedListener.step ?? "default"] ?? [], editedListener.name);
    });
}
function _stopInnerEffect(effectName) {
    runWhenStoppingInnerEffects(() => {
        const theListener = meta.allInnerEffects[effectName];
        if (!theListener)
            return;
        const atStepEnd = !!theListener.atStepEnd;
        const phase = atStepEnd ? "endOfStep" : "duringStep";
        const step = theListener.step ?? "default";
        meta.innerEffectNamesByPhaseByStep[phase][step] = removeItemFromArray(meta.innerEffectNamesByPhaseByStep[phase][step] ?? [], theListener.name);
        delete meta.allInnerEffects[effectName];
    });
}
// --------------------------------------------------------------------
// other functions
// --------------------------------------------------------------------
export function startNewEffect(theEffect) {
    let innerEffectName = theEffect.name || toSafeEffectName("effect");
    // add the required effectName
    const editedEffect = {
        check: theEffect.check,
        name: innerEffectName,
        run: theEffect.run,
        atStepEnd: theEffect.atStepEnd,
        step: theEffect.step,
        runAtStart: theEffect.runAtStart,
    };
    if (theEffect.runAtStart) {
        runWhenDoingInnerEffectsRunAtStart(() => {
            theEffect.run(meta.diffInfo, 16.66666, true /* ranWithoutChange */);
        });
    }
    _startInnerEffect(convertEffectToInnerEffect(editedEffect));
}
export function startNewItemEffect({ check, run, atStepEnd, name, step, runAtStart, }) {
    let effectName = name || "unnamedEffect" + Math.random();
    const editedItemTypes = toSafeArray(check.type);
    const editedPropertyNames = toSafeArray(check.prop);
    const editedItemNames = toSafeArray(check.name);
    let editedCheck = {
        type: editedItemTypes,
        prop: editedPropertyNames,
        name: editedItemNames,
    };
    let runEffect = itemEffectRunToEffectRun({
        type: editedItemTypes,
        name: editedItemNames,
        prop: editedPropertyNames ?? [],
        run: run,
        becomes: check.becomes,
    });
    startNewEffect({
        atStepEnd,
        name: effectName,
        check: editedCheck,
        run: runEffect,
        step,
        runAtStart,
    });
    return effectName;
}
export function stopNewEffect(effectName) {
    _stopInnerEffect(effectName);
}
// ---------------------------------------------------
// Make Effects
// ---------------------------------------------------
export function startEffect(groupName, effectName) {
    const theEffect = meta.allGroupedEffects[groupName][effectName];
    if (!theEffect) {
        console.warn("no effect found for ", groupName, effectName);
        return;
    }
    if (theEffect._isPerItem) {
        startNewItemEffect(theEffect);
    }
    else {
        startNewEffect(theEffect);
    }
}
export function stopEffect(groupName, effectName) {
    const theEffect = meta.allGroupedEffects[groupName][effectName];
    if (!theEffect) {
        console.warn("no effect found for ", groupName, effectName);
        return;
    }
    stopNewEffect(theEffect.name);
}
export function startGroupEffects(groupName) {
    const theGroup = meta.allGroupedEffects[groupName];
    forEach(Object.keys(theGroup), (effectName) => {
        startEffect(groupName, effectName);
    });
}
export function stopGroupEffects(groupName) {
    const theGroup = meta.allGroupedEffects[groupName];
    forEach(Object.keys(theGroup), (effectName) => {
        stopEffect(groupName, effectName);
    });
}
export function startAllGroupedEffects() {
    forEach(Object.keys(meta.allGroupedEffects), (groupName) => {
        startGroupEffects(groupName);
    });
}
export function stopAllGroupedEffects() {
    forEach(Object.keys(meta.allGroupedEffects), (groupName) => {
        stopGroupEffects(groupName);
    });
}
export function runEffect(groupName, effectName) {
    const theEffect = meta.allGroupedEffects[groupName][effectName];
    if (!theEffect) {
        console.warn("no effect found for ", groupName, effectName);
        return;
    }
    if (theEffect._isPerItem) {
        // Run the item rule for each item (and prop)
        const itemType = theEffect.check.type;
        const itemNames = meta.itemNamesByItemType[itemType];
        const propNames = toSafeArray(theEffect.check.prop) ?? [];
        const itemsState = getState()[itemType];
        const prevItemsState = getPrevState()[itemType];
        const itemsRefs = getRefs()[itemType];
        forEach(itemNames, (itemName) => {
            forEach(propNames, (propName) => {
                const newValue = itemsState[itemName][propName];
                theEffect.run({
                    itemName: itemName,
                    newValue,
                    prevValue: prevItemsState[itemName][propName],
                    itemState: itemsState[itemName],
                    itemRefs: itemsRefs[itemName],
                    frameDuration: 16.66666,
                    ranWithoutChange: true,
                });
            });
        });
    }
    else {
        // Run the rule once
        theEffect.run(meta.diffInfo, 16.66666, true /* ranWithoutChange */);
    }
}
export function runGroupEffects(groupName) {
    const theGroup = meta.allGroupedEffects[groupName];
    forEach(Object.keys(theGroup), (effectName) => {
        runEffect(groupName, effectName);
    });
}
export function makeEffects(rulesToAdd) {
    return rulesToAdd({ itemEffect: makeItemEffect, effect: makeEffect });
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
            theEffect.name = `${groupName}_${effectName}`;
        });
    });
    // Store the transformed groups
    meta.allGroupedEffects = transformedGroups;
    return groups;
}
