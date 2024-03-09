import { forEach } from "chootils/dist/loops";
import meta from "../meta";
import { getPrevState, getState } from "../usable/getSet";
import { _startEffect, easyEffectToEffect, itemEffectToEffect, makeEffect, makeItemEffect, stopNewEffect, toSafeEffectId, } from "./effects";
/** @deprecated Please use makeEffects instead*/
export function makeRules(getEffectsToAdd, rulesName // TODO register rules to an object in meta
) {
    const effectsToAdd = getEffectsToAdd({ itemEffect: makeItemEffect, effect: makeEffect });
    const effectNames = Object.keys(effectsToAdd);
    const effectIdPrefix = rulesName ? `${rulesName}_` : toSafeEffectId("makeRules");
    // edit the ids for each rule
    forEach(effectNames, (effectName) => (effectsToAdd[effectName].id = effectIdPrefix + effectName));
    const start = (effectName) => _startEffect(effectsToAdd[effectName]);
    const stop = (effectName) => stopNewEffect(effectIdPrefix + effectName);
    // NOTE wont wait for the effects step
    const run = (effectName) => effectsToAdd[effectName].run(meta.diffInfo, 16.66666, true); // true = ranWithoutChange
    const runAll = () => forEach(effectNames, (effectName) => run(effectName));
    const startAll = () => forEach(effectNames, (effectName) => start(effectName));
    const stopAll = () => forEach(effectNames, (effectName) => stop(effectName));
    return { start, stop, startAll, stopAll, effectNames, run, runAll };
}
// -----------------
// Make and remake rules with params
function makeDynamicEffect(easyEffectGetter) {
    return (params) => easyEffectToEffect({ ...easyEffectGetter(params) });
}
function makeDynamicItemEffect(itemEffectGetter) {
    return (params) => itemEffectToEffect(itemEffectGetter(params));
}
/** @deprecated This may change to a way to define paramed effects*/
export function makeDynamicRules(getEffectGetters) {
    const allEffectGetters = getEffectGetters({
        itemEffect: makeDynamicItemEffect,
        effect: makeDynamicEffect,
    });
    const effectNames = Object.keys(allEffectGetters);
    const effectIdPrefix = toSafeEffectId("makeDynamicRules");
    function ruleNamePostfixFromParams(params) {
        return JSON.stringify(params);
    }
    function getEffectId(effectName, params) {
        return `${effectIdPrefix}${effectName}${ruleNamePostfixFromParams(params)}`;
    }
    function start(ruleName, params) {
        const effectGetter = allEffectGetters[ruleName];
        if (effectGetter && typeof effectGetter === "function") {
            const effect = effectGetter(params);
            if (!effect.id)
                effect.id = getEffectId(ruleName, params);
            _startEffect(effect);
        }
    }
    function stop(ruleName, params) {
        const effectGetter = allEffectGetters[ruleName];
        if (effectGetter && typeof effectGetter === "function") {
            const foundOrMadeRuleName = effectGetter(params)?.id || getEffectId(ruleName, params);
            stopNewEffect(foundOrMadeRuleName);
        }
        else {
            console.log("no rule set for ", ruleName);
        }
    }
    // NOTE Experimental, if all the rules have the same params
    function startAll(params) {
        forEach(effectNames, (ruleName) => start(ruleName, params));
    }
    function stopAll(params) {
        forEach(effectNames, (ruleName) => stop(ruleName, params));
    }
    return { start, stop, effectNames, startAll, stopAll };
}
// ---------------------------------------------------
// Make Rule Makers
// ---------------------------------------------------
export function makeRuleMaker(storeName, storeItemId, storyProperty, stepName, getUsefulParams) {
    const effectId = toSafeEffectId(`customEffectFor_${storeName}_${storyProperty}`);
    function newRuleMaker(callbacksMap) {
        return makeRules(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulParams = getUsefulParams?.();
                    const latestValue = getState()[storeName][storeItemId][storyProperty];
                    callbacksMap[latestValue]?.(usefulParams);
                },
                check: { prop: [storyProperty], id: storeItemId, type: storeName },
                step: stepName ?? "default",
                atStepEnd: true,
                id: effectId,
            }),
        }));
    }
    return newRuleMaker;
}
export function makeLeaveRuleMaker(storeName, storeItemId, storyProperty, stepName, getUsefulParams) {
    const ruleName = `customRuleFor_${storeName}_${storyProperty}${Math.random()}`;
    function newRuleMaker(callBacksObject) {
        return makeRules(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulStoryStuff = getUsefulParams?.();
                    const prevValue = getPrevState()[storeName][storeItemId][storyProperty];
                    callBacksObject[prevValue]?.(usefulStoryStuff);
                },
                check: { prop: [storyProperty], id: storeItemId, type: storeName },
                step: stepName ?? "default",
                atStepEnd: true,
                id: ruleName,
            }),
        }));
    }
    return newRuleMaker;
}
// makeNestedRuleMaker, similar to makeRuleMaker but accepts parameters for two store properties (can be from different stores) , and the callback fires when properties of both stores change
export function makeNestedRuleMaker(storeInfo1, storeInfo2, stepName, getUsefulParams) {
    const [storeName1, storeItemId1, storyProp1] = storeInfo1;
    const [storeName2, storeItemId2, storyProp2] = storeInfo2;
    const ruleName = toSafeEffectId(`customRuleFor_${storeName1}_${storyProp1}_${storeName2}_${storyProp2}`);
    function newRuleMaker(callBacksObject) {
        return makeRules(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulStoryStuff = getUsefulParams?.();
                    const latestValue1 = getState()[storeName1][storeItemId1][storyProp1];
                    const latestValue2 = getState()[storeName2][storeItemId2][storyProp2];
                    callBacksObject[latestValue1]?.[latestValue2]?.(usefulStoryStuff);
                },
                check: [
                    { prop: [storyProp1], id: storeItemId1, type: storeName1 },
                    { prop: [storyProp2], id: storeItemId2, type: storeName2 },
                ],
                step: stepName ?? "default",
                atStepEnd: true,
                id: ruleName,
            }),
        }));
    }
    return newRuleMaker;
}
// makeNestedLeaveRuleMaker, the same as makeNestedRuleMaker , but the callback fires when the properties of both stores become NOT the specified values, but were previously
export function makeNestedLeaveRuleMaker(storeInfo1, storeInfo2, stepName, getUsefulParams) {
    const [storeName1, storeItemId1, storyProperty1] = storeInfo1;
    const [storeName2, storeItemId2, storyProperty2] = storeInfo2;
    const ruleName = toSafeEffectId(`customLeaveRuleFor_${storeName1}_${storyProperty1}_${storeName2}_${storyProperty2}`);
    function newRuleMaker(callBacksObject) {
        return makeRules(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulParams = getUsefulParams?.();
                    const latestValue1 = getState()[storeName1][storeItemId1][storyProperty1];
                    const latestValue2 = getState()[storeName2][storeItemId2][storyProperty2];
                    const prevValue1 = getPrevState()[storeName1][storeItemId1][storyProperty1];
                    const prevValue2 = getPrevState()[storeName2][storeItemId2][storyProperty2];
                    const callback = callBacksObject[prevValue1]?.[prevValue2];
                    if (callback)
                        callback(usefulParams);
                },
                check: [
                    { prop: [storyProperty1], id: storeItemId1, type: storeName1 },
                    { prop: [storyProperty2], id: storeItemId2, type: storeName2 },
                ],
                step: stepName ?? "default",
                atStepEnd: true,
                id: ruleName,
            }),
        }));
    }
    return newRuleMaker;
}
