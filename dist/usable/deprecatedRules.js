import { forEach } from "chootils/dist/loops";
import meta, { toSafeEffectName } from "../meta";
import { makeEffect, makeItemEffect, startNewEffect, startNewItemEffect, stopNewEffect, } from "../usable/effects";
import { getPrevState, getRefs, getState } from "../usable/getSet";
import { toSafeArray } from "../utils";
/** @deprecated Please use makeEffects instead*/
export function makeRules(rulesToAdd, rulesName // TODO register rules to an object in meta
) {
    // type RuleName = keyof ReturnType<typeof rulesToAdd>;
    const editedRulesToAdd = rulesToAdd({
        itemEffect: makeItemEffect,
        effect: makeEffect,
    });
    const ruleNames = Object.keys(editedRulesToAdd);
    const ruleNamePrefix = rulesName ? `${rulesName}_` : toSafeEffectName("makeRules");
    // edit the names for each rule
    forEach(ruleNames, (ruleName) => {
        const loopedRule = editedRulesToAdd[ruleName];
        if (loopedRule) {
            loopedRule.name = ruleNamePrefix + ruleName;
        }
    });
    // maybe startRule so it can be {startRule} =
    function start(ruleName) {
        const theRule = editedRulesToAdd[ruleName];
        if (!theRule)
            return;
        if (theRule._isPerItem) {
            startNewItemEffect(theRule);
        }
        else {
            startNewEffect(theRule);
        }
    }
    function stop(ruleName) {
        if (editedRulesToAdd[ruleName]) {
            stopNewEffect(ruleNamePrefix + ruleName);
        }
    }
    // type EditedRulesToAdd = typeof editedRulesToAdd;
    // type EditedRulesToAdd222 = EditedRulesToAdd[K_RuleName]["check"];
    // run the rule directly
    function run(ruleName) {
        // NOTE this doesn't wait for the step chosen for the rule!
        // maybe it should?
        const theRule = editedRulesToAdd[ruleName];
        if (!theRule)
            return;
        if (theRule._isPerItem) {
            // Run the item rule for each item (and prop)
            const itemType = theRule.check.type;
            const itemNames = meta.itemNamesByItemType[itemType];
            const propNames = toSafeArray(theRule.check.prop) ?? [];
            const itemsState = getState()[itemType];
            const prevItemsState = getPrevState()[itemType];
            const itemsRefs = getRefs()[itemType];
            forEach(itemNames, (itemName) => {
                forEach(propNames, (propName) => {
                    const newValue = itemsState[itemName][propName];
                    theRule.run({
                        itemName: itemName,
                        newValue,
                        prevValue: prevItemsState[itemName][propName],
                        itemState: itemsState[itemName],
                        itemRefs: itemsRefs[itemName],
                        frameDuration: 16.66666,
                    });
                });
            });
        }
        else {
            // Run the rule once
            theRule.run(meta.diffInfo, 16.66666);
        }
    }
    function runAll() {
        forEach(ruleNames, (ruleName) => run(ruleName));
    }
    function startAll() {
        forEach(ruleNames, (ruleName) => start(ruleName));
    }
    function stopAll() {
        forEach(ruleNames, (ruleName) => stop(ruleName));
    }
    return {
        start,
        stop,
        startAll,
        stopAll,
        ruleNames: ruleNames,
        run,
        runAll,
    };
}
// -----------------
// make rules dynamic
function makeDynamicEffectInlineFunction(theRule) {
    // return theRule;
    return (options) => ({ ...theRule(options), _isPerItem: false });
}
function makeDynamicItemEffectInlineFunction(theRule) {
    // return theRule;
    return (options) => ({ ...theRule(options), _isPerItem: true });
}
//
// type MakeDynamicEffectInlineFunction = <
//   K_Type extends T_ItemType,
//   T_Options extends any
// >(
//   theRule: (options: T_Options) => Effect_RuleOptions<K_Type>
// ) => (options: T_Options) => Effect_RuleOptions<K_Type>;
//
// type MakeDynamicItemEffectInlineFunction = <
//   K_Type extends T_ItemType,
//   K_PropName extends PropertyName<K_Type>,
//   T_Options extends any
// >(
//   theRule: (
//     options: T_Options
//   ) => ItemEffect_RuleOptions<K_Type, K_PropName>
// ) => (options: T_Options) => ItemEffect_RuleOptions<K_Type, K_PropName>;
export function makeDynamicRules(rulesToAdd) {
    const allRules = rulesToAdd({
        itemEffect: makeDynamicItemEffectInlineFunction,
        effect: makeDynamicEffectInlineFunction,
    });
    const ruleNames = Object.keys(allRules);
    const ruleNamePrefix = `${ruleNames.map((loopedName) => loopedName.charAt(0)).join("")}`;
    // .join("")}${Math.random()}`;
    function ruleNamePostfixFromOptions(theOptions) {
        return JSON.stringify(theOptions);
    }
    function getWholeRuleName(ruleName, options) {
        return `${ruleNamePrefix}${ruleName}${ruleNamePostfixFromOptions(options)}`;
    }
    function start(ruleName, 
    // @ts-ignore
    options) {
        const theRuleFunction = allRules[ruleName];
        if (theRuleFunction && typeof theRuleFunction === "function") {
            const editedRuleObject = theRuleFunction(options);
            if (!editedRuleObject.name) {
                editedRuleObject.name = getWholeRuleName(ruleName, options);
            }
            if (editedRuleObject._isPerItem !== undefined) {
                startNewItemEffect(editedRuleObject);
            }
            else {
                startNewEffect(editedRuleObject);
            }
        }
    }
    function stop(ruleName, 
    // @ts-ignore
    options) {
        const theRuleFunction = allRules[ruleName];
        if (theRuleFunction && typeof theRuleFunction === "function") {
            const foundOrMadeRuleName = theRuleFunction(options)?.name || getWholeRuleName(ruleName, options);
            stopNewEffect(foundOrMadeRuleName);
        }
        else {
            console.log("no rule set for ", ruleName);
        }
    }
    // NOTE Experimental, if all the rules have the same options (BUT not typesafe at the moment)
    // ideally it can set startAll type as never if any of the options are different
    function startAll(
    // @ts-ignore
    options) {
        forEach(ruleNames, (ruleName) => {
            // @ts-ignore
            start(ruleName, options);
        });
    }
    function stopAll(
    // @ts-ignore
    options) {
        forEach(ruleNames, (ruleName) => {
            // @ts-ignore
            stop(ruleName, options);
        });
    }
    return {
        start,
        stop,
        ruleNames,
        startAll,
        stopAll,
    };
}
// ---------------------------------------------------
// Make Rule Makers
// ---------------------------------------------------
export function makeRuleMaker(storeName, storeItemName, storyProperty, stepName, getUsefulParams) {
    const ruleName = `customRuleFor_${storeName}_${storyProperty}${Math.random()}`;
    function newRuleMaker(callBacksObject) {
        return makeRules(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulStoryStuff = getUsefulParams?.();
                    const latestValue = getState()[storeName][storeItemName][storyProperty];
                    callBacksObject[latestValue]?.(usefulStoryStuff);
                },
                check: {
                    prop: [storyProperty],
                    name: storeItemName,
                    type: storeName,
                },
                step: stepName ?? "default",
                atStepEnd: true,
                name: ruleName,
            }),
        }));
    }
    return newRuleMaker;
}
export function makeLeaveRuleMaker(storeName, storeItemName, storyProperty, stepName, getUsefulParams) {
    const ruleName = `customRuleFor_${storeName}_${storyProperty}${Math.random()}`;
    function newRuleMaker(callBacksObject) {
        return makeRules(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulStoryStuff = getUsefulParams?.();
                    const prevValue = getPrevState()[storeName][storeItemName][storyProperty];
                    callBacksObject[prevValue]?.(usefulStoryStuff);
                },
                check: {
                    prop: [storyProperty],
                    name: storeItemName,
                    type: storeName,
                },
                step: stepName ?? "default",
                atStepEnd: true,
                name: ruleName,
            }),
        }));
    }
    return newRuleMaker;
}
// makeNestedRuleMaker, similar to makeRuleMaker but accepts parameters for two store properties (can be from different stores) , and the callback fires when properties of both stores change
export function makeNestedRuleMaker(storeInfo1, storeInfo2, stepName, getUsefulParams) {
    const [storeName1, storeItemName1, storyProperty1] = storeInfo1;
    const [storeName2, storeItemName2, storyProperty2] = storeInfo2;
    const ruleName = `customRuleFor_${storeName1}_${storyProperty1}_${storeName2}_${storyProperty2}${Math.random()}`;
    function newRuleMaker(callBacksObject) {
        return makeRules(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulStoryStuff = getUsefulParams?.();
                    const latestValue1 = getState()[storeName1][storeItemName1][storyProperty1];
                    const latestValue2 = getState()[storeName2][storeItemName2][storyProperty2];
                    callBacksObject[latestValue1]?.[latestValue2]?.(usefulStoryStuff);
                },
                check: [
                    { prop: [storyProperty1], name: storeItemName1, type: storeName1 },
                    { prop: [storyProperty2], name: storeItemName2, type: storeName2 },
                ],
                step: stepName ?? "default",
                atStepEnd: true,
                name: ruleName,
            }),
        }));
    }
    return newRuleMaker;
}
// makeNestedLeaveRuleMaker, the same as makeNestedRuleMaker , but the callback fires when the properties of both stores become NOT the specified values, but were previously
export function makeNestedLeaveRuleMaker(storeInfo1, storeInfo2, stepName, getUsefulParams) {
    const [storeName1, storeItemName1, storyProperty1] = storeInfo1;
    const [storeName2, storeItemName2, storyProperty2] = storeInfo2;
    const ruleName = `customLeaveRuleFor_${storeName1}_${storyProperty1}_${storeName2}_${storyProperty2}${Math.random()}`;
    function newRuleMaker(callBacksObject) {
        return makeRules(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulParams = getUsefulParams?.();
                    const latestValue1 = getState()[storeName1][storeItemName1][storyProperty1];
                    const latestValue2 = getState()[storeName2][storeItemName2][storyProperty2];
                    const prevValue1 = getPrevState()[storeName1][storeItemName1][storyProperty1];
                    const prevValue2 = getPrevState()[storeName2][storeItemName2][storyProperty2];
                    const callback = callBacksObject[prevValue1]?.[prevValue2];
                    if (callback)
                        callback(usefulParams);
                },
                check: [
                    { prop: [storyProperty1], name: storeItemName1, type: storeName1 },
                    { prop: [storyProperty2], name: storeItemName2, type: storeName2 },
                ],
                step: stepName ?? "default",
                atStepEnd: true,
                name: ruleName,
            }),
        }));
    }
    return newRuleMaker;
}
