import meta, { toSafeListenerName, initialRecordedChanges, } from "./meta";
import { getRepondStructureFromDefaults } from "./getStructureFromDefaults";
import makeCopyStatesFunction from "./copyStates";
import makeGetStatesDiffFunction, { createDiffInfo } from "./getStatesDiff";
import { breakableForEach, forEach } from "chootils/dist/loops";
import { _addItem, _removeItem, _setState, runWhenStartingRepondListeners, runWhenStoppingRepondListeners, } from "./setting";
import { makeRefsStructureFromRepondState, cloneObjectWithJson, asArray, toSafeArray, } from "./utils";
import { useLayoutEffect, useState, useCallback, useEffect, useRef, } from "react";
import { addItemToUniqueArray, removeItemFromArray, getUniqueArrayItems, } from "chootils/dist/arrays";
import { createRecordedChanges } from "./updating";
/*

, T_ItemType, T_State

,
T_ItemType extends string | number | symbol,
T_State extends Record<any, any>,
T_Refs extends Record<any, any>,
T_StepName extends string,

*/
export function initRepond(allInfo, extraOptions) {
    const { dontSetMeta } = extraOptions ?? {};
    const itemTypes = Object.keys(allInfo);
    const stepNamesUntyped = extraOptions?.stepNames
        ? [...extraOptions.stepNames]
        : ["default"];
    if (!stepNamesUntyped.includes("default"))
        stepNamesUntyped.push("default");
    const stepNames = [...stepNamesUntyped];
    meta.frameRateTypeOption = extraOptions?.framerate || "auto";
    if (meta.frameRateTypeOption === "full")
        meta.frameRateType = "full";
    else if (meta.frameRateTypeOption === "half")
        meta.frameRateType = "half";
    else if (meta.frameRateTypeOption === "auto")
        meta.frameRateType = "full";
    if (!dontSetMeta) {
        meta.stepNames = stepNames;
        meta.currentStepIndex = 0;
        meta.currentStepName = stepNames[meta.currentStepIndex];
    }
    // ReturnType<T_AllInfo[K_Type]["state"]> //
    const defaultStates = itemTypes.reduce((prev, key) => {
        prev[key] = allInfo[key].state;
        return prev;
    }, {});
    const defaultRefs = itemTypes.reduce((prev, key) => {
        prev[key] = allInfo[key].refs;
        return prev;
    }, {});
    const initialState = itemTypes.reduce((prev, key) => {
        prev[key] =
            allInfo[key].startStates || {};
        meta.itemNamesByItemType[key] = Object.keys(prev[key]);
        return prev;
    }, {});
    // ------------------------------------------------
    // Setup Repond
    // ------------------------------------------------
    if (!dontSetMeta) {
        const currentState = cloneObjectWithJson(initialState);
        const previousState = cloneObjectWithJson(initialState);
        // store initialState and set currentState
        meta.initialState = initialState;
        meta.currentState = currentState;
        meta.previousState = previousState;
        meta.defaultStateByItemType = defaultStates;
        meta.defaultRefsByItemType = defaultRefs;
        getRepondStructureFromDefaults(); // sets itemTypeNames and propertyNamesByItemType
        makeRefsStructureFromRepondState(); // sets currenRepondRefs based on itemNames from repond state
        meta.copyStates = makeCopyStatesFunction();
        meta.getStatesDiff = makeGetStatesDiffFunction();
        meta.mergeStates = makeCopyStatesFunction("merge");
        createRecordedChanges(meta.recordedDeriveChanges);
        createRecordedChanges(meta.recordedSubscribeChanges);
        createDiffInfo(meta.diffInfo);
    }
    return {
        getPreviousState,
        getState,
        setState,
        onNextTick,
        getRefs,
        getItem,
        makeRules,
        makeDynamicRules,
        makeRuleMaker,
        makeLeaveRuleMaker,
        makeNestedRuleMaker,
        makeNestedLeaveRuleMaker,
        startEffect,
        startItemEffect,
        stopEffect,
        useStore,
        useStoreEffect,
        useStoreItem,
        useStoreItemEffect,
        useStoreItemPropsEffect,
        addItem,
        removeItem,
        // patches and diffs
        makeEmptyPatch,
        makeEmptyDiff,
        applyPatch,
        applyPatchHere,
        getPatch,
        getPatchAndReversed,
        getReversePatch,
        combineTwoPatches,
        combinePatches,
        makeMinimalPatch,
        removePartialPatch,
        getDiff,
        getDiffFromPatches,
        getPatchesFromDiff,
        combineTwoDiffs,
        combineDiffs,
    };
}
// -----------------------------------------------------------------
// main functions
// -----------------------------------------------------------------
const getDefaultStates = () => meta.defaultStateByItemType;
const getDefaultRefs = () => meta.defaultRefsByItemType;
const getItemTypes = () => meta.itemTypeNames;
const getState = () => meta.currentState;
const setState = (newState, callback) => _setState(newState, callback);
function onNextTick(callback) {
    meta.callbacksQue.push(callback); // NOTE WARNING This used to be callforwardsQue
}
const getPreviousState = () => meta.previousState;
const getRefs = () => meta.currentRefs;
// -------------------------------------------------------
// utils
// -------------------------------------------------------
// Convert an itemEffect callback to a regular effect callback
// NOTE: not typed but only internal
function itemEffectCallbackToEffectCallback({ itemType, itemNames, propertyNames, whatToDo, becomes, }) {
    const editedItemTypes = asArray(itemType);
    let allowedItemNames = undefined;
    if (itemNames) {
        allowedItemNames = {};
        forEach(itemNames, (loopedItemName) => {
            if (allowedItemNames) {
                allowedItemNames[loopedItemName] = true;
            }
        });
    }
    return (diffInfo, frameDuration, skipChangeCheck) => {
        // if skipChangeCheck is true, it will run the whatToDo function regardless of the changes
        if (skipChangeCheck) {
            if (itemNames) {
                forEach(editedItemTypes, (theItemType) => {
                    const prevItemsState = getPreviousState()[theItemType];
                    const itemsState = getState()[theItemType];
                    const itemsRefs = getRefs()[theItemType];
                    forEach(itemNames, (loopedItemName) => {
                        breakableForEach(propertyNames, (thePropertyName) => {
                            const newValue = itemsState[loopedItemName][thePropertyName];
                            whatToDo({
                                itemName: itemNames,
                                newValue,
                                previousValue: prevItemsState[loopedItemName][thePropertyName],
                                itemState: itemsState[loopedItemName],
                                itemRefs: itemsRefs[loopedItemName],
                                frameDuration,
                            });
                            return true; // break out of the loop, so it only runs once
                        });
                    });
                });
            }
            return true; // return early if skipChangeCheck was true
        }
        forEach(editedItemTypes, (theItemType) => {
            const prevItemsState = getPreviousState()[theItemType];
            const itemsState = getState()[theItemType];
            const itemsRefs = getRefs()[theItemType];
            forEach(diffInfo.itemsChanged[theItemType], (itemNameThatChanged) => {
                if (!(!allowedItemNames ||
                    (allowedItemNames &&
                        allowedItemNames[itemNameThatChanged])))
                    return;
                breakableForEach(propertyNames, (thePropertyName) => {
                    if (!diffInfo.propsChangedBool[theItemType][itemNameThatChanged][thePropertyName])
                        return;
                    const newValue = itemsState[itemNameThatChanged][thePropertyName];
                    let canRunWhatToDo = false;
                    if (becomes === undefined)
                        canRunWhatToDo = true;
                    else if (typeof becomes === "function") {
                        canRunWhatToDo = becomes(newValue, prevItemsState[itemNameThatChanged][thePropertyName]);
                    }
                    else if (becomes === newValue)
                        canRunWhatToDo = true;
                    if (!canRunWhatToDo)
                        return;
                    whatToDo({
                        itemName: itemNameThatChanged,
                        newValue,
                        previousValue: prevItemsState[itemNameThatChanged][thePropertyName],
                        itemState: itemsState[itemNameThatChanged],
                        itemRefs: itemsRefs[itemNameThatChanged],
                        frameDuration,
                    });
                    return true; // break out of the loop, so it only runs once
                });
            });
        });
    };
}
// converts a repond effect to a normalised 'listener', where the names are an array instead of one
function anyChangeRuleACheckToListenerACheck(checkProperty) {
    return {
        names: toSafeArray(checkProperty.name),
        types: checkProperty.type,
        props: checkProperty.prop,
        addedOrRemoved: checkProperty.addedOrRemoved,
    };
}
// converts a conccept effect check to a listener check (where it's an array of checks)
function anyChangeRuleCheckToListenerCheck(checkProperty) {
    if (Array.isArray(checkProperty)) {
        return checkProperty.map((loopedCheckProperty) => anyChangeRuleACheckToListenerACheck(loopedCheckProperty));
    }
    return anyChangeRuleACheckToListenerACheck(checkProperty);
}
// converts a repond effect to a listener
function convertEffectToListener(anyChangeRule) {
    return {
        changesToCheck: anyChangeRuleCheckToListenerCheck(anyChangeRule.check),
        atStepEnd: !!anyChangeRule.atStepEnd,
        name: anyChangeRule.name,
        whatToDo: anyChangeRule.run,
        step: anyChangeRule.step,
    };
}
// --------------------------------------------------------------------
// more utils
// --------------------------------------------------------------------
function normaliseChangesToCheck(changesToCheck) {
    const changesToCheckArray = asArray(changesToCheck);
    return changesToCheckArray.map((loopeChangeToCheck) => ({
        types: toSafeArray(loopeChangeToCheck.types),
        names: loopeChangeToCheck.names,
        props: loopeChangeToCheck.props,
        addedOrRemoved: loopeChangeToCheck.addedOrRemoved,
    }));
}
function _startRepondListener(newListener) {
    const atStepEnd = !!newListener.atStepEnd;
    const phase = atStepEnd ? "subscribe" : "derive";
    const editedListener = {
        name: newListener.name,
        changesToCheck: normaliseChangesToCheck(newListener.changesToCheck),
        whatToDo: newListener.whatToDo,
    };
    if (atStepEnd)
        editedListener.atStepEnd = atStepEnd;
    if (newListener.step)
        editedListener.step = newListener.step;
    runWhenStartingRepondListeners(() => {
        // add the new listener to all listeners and update listenerNamesByTypeByStep
        meta.allListeners[editedListener.name] =
            editedListener;
        meta.listenerNamesByPhaseByStep[phase][editedListener.step ?? "default"] =
            addItemToUniqueArray(meta.listenerNamesByPhaseByStep[phase][editedListener.step ?? "default"] ?? [], editedListener.name);
    });
}
function _stopRepondListener(listenerName) {
    runWhenStoppingRepondListeners(() => {
        const theListener = meta.allListeners[listenerName];
        if (!theListener)
            return;
        const atStepEnd = !!theListener.atStepEnd;
        const phase = atStepEnd ? "subscribe" : "derive";
        const step = theListener.step ?? "default";
        meta.listenerNamesByPhaseByStep[phase][step] = removeItemFromArray(meta.listenerNamesByPhaseByStep[phase][step] ?? [], theListener.name);
        delete meta.allListeners[listenerName];
    });
}
// --------------------------------------------------------------------
// other functions
// --------------------------------------------------------------------
function getItem(type, name) {
    return [
        getState()[type][name],
        getRefs()[type][name],
        getPreviousState()[type][name],
    ];
}
function startEffect(theEffect) {
    let listenerName = theEffect.name || toSafeListenerName("effect");
    // add the required listenerName
    const editedEffect = {
        check: theEffect.check,
        name: listenerName,
        run: theEffect.run,
        atStepEnd: theEffect.atStepEnd,
        step: theEffect.step,
        runAtStart: theEffect.runAtStart,
    };
    if (theEffect.runAtStart) {
        const result = theEffect.run(meta.diffInfo, 16.66666, true /* skipChangeCheck */);
    }
    _startRepondListener(convertEffectToListener(editedEffect));
}
function startItemEffect({ check, run, atStepEnd, name, step, runAtStart, }) {
    let listenerName = name || "unnamedEffect" + Math.random();
    const editedItemTypes = toSafeArray(check.type);
    const editedPropertyNames = toSafeArray(check.prop);
    const editedItemNames = toSafeArray(check.name);
    let editedChangesToCheck = {
        type: editedItemTypes,
        prop: editedPropertyNames,
        name: editedItemNames,
    };
    let runEffect = itemEffectCallbackToEffectCallback({
        itemType: editedItemTypes,
        itemNames: editedItemNames,
        propertyNames: editedPropertyNames ?? [],
        whatToDo: run,
        becomes: check.becomes,
    });
    startEffect({
        atStepEnd,
        name: listenerName,
        check: editedChangesToCheck,
        run: runEffect,
        step,
        runAtStart,
    });
    return listenerName;
}
function stopEffect(listenerName) {
    _stopRepondListener(listenerName);
}
function useStore(whatToReturn, check, hookDeps = []) {
    const [, setTick] = useState(0);
    const rerender = useCallback(() => setTick((tick) => tick + 1), []);
    useEffect(() => {
        const name = toSafeListenerName("reactComponent");
        startEffect({
            atStepEnd: true,
            name,
            check,
            run: rerender,
            runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
        });
        return () => stopEffect(name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps);
    return whatToReturn(meta.currentState);
}
function useStoreEffect(run, check, hookDeps = []) {
    useLayoutEffect(() => {
        const name = toSafeListenerName("useStoreEffect_"); // note could add JSON.stringify(check) for useful listener name
        startEffect({ name, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
        return () => stopEffect(name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps);
}
function useStoreItemEffect(run, check, hookDeps = []) {
    useLayoutEffect(() => {
        const name = toSafeListenerName("useStoreItemEffect_" + JSON.stringify(check));
        startItemEffect({ name, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
        return () => stopEffect(name);
    }, hookDeps.length > 0 ? [...hookDeps, check.name] : [check.name]);
}
// NOTE it automatically supports changing item name, but not item type or props, that needs custom hookDeps
function useStoreItem(itemEffectCallback, check, hookDeps = []) {
    function getInitialState() {
        return {
            itemName: check.name,
            prevItemState: getPreviousState()[check.type][check.name],
            itemState: getState()[check.type][check.name],
            itemRefs: getRefs()[check.type][check.name],
        };
    }
    const didRender = useRef(false);
    const [returnedState, setReturnedState] = useState(getInitialState());
    useLayoutEffect(() => {
        if (didRender.current) {
            setReturnedState(getInitialState());
        }
        const name = toSafeListenerName("useStoreItem"); // note could add JSON.stringify(check) for useful listener name
        startItemEffect({
            name,
            atStepEnd: true,
            check,
            run: (theParameters) => setReturnedState(theParameters),
            runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
        });
        didRender.current = true;
        return () => stopEffect(name);
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    hookDeps.length > 0 ? [...hookDeps, check.name] : [check.name]);
    return itemEffectCallback(returnedState);
}
/*
useStoreItemPropsEffect(
{ position() {}, rotationY() {}, nowAnimation() {} },
{ type: "characters", name: "walker" },
);
*/
function useStoreItemPropsEffect(checkItem, onPropChanges, hookDeps = []) {
    useLayoutEffect(() => {
        const propNameKeys = Object.keys(onPropChanges);
        const namePrefix = toSafeListenerName("useStoreItemPropsEffect"); // note could add checkItem.type and checkItem.name for useful listener name
        forEach(propNameKeys, (loopedPropKey) => {
            const name = namePrefix + loopedPropKey;
            const itemEffectCallback = onPropChanges[loopedPropKey];
            startItemEffect({
                run: itemEffectCallback,
                name,
                check: {
                    type: checkItem.type,
                    name: checkItem.name,
                    prop: loopedPropKey,
                },
                atStepEnd: true,
                step: checkItem.step,
                runAtStart: true, // runAtStart true so it works like useEffect
            });
        });
        return () => {
            forEach(propNameKeys, (loopedPropKey) => {
                const name = namePrefix + loopedPropKey;
                stopEffect(name);
            });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps.length > 0
        ? [...hookDeps, checkItem.name.name]
        : [checkItem.name.name]);
}
function addItem(addItemOptions, callback) {
    _addItem(addItemOptions, callback);
}
function removeItem(itemInfo) {
    _removeItem(itemInfo);
}
function makeEffect(options) {
    return { ...options, _isPerItem: false };
}
function makeItemEffect(options) {
    return { ...options, _isPerItem: true };
}
//
// // NOTE could make options generic and return that
// // type MakeEffect = <K_Type extends T_ItemType>(options: Effect_RuleOptions<K_Type>) => Effect_RuleOptions<K_Type>;
// type MakeEffect = <K_Type extends T_ItemType>(
//   options: Effect_RuleOptions<K_Type>
// ) => Effect_RuleOptions<K_Type>;
//
// // type MakeItemEffect = <K_Type extends T_ItemType, K_PropertyName extends G_PropertyName[K_Type]>(options: ItemEffect_RuleOptions<K_Type, K_PropertyName>) => ItemEffect_RuleOptions<K_Type, K_PropertyName>;
// type MakeItemEffect = <
//   K_Type extends T_ItemType,
//   K_PropertyName extends PropertyName<K_Type>
// >(
//   options: ItemEffect_RuleOptions<K_Type, K_PropertyName>
// ) => ItemEffect_RuleOptions<K_Type, K_PropertyName>;
// type MakeRule_Utils = {
//   itemEffect: MakeItemEffect;
//   effect: MakeEffect;
// };
function makeRules(rulesToAdd) {
    // type RuleName = keyof ReturnType<typeof rulesToAdd>;
    const editedRulesToAdd = rulesToAdd({
        itemEffect: makeItemEffect,
        effect: makeEffect,
    });
    const ruleNames = Object.keys(editedRulesToAdd);
    const ruleNamePrefix = toSafeListenerName("makeRules");
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
            startItemEffect(theRule);
        }
        else {
            startEffect(theRule);
        }
    }
    function stop(ruleName) {
        if (editedRulesToAdd[ruleName]) {
            stopEffect(ruleNamePrefix + ruleName);
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
            const prevItemsState = getPreviousState()[itemType];
            const itemsRefs = getRefs()[itemType];
            forEach(itemNames, (itemName) => {
                forEach(propNames, (propName) => {
                    const newValue = itemsState[itemName][propName];
                    theRule.run({
                        itemName: itemName,
                        newValue,
                        previousValue: prevItemsState[itemName][propName],
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
//   K_PropertyName extends PropertyName<K_Type>,
//   T_Options extends any
// >(
//   theRule: (
//     options: T_Options
//   ) => ItemEffect_RuleOptions<K_Type, K_PropertyName>
// ) => (options: T_Options) => ItemEffect_RuleOptions<K_Type, K_PropertyName>;
function makeDynamicRules(rulesToAdd) {
    const allRules = rulesToAdd({
        itemEffect: makeDynamicItemEffectInlineFunction,
        effect: makeDynamicEffectInlineFunction,
    });
    const ruleNames = Object.keys(allRules);
    const ruleNamePrefix = `${ruleNames
        .map((loopedName) => loopedName.charAt(0))
        .join("")}`;
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
                startItemEffect(editedRuleObject);
            }
            else {
                startEffect(editedRuleObject);
            }
        }
    }
    function stop(ruleName, 
    // @ts-ignore
    options) {
        const theRuleFunction = allRules[ruleName];
        if (theRuleFunction && typeof theRuleFunction === "function") {
            const foundOrMadeRuleName = theRuleFunction(options)?.name || getWholeRuleName(ruleName, options);
            stopEffect(foundOrMadeRuleName);
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
function makeRuleMaker(storeName, storeItemName, storyProperty, stepName, getUsefulParams) {
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
function makeLeaveRuleMaker(storeName, storeItemName, storyProperty, stepName, getUsefulParams) {
    const ruleName = `customRuleFor_${storeName}_${storyProperty}${Math.random()}`;
    function newRuleMaker(callBacksObject) {
        return makeRules(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulStoryStuff = getUsefulParams?.();
                    const prevValue = getPreviousState()[storeName][storeItemName][storyProperty];
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
function makeNestedRuleMaker(storeInfo1, storeInfo2, stepName, getUsefulParams) {
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
function makeNestedLeaveRuleMaker(storeInfo1, storeInfo2, stepName, getUsefulParams) {
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
                    const prevValue1 = getPreviousState()[storeName1][storeItemName1][storyProperty1];
                    const prevValue2 = getPreviousState()[storeName2][storeItemName2][storyProperty2];
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
function makeEmptyPatch() {
    return {
        changed: {},
        added: {},
        removed: {},
    };
}
function makeEmptyDiff() {
    return {
        changedNext: {},
        changedPrev: {},
        added: {},
        removed: {},
    };
}
function makeEmptyDiffInfo() {
    const emptyDiffInfo = {
        itemTypesChanged: [],
        itemsChanged: { all__: [] },
        propsChanged: {},
        itemsAdded: { all__: [] },
        itemsRemoved: { all__: [] },
        itemTypesChangedBool: {},
        itemsChangedBool: {},
        propsChangedBool: {},
        itemsAddedBool: {},
        itemsRemovedBool: {},
    };
    createDiffInfo(emptyDiffInfo);
    return emptyDiffInfo;
}
function applyPatch(patch) {
    const itemTypes = getItemTypes();
    forEach(itemTypes, (itemType) => {
        // Loop through removed items, and run removeRepondItem()
        forEach(patch.removed[itemType] ?? [], (itemName) => removeItem({ type: itemType, name: itemName }));
        // Loop through added items and run addRepondItem()
        forEach(patch.added[itemType] ?? [], (itemName) => addItem({
            type: itemType,
            name: itemName,
            state: patch.changed?.[itemType]?.[itemName],
        }));
    });
    // run setState(patch.changed)
    setState(patch.changed);
}
function applyPatchHere(newStates, patch) {
    const itemTypes = getItemTypes();
    const defaultStates = getDefaultStates();
    forEach(itemTypes, (itemType) => {
        // Loop through each removed item, and delete it from newStates
        forEach(patch.removed[itemType] ?? [], (itemName) => {
            const itemTypeState = newStates[itemType];
            if (itemTypeState && itemTypeState[itemName]) {
                delete itemTypeState[itemName];
            }
        });
        // Loop through each new item, and add it to newStates with state(itemName)
        forEach(patch.added[itemType] ?? [], (itemName) => {
            if (!newStates[itemType]) {
                newStates[itemType] = {};
            }
            const itemTypeState = newStates[itemType];
            if (itemTypeState) {
                if (itemTypeState[itemName] === undefined) {
                    itemTypeState[itemName] = defaultStates[itemType](itemName);
                }
            }
            if (itemTypeState && itemTypeState[itemName]) {
                delete itemTypeState[itemName];
            }
        });
        // Loop through each changed items and set the properties in newState
        const changedItemsForType = patch.changed[itemType];
        if (changedItemsForType !== undefined) {
            const changedItemNames = Object.keys(changedItemsForType);
            forEach(changedItemNames, (itemName) => {
                const changedPropertiesForItem = changedItemsForType[itemName];
                const itemTypeState = newStates[itemType];
                if (changedPropertiesForItem !== undefined &&
                    itemTypeState !== undefined) {
                    const itemNameState = itemTypeState[itemName];
                    if (itemNameState !== undefined) {
                        const changePropertyNames = Object.keys(changedPropertiesForItem);
                        forEach(changePropertyNames, (propertyName) => {
                            itemTypeState[itemName] = changedPropertiesForItem[propertyName];
                        });
                    }
                }
            });
        }
    });
}
function getPatchOrDiff(prevState, newState, patchOrDiff) {
    const itemTypes = getItemTypes();
    const defaultStates = getDefaultStates();
    const newPatch = makeEmptyPatch();
    const tempDiffInfo = makeEmptyDiffInfo();
    const tempManualUpdateChanges = initialRecordedChanges();
    try {
        meta.getStatesDiff(newState, // currentState
        prevState, // previousState
        tempDiffInfo, tempManualUpdateChanges, // manualUpdateChanges
        true // checkAllChanges
        );
    }
    catch (error) {
        console.log("Error");
        console.log(error);
    }
    // Then can use tempDiffInfo to make the patch (with items removed etc)
    forEach(itemTypes, (itemType) => {
        // Add added and removed with itemsAdded and itemsRemoved
        if (tempDiffInfo.itemsAdded[itemType] &&
            tempDiffInfo.itemsAdded[itemType].length > 0) {
            newPatch.added[itemType] = tempDiffInfo.itemsAdded[itemType];
        }
        if (tempDiffInfo.itemsRemoved[itemType] &&
            tempDiffInfo.itemsRemoved[itemType].length > 0) {
            newPatch.removed[itemType] = tempDiffInfo.itemsRemoved[itemType];
        }
    });
    // To add changed
    // Loop through items changes, then itemNamesChanged[itemType] then
    // propsChanged[itemType][itemName]
    // And set the changed to the value in newState
    forEach(tempDiffInfo.itemTypesChanged, (itemType) => {
        if (!newPatch.changed[itemType]) {
            newPatch.changed[itemType] = {};
        }
        const patchChangesForItemType = newPatch.changed[itemType];
        if (patchChangesForItemType) {
            forEach(tempDiffInfo.itemsChanged[itemType], (itemName) => {
                if (!patchChangesForItemType[itemName]) {
                    patchChangesForItemType[itemName] = {};
                }
                const patchChangesForItemName = patchChangesForItemType[itemName];
                if (patchChangesForItemName) {
                    const propsChangedForType = tempDiffInfo.propsChanged[itemType];
                    forEach(propsChangedForType[itemName], (propertyName) => {
                        patchChangesForItemName[propertyName] =
                            newState?.[itemType]?.[itemName]?.[propertyName];
                    });
                }
            });
        }
    });
    // Need to also add non-default properties for new items to changed
    // For each item added,
    // const defaultState = defaultStates[itemType](itemName)
    // const newState = newState[itemType][itemName]
    // Loop through each property and compare
    // If they’re different, add it to the changed object
    forEach(itemTypes, (itemType) => {
        if (newPatch?.added[itemType]?.length) {
            const itemNamesAddedForType = newPatch.added[itemType];
            const newItemTypeState = newState[itemType];
            let propertyNamesForItemType = [];
            let propertyNamesHaveBeenFound = false;
            forEach(itemNamesAddedForType ?? [], (itemName) => {
                const defaultItemState = defaultStates[itemType](itemName);
                const addedItemState = newItemTypeState?.[itemName];
                if (!propertyNamesHaveBeenFound) {
                    propertyNamesForItemType = Object.keys(defaultItemState);
                    propertyNamesHaveBeenFound = true;
                }
                if (addedItemState) {
                    forEach(propertyNamesForItemType, (propertyName) => {
                        const defaultPropertyValue = defaultItemState[propertyName];
                        const newPropertyValue = addedItemState?.[propertyName];
                        if (defaultPropertyValue !== undefined &&
                            newPropertyValue !== undefined) {
                            let valuesAreTheSame = defaultPropertyValue === newPropertyValue;
                            if (typeof newPropertyValue === "object") {
                                valuesAreTheSame =
                                    JSON.stringify(defaultPropertyValue) ===
                                        JSON.stringify(newPropertyValue);
                            }
                            if (!valuesAreTheSame) {
                                if (!newPatch.changed[itemType]) {
                                    newPatch.changed[itemType] = {};
                                }
                                const newPatchChangedForItemType = newPatch.changed[itemType];
                                if (newPatchChangedForItemType) {
                                    if (!newPatchChangedForItemType[itemName]) {
                                        newPatchChangedForItemType[itemName] = {};
                                    }
                                    const newPatchChangedForItemName = newPatchChangedForItemType[itemName];
                                    if (newPatchChangedForItemName) {
                                        newPatchChangedForItemName[propertyName] = newPropertyValue;
                                    }
                                }
                            }
                        }
                    });
                }
            });
        }
    });
    if (patchOrDiff === "patch") {
        return newPatch;
    }
    const newDiff = makeEmptyDiff();
    newDiff.added = newPatch.added;
    newDiff.removed = newPatch.removed;
    newDiff.changedNext = newPatch.changed;
    // Need to also add non-default properties for removed items to changedPrev
    // For each item removed,
    // const defaultState = defaultStates[itemType](itemName)
    // const newState = prevState[itemType][itemName]
    // Loop through each property and compare
    // If they’re different, add it to the changedPrev object
    // (same as for added, but instead of adding to newPatch.changed, it's to newDiff.changedPrev, and checking the prevState)
    forEach(itemTypes, (itemType) => {
        if (newDiff.removed[itemType]?.length) {
            const itemNamesRemovedForType = newDiff.removed[itemType];
            const prevItemTypeState = prevState[itemType];
            let propertyNamesForItemType = [];
            let propertyNamesHaveBeenFound = false;
            forEach(itemNamesRemovedForType ?? [], (itemName) => {
                const defaultItemState = defaultStates[itemType](itemName);
                const removedItemState = prevItemTypeState?.[itemName];
                if (!propertyNamesHaveBeenFound) {
                    propertyNamesForItemType = Object.keys(defaultItemState);
                    propertyNamesHaveBeenFound = true;
                }
                if (removedItemState) {
                    forEach(propertyNamesForItemType, (propertyName) => {
                        const defaultPropertyValue = defaultItemState[propertyName];
                        const newPropertyValue = removedItemState?.[propertyName];
                        if (defaultPropertyValue !== undefined &&
                            newPropertyValue !== undefined) {
                            let valuesAreTheSame = removedItemState[propertyName] === newPropertyValue;
                            if (typeof newPropertyValue === "object") {
                                valuesAreTheSame =
                                    JSON.stringify(defaultPropertyValue) ===
                                        JSON.stringify(newPropertyValue);
                            }
                            if (!valuesAreTheSame) {
                                if (!newDiff.changedPrev[itemType]) {
                                    newDiff.changedPrev[itemType] = {};
                                }
                                const newDiffChangedForItemType = newDiff.changedPrev[itemType];
                                if (newDiffChangedForItemType) {
                                    if (!newDiffChangedForItemType[itemName]) {
                                        newDiffChangedForItemType[itemName] = {};
                                    }
                                    const newDiffChangedForItemName = newDiffChangedForItemType[itemName];
                                    if (newDiffChangedForItemName) {
                                        newDiffChangedForItemName[propertyName] = newPropertyValue;
                                    }
                                }
                            }
                        }
                    });
                }
            });
        }
    });
    return newDiff;
}
function getPatch(prevState, newState) {
    return getPatchOrDiff(prevState, newState, "patch");
}
function getPatchAndReversed(prevState, newState) {
    const patch = getPatch(prevState, newState);
    const reversePatch = getPatch(newState, prevState);
    return [patch, reversePatch];
}
function getReversePatch(partialState, newPatch) {
    const prevState = {};
    meta.copyStates(partialState, prevState);
    const newState = {};
    meta.copyStates(partialState, newState);
    applyPatchHere(newState, newPatch);
    const reversePatch = getPatch(newState, prevState);
    return reversePatch;
}
function combineTwoPatches(prevPatch, newPatch) {
    const itemTypes = getItemTypes();
    const combinedPatch = makeEmptyPatch();
    //
    forEach(itemTypes, (itemType) => {
        // combine added and removed , and remove duplicates
        const itemsAddedPrev = prevPatch.added[itemType];
        const itemsAddedNew = newPatch.added[itemType];
        const hasAddedItems = itemsAddedPrev?.length || itemsAddedNew?.length;
        if (hasAddedItems) {
            combinedPatch.added[itemType] = getUniqueArrayItems([
                ...(itemsAddedPrev ?? []),
                ...(itemsAddedNew ?? []),
            ]);
        }
        const itemsRemovedPrev = prevPatch.removed[itemType];
        const itemsRemovedNew = newPatch.removed[itemType];
        const hasRemovedItems = (itemsRemovedPrev && itemsRemovedPrev.length > 0) ||
            (itemsRemovedNew && itemsRemovedNew.length > 0);
        if (hasRemovedItems) {
            combinedPatch.removed[itemType] = getUniqueArrayItems([
                ...(itemsRemovedPrev ?? []),
                ...(itemsRemovedNew ?? []),
            ]);
        }
        // Anything in removed in prev that was added in new, removed from removed
        if (itemsRemovedPrev && itemsAddedNew) {
            combinedPatch.removed[itemType] = combinedPatch.removed[itemType].filter((itemName) => {
                if (itemsRemovedPrev.includes(itemName) &&
                    itemsAddedNew.includes(itemName)) {
                    return false;
                }
                return true;
            });
        }
        // Anything in removed in new that was added in prev, removed from added
        if (itemsRemovedNew && itemsAddedPrev) {
            combinedPatch.added[itemType] = combinedPatch.added[itemType].filter((itemName) => {
                if (itemsRemovedNew.includes(itemName) &&
                    itemsAddedPrev.includes(itemName)) {
                    return false;
                }
                return true;
            });
        }
        // Merge changes
        const itemsChangedPrev = prevPatch.changed[itemType];
        const itemsChangedNew = prevPatch.changed[itemType];
        const hasChangedItems = itemsChangedPrev || itemsChangedNew;
        if (hasChangedItems) {
            const allChangedItemNames = Object.keys({
                ...(itemsChangedPrev ?? {}),
                ...(itemsChangedNew ?? {}),
            });
            if (!combinedPatch.changed[itemType]) {
                combinedPatch.changed[itemType] = {};
            }
            const combinedPatchChangedForItemType = combinedPatch.changed[itemType];
            if (combinedPatchChangedForItemType) {
                forEach(allChangedItemNames, (itemName) => {
                    const combinedPatchChangedForItemName = combinedPatchChangedForItemType[itemName];
                    combinedPatchChangedForItemType[itemName] = {
                        ...(itemsChangedPrev?.[itemName] ?? {}),
                        ...(itemsChangedNew?.[itemName] ?? {}),
                    };
                });
                // Remove any item changes that are in removed
                forEach(combinedPatch.removed[itemType] ?? [], (itemName) => {
                    if (combinedPatchChangedForItemType[itemName]) {
                        delete combinedPatchChangedForItemType[itemName];
                    }
                });
            }
        }
    });
    return combinedPatch;
}
function combinePatches(patchesArray) {
    let combinedPatches = patchesArray[0];
    forEach(patchesArray, (loopedPatch, index) => {
        const currentPatch = combinedPatches;
        const nextPatch = patchesArray[index + 1];
        if (nextPatch) {
            combinedPatches = combineTwoPatches(currentPatch, nextPatch);
        }
    });
    return combinedPatches;
}
function makeMinimalPatch(currentStates, thePatch) {
    const itemTypes = getItemTypes();
    const defaultStates = getDefaultStates();
    const minimalPatch = cloneObjectWithJson(thePatch);
    // Loop through the changed items, and each changed property
    forEach(itemTypes, (itemType) => {
        const propertyNames = Object.keys(defaultStates[itemType]("anItemName"));
        const changedForType = minimalPatch.changed[itemType];
        if (changedForType) {
            const changedItemNames = Object.keys(changedForType ?? {});
            forEach(changedItemNames, (itemName) => {
                const changedForItem = changedForType[itemName];
                const itemState = currentStates?.[itemType]?.[itemName];
                if (changedForItem && itemState) {
                    forEach(propertyNames, (propertyName) => {
                        // If the value’s the same as state, remove that change property
                        if (changedForItem[propertyName] === itemState[propertyName]) {
                            delete changedForItem[propertyName];
                        }
                    });
                }
                // (if the item has no more properties, remove that changed item)
                const changedPropertyNames = Object.keys(changedForItem ?? {});
                if (changedPropertyNames.length === 0) {
                    delete changedForType[itemName];
                }
            });
        }
        // Loop through the added items, if the item already exists in state, remove it from added
        if (minimalPatch.added[itemType]) {
            minimalPatch.added[itemType] = minimalPatch.added[itemType].filter((itemName) => !!currentStates?.[itemType]?.[itemName]);
        }
        // Loop through the removed items, if the item doesn’t exist in state, remove it from removed
        if (minimalPatch.removed[itemType]) {
            minimalPatch.removed[itemType] = minimalPatch.removed[itemType].filter((itemName) => !currentStates?.[itemType]?.[itemName]);
        }
    });
}
function removePartialPatch(thePatch, patchToRemove) {
    const newPatch = cloneObjectWithJson(thePatch);
    const itemTypes = getItemTypes();
    forEach(itemTypes, (itemType) => {
        // Loop through removed in patchToRemove, if it’s in newPatch , remove it
        if (newPatch.removed[itemType]) {
            newPatch.removed[itemType] = newPatch.removed[itemType].filter((itemName) => !patchToRemove.removed[itemType].includes(itemName));
        }
        // Loop through added in patchToRemove, if it’s in newPatch , remove it
        // Keep track of noLongerAddedItems { itemType: []
        const noLongerAddedItems = [];
        if (newPatch.added[itemType]) {
            newPatch.added[itemType] = newPatch.added[itemType].filter((itemName) => {
                const shouldKeep = !patchToRemove.added[itemType].includes(itemName);
                if (!shouldKeep) {
                    noLongerAddedItems.push(itemName);
                }
                return shouldKeep;
            });
        }
        // Loop through changed items, if the same change is in patchToRemove and newPatch, remove it from new patch
        const removedPatchChangedForType = patchToRemove.changed[itemType];
        const newPatchChangedForType = newPatch.changed[itemType];
        if (removedPatchChangedForType && newPatchChangedForType) {
            const changedItemNames = Object.keys(removedPatchChangedForType ?? {});
            forEach(changedItemNames, (itemName) => {
                const removedPatchChangedForItem = removedPatchChangedForType[itemName];
                const newPatchChangedForItem = newPatchChangedForType[itemName];
                if (removedPatchChangedForItem && newPatchChangedForItem) {
                    // (if the item has no more properties, remove that changed item)
                    const removedPatchChangedPropertyNames = Object.keys(removedPatchChangedForItem ?? {});
                    forEach(removedPatchChangedPropertyNames, (propertyName) => {
                        if (JSON.stringify(removedPatchChangedForItem[propertyName]) ===
                            JSON.stringify(newPatchChangedForItem[propertyName])) {
                            delete newPatchChangedForItem[propertyName];
                        }
                    });
                }
                const changedPropertyNamesB = Object.keys(removedPatchChangedForItem ?? {});
                // If there's no more property changes for an item name, or that item isn't added anymore, then remove it from changes
                const noMorePropertyChanges = changedPropertyNamesB.length === 0;
                if (noMorePropertyChanges || noLongerAddedItems.includes(itemName)) {
                    delete newPatchChangedForType[itemName];
                }
            });
        }
    });
}
function getDiff(prevState, newState) {
    return getPatchOrDiff(prevState, newState, "diff");
}
function getDiffFromPatches(forwardPatch, reversePatch) {
    const newDiff = makeEmptyDiff();
    newDiff.added = forwardPatch.added;
    newDiff.removed = forwardPatch.removed;
    newDiff.changedNext = forwardPatch.changed;
    newDiff.changedPrev = reversePatch.changed;
    //
    //
    // Maybe if forwardPatch.added/ removed isnt same as backwardPatch removed/added then show warning, but use the forward patch?
    return newDiff;
}
function getPatchesFromDiff(theDiff) {
    const forwardPatch = makeEmptyPatch();
    const reversePatch = makeEmptyPatch();
    forwardPatch.added = theDiff.added;
    forwardPatch.removed = theDiff.removed;
    reversePatch.added = theDiff.removed;
    reversePatch.removed = theDiff.added;
    forwardPatch.changed = theDiff.changedNext;
    reversePatch.changed = theDiff.changedPrev;
    return [forwardPatch, reversePatch];
}
function combineTwoDiffs(prevDiff, newDiff) {
    const [prevForwardPatch, prevReversePatch] = getPatchesFromDiff(prevDiff);
    const [newForwardPatch, newReversePatch] = getPatchesFromDiff(prevDiff);
    const combinedForwardPatch = combineTwoPatches(prevForwardPatch, newForwardPatch);
    const combinedReversePatch = combineTwoPatches(prevReversePatch, newReversePatch);
    return getDiffFromPatches(combinedForwardPatch, combinedReversePatch);
}
function combineDiffs(diffsArray) {
    let combinedDiffs = diffsArray[0];
    forEach(diffsArray, (loopedDiff, index) => {
        const currentDiff = combinedDiffs;
        const nextDiff = diffsArray[index + 1];
        if (nextDiff) {
            combinedDiffs = combineTwoDiffs(currentDiff, nextDiff);
        }
    });
    return combinedDiffs;
}
export { getPreviousState, getState, setState, onNextTick, getRefs, getItem, makeRules, makeDynamicRules, makeRuleMaker, makeLeaveRuleMaker, makeNestedRuleMaker, makeNestedLeaveRuleMaker, startEffect, startItemEffect, stopEffect, useStore, useStoreEffect, useStoreItem, useStoreItemEffect, useStoreItemPropsEffect, addItem, removeItem, 
// patches and diffs
makeEmptyPatch, makeEmptyDiff, applyPatch, applyPatchHere, getPatch, getPatchAndReversed, getReversePatch, combineTwoPatches, combinePatches, makeMinimalPatch, removePartialPatch, getDiff, getDiffFromPatches, getPatchesFromDiff, combineTwoDiffs, combineDiffs, };
