import meta, { toSafeListenerName, initialRecordedChanges, } from "./meta";
import { getConceptoStructureFromDefaults } from "./getStructureFromDefaults";
import makeCopyStatesFunction from "./copyStates";
import makeGetStatesDiffFunction from "./getStatesDiff";
import { breakableForEach, forEach } from "shutils/dist/loops";
import { _addItem, _removeItem, _setState, runWhenStartingConceptoListeners, runWhenStoppingConceptoListeners, } from "./setting";
import { makeRefsStructureFromConceptoState, cloneObjectWithJson, asArray, toSafeArray, } from "./utils";
import { useLayoutEffect, useState, useCallback, useEffect } from "react";
import { addItemToUniqueArray, removeItemFromArray, getUniqueArrayItems, } from "shutils/dist/arrays";
/*

, T_ItemType, T_State

,
T_ItemType extends string | number | symbol,
T_State extends Record<any, any>,
T_Refs extends Record<any, any>,
T_FlowName extends string,

*/
export function _createConcepts(allInfo, extraOptions) {
    const { dontSetMeta } = extraOptions !== null && extraOptions !== void 0 ? extraOptions : {};
    const itemTypes = Object.keys(allInfo);
    const flowNamesUntyped = (extraOptions === null || extraOptions === void 0 ? void 0 : extraOptions.flowNames)
        ? [...extraOptions.flowNames]
        : ["default"];
    if (!flowNamesUntyped.includes("default"))
        flowNamesUntyped.push("default");
    const flowNames = [...flowNamesUntyped];
    if (!dontSetMeta) {
        meta.flowNames = flowNames;
        meta.currentFlowIndex = 0;
        meta.currentFlowName = flowNames[meta.currentFlowIndex];
    }
    // type Get_T_Refs<K_Type extends T_ItemType> = Record<
    //   StartStatesItemName<K_Type>,
    //   ReturnType<Get_DefaultRefs<K_Type>>
    // >;
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
        return prev;
    }, {});
    // ------------------------------------------------
    // Setup Concepto
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
        getConceptoStructureFromDefaults(); // sets itemTypeNames and propertyNamesByItemType
        makeRefsStructureFromConceptoState(); // sets currenConceptoRefs based on itemNames from concepto state
        meta.copyStates = makeCopyStatesFunction();
        meta.getStatesDiff = makeGetStatesDiffFunction();
        meta.mergeStates = makeCopyStatesFunction("merge");
    }
    // --------------------------------------------------------------------------
    // types
    // --------------------------------------------------------------------------
    // type ItemName<K_Type extends T_ItemType> = ExtendsString<
    //   KeysOfUnion<T_State[K_Type]>
    // >;
    //
    // type PropertyName<K_Type extends T_ItemType> = KeysOfUnion<
    //   T_State[K_Type][ItemName<K_Type>]
    // >;
    //
    // type AllProperties = {
    //   [K_Type in T_ItemType]: PropertyName<K_Type>;
    // }[T_ItemType];
    // ----------------------------
    // Diff Info
    //
    // type DiffInfo_PropertiesChanged = {
    //   [K_Type in T_ItemType]: Record<ItemName<K_Type>, PropertyName<K_Type>[]> & {
    //     all__: PropertyName<K_Type>[];
    //   };
    // } & {
    //   all__: AllProperties[];
    // };
    // type DiffInfo_PropertiesChangedBool = {
    //   [K_Type in T_ItemType]: Record<
    //     ItemName<K_Type>,
    //     { [K_PropName in PropertyName<K_Type>]: boolean }
    //   > & { all__: { [K_PropName in PropertyName<K_Type>]: boolean } };
    // } & {
    //   all__: { [K_PropName in AllProperties]: boolean };
    // };
    //
    // type DiffInfo_ItemsChanged = Record<
    //   T_ItemType | "all__",
    //   ItemName<T_ItemType>[]
    // >;
    //
    // type DiffInfo_ItemsChangedBool = Record<
    //   T_ItemType | "all__",
    //   Record<ItemName<T_ItemType>, boolean>
    // >;
    //
    // type DiffInfo = {
    //   itemTypesChanged: T_ItemType[];
    //   itemsChanged: DiffInfo_ItemsChanged;
    //   propsChanged: DiffInfo_PropertiesChanged;
    //   itemsAdded: DiffInfo_ItemsChanged;
    //   itemsRemoved: DiffInfo_ItemsChanged;
    //   itemTypesChangedBool: Record<T_ItemType | "all__", boolean>;
    //   itemsChangedBool: DiffInfo_ItemsChangedBool;
    //   propsChangedBool: DiffInfo_PropertiesChangedBool;
    //   itemsAddedBool: DiffInfo_ItemsChangedBool;
    //   itemsRemovedBool: DiffInfo_ItemsChangedBool;
    // };
    //
    // // ----------------------------
    // //  Listener types
    //
    // type Listener_ACheck_OneItemType<K_Type extends T_ItemType> = {
    //   types?: K_Type;
    //   names?: ItemName<K_Type>[];
    //   props?: PropertyName<K_Type>;
    //   addedOrRemoved?: boolean;
    // };
    //
    // type Listener_ACheck_MultipleItemTypes = {
    //   types?: (keyof T_State)[];
    //   names?: ItemName<T_ItemType>[];
    //   props?: AllProperties[];
    //   addedOrRemoved?: boolean;
    // };
    //
    // // NOTE: the type works, but autocomplete doesn't work ATM when
    // // trying to make properties/addedOrRemoved exclusive
    // // type TestChangeToCheckUnionWithProperties<T, K> = XOR<
    // //   Omit<TestChangeToCheckMultipleItemTypes<T>, "addedOrRemoved">,
    // //   Omit<TestChangeToCheckOneItemType<T, K>, "addedOrRemoved">
    // // >;
    // // type TestChangeToCheckUnionWithoutProperties<T, K> = XOR<
    // //   Omit<TestChangeToCheckMultipleItemTypes<T>, "properties">,
    // //   Omit<TestChangeToCheckOneItemType<T, K>, "properties">
    // // >;
    //
    // // type TestChangeToCheckUnion<T, K> = XOR<
    // //   TestChangeToCheckUnionWithProperties<T, K>,
    // //   TestChangeToCheckUnionWithoutProperties<T, K>
    // // >;
    // type Listener_ACheck<K_Type extends T_ItemType> =
    //   | Listener_ACheck_OneItemType<K_Type>
    //   | Listener_ACheck_MultipleItemTypes;
    // type Listener_Check<K_Type extends T_ItemType> =
    //   | Listener_ACheck<K_Type>[]
    //   | Listener_ACheck<K_Type>;
    //
    // type AddItemOptionsUntyped<
    //   T_State extends Record<any, any>,
    //   T_Refs extends Record<any, any>,
    //   T_TypeName
    // > = {
    //   type: string;
    //   name: string;
    //   state?: Partial<
    //     NonNullable<T_State[T_TypeName]>[keyof T_State[keyof T_State]]
    //   >;
    //   refs?: Partial<NonNullable<T_Refs[T_TypeName]>[keyof T_Refs[keyof T_Refs]]>;
    // };
    //
    // // -----------------
    // // Listeners B
    //
    // type Listener<K_Type extends T_ItemType> = {
    //   name: string;
    //   changesToCheck: Listener_Check<K_Type>;
    //   whatToDo: (diffInfo: DiffInfo, frameDuration: number) => void;
    //   listenerType?: ListenerType;
    //   flow?: T_FlowName;
    // };
    //
    // // After normalizing
    // type ListenerAfterNormalising<K_Type extends T_ItemType> = {
    //   name: string;
    //   changesToCheck: Listener_ACheck<K_Type>[];
    //   whatToDo: (diffInfo: DiffInfo, frameDuration: number) => void;
    //   listenerType?: ListenerType;
    //   flow?: string;
    // };
    //
    // // -----------------
    // //
    //
    // type UseStoreItemParams<K_Type extends T_ItemType> = {
    //   itemName: ItemName<K_Type>;
    //   prevItemState: T_State[K_Type][ItemName<K_Type>];
    //   itemState: T_State[K_Type][ItemName<K_Type>];
    //   // itemRefs: T_Refs[K_Type][keyof T_Refs[K_Type]];
    //   itemRefs: T_Refs[K_Type][ItemName<K_Type>];
    //   // frameDuration: number;
    // };
    // -----------------------------------------------------------------
    // main functions
    // -----------------------------------------------------------------
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
    function itemEffectCallbackToEffectCallback({ theItemType, theItemName, thePropertyNames, whatToDo, becomes, }) {
        const editedItemTypes = asArray(theItemType);
        let allowedItemNames = undefined;
        if (Array.isArray(theItemName)) {
            allowedItemNames = {};
            forEach(theItemName, (loopedItemName) => {
                if (allowedItemNames) {
                    allowedItemNames[loopedItemName] = true;
                }
            });
        }
        return (diffInfo, frameDuration) => {
            forEach(editedItemTypes, (theItemType) => {
                const prevItemsState = getPreviousState()[theItemType];
                const itemsState = getState()[theItemType];
                const itemsRefs = getRefs()[theItemType];
                forEach(diffInfo.itemsChanged[theItemType], (itemNameThatChanged) => {
                    if (!(!allowedItemNames ||
                        (allowedItemNames &&
                            allowedItemNames[itemNameThatChanged])))
                        return;
                    breakableForEach(thePropertyNames, (thePropertyName) => {
                        if (!diffInfo.propsChangedBool[theItemType][itemNameThatChanged][thePropertyName])
                            return;
                        const newValue = itemsState[itemNameThatChanged][thePropertyName];
                        // start the movment animation
                        let canRunWhatToDo = false;
                        if (typeof becomes === "function") {
                            canRunWhatToDo = becomes(newValue, prevItemsState[itemNameThatChanged][thePropertyName]);
                        }
                        else {
                            if (typeof becomes === "string" &&
                                ((becomes === "true" && newValue === true) ||
                                    (becomes === "false" && newValue === false) ||
                                    becomes === "different")) {
                                canRunWhatToDo = true;
                            }
                        }
                        if (!canRunWhatToDo)
                            return;
                        whatToDo({
                            itemName: itemNameThatChanged,
                            newValue,
                            previousValue: prevItemsState[itemNameThatChanged][thePropertyName],
                            itemState: itemsState[itemNameThatChanged],
                            itemRefs: itemsRefs[itemNameThatChanged],
                            frameDuration,
                        }
                        // as IfPropertyChangedWhatToDoParams<T_ItemType>
                        );
                        return true; // break out of the loop, so it only runs once
                    });
                });
            });
        };
    }
    // converts a concepto effect to a normalised 'listener', where the names are an array instead of one
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
    // converts a concepto effect to a listener
    function convertEffectToListener(anyChangeRule) {
        return {
            changesToCheck: anyChangeRuleCheckToListenerCheck(anyChangeRule.check),
            listenerType: anyChangeRule.whenToRun === "subscribe" ? "subscribe" : "derive",
            name: anyChangeRule.name,
            whatToDo: anyChangeRule.onEffect,
            flow: anyChangeRule.flow,
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
    function _startConceptoListener(newListener) {
        const listenerType = newListener.listenerType || "derive";
        const editedListener = {
            name: newListener.name,
            changesToCheck: normaliseChangesToCheck(newListener.changesToCheck),
            whatToDo: newListener.whatToDo,
        };
        if (listenerType === "subscribe") {
            editedListener.listenerType = listenerType;
        }
        if (newListener.flow) {
            editedListener.flow = newListener.flow;
        }
        runWhenStartingConceptoListeners(() => {
            // add the new listener to all listeners and update listenerNamesByTypeByFlow
            var _a, _b, _c;
            meta.allListeners[editedListener.name] = editedListener;
            meta.listenerNamesByTypeByFlow[listenerType][(_a = editedListener.flow) !== null && _a !== void 0 ? _a : "default"] = addItemToUniqueArray((_c = meta.listenerNamesByTypeByFlow[listenerType][(_b = editedListener.flow) !== null && _b !== void 0 ? _b : "default"]) !== null && _c !== void 0 ? _c : [], editedListener.name);
        });
    }
    function _stopConceptoListener(listenerName) {
        runWhenStoppingConceptoListeners(() => {
            var _a, _b, _c;
            const theListener = meta.allListeners[listenerName];
            if (!theListener)
                return;
            const listenerType = (_a = theListener.listenerType) !== null && _a !== void 0 ? _a : "derive";
            const flow = (_b = theListener.flow) !== null && _b !== void 0 ? _b : "default";
            meta.listenerNamesByTypeByFlow[listenerType][flow] = removeItemFromArray((_c = meta.listenerNamesByTypeByFlow[listenerType][flow]) !== null && _c !== void 0 ? _c : [], theListener.name);
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
            onEffect: theEffect.onEffect,
            whenToRun: theEffect.whenToRun,
            flow: theEffect.flow,
        };
        return _startConceptoListener(convertEffectToListener(editedEffect));
    }
    function startItemEffect({ check, onItemEffect, whenToRun, name, flow, }) {
        let listenerName = name || "unnamedEffect" + Math.random();
        if (!name) {
            console.log("used random name");
        }
        const editedItemTypes = toSafeArray(check.type);
        let editedPropertyNames = toSafeArray(check.prop);
        let editedItemNames = toSafeArray(check.name);
        let editedChangesToCheck = {
            type: editedItemTypes,
            prop: editedPropertyNames,
            name: editedItemNames,
        };
        let onEffect = itemEffectCallbackToEffectCallback({
            theItemType: editedItemTypes,
            theItemName: editedItemNames,
            thePropertyNames: editedPropertyNames !== null && editedPropertyNames !== void 0 ? editedPropertyNames : [],
            whatToDo: onItemEffect,
            becomes: check.becomes || "different",
        });
        startEffect({
            whenToRun,
            name: listenerName,
            check: editedChangesToCheck,
            onEffect,
            flow,
        });
        return listenerName;
    }
    function stopEffect(listenerName) {
        _stopConceptoListener(listenerName);
    }
    function useStore(whatToReturn, check, hookDeps = []) {
        const [, setTick] = useState(0);
        const rerender = useCallback(() => setTick((tick) => tick + 1), []);
        useEffect(() => {
            const name = toSafeListenerName("reactComponent");
            startEffect({ whenToRun: "subscribe", name, check, onEffect: rerender });
            return () => stopEffect(name);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, hookDeps);
        return whatToReturn(meta.currentState);
    }
    function useStoreEffect(onEffect, check, hookDeps = []) {
        useLayoutEffect(() => {
            const name = toSafeListenerName("useStoreEffect_"); // note could add JSON.stringify(check) for useful listener name
            startEffect({ name, whenToRun: "subscribe", check, onEffect });
            return () => stopEffect(name);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, hookDeps);
    }
    function useStoreItemEffect(onItemEffect, check, hookDeps = []) {
        useLayoutEffect(() => {
            const name = toSafeListenerName("useStoreItemEffect_" + JSON.stringify(check));
            startItemEffect({ name, whenToRun: "subscribe", check, onItemEffect });
            return () => stopEffect(name);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, hookDeps);
    }
    function useStoreItem(itemEffectCallback, check, hookDeps = []) {
        const [returnedState, setReturnedState] = useState({
            itemName: check.name,
            prevItemState: getPreviousState()[check.type][check.name],
            itemState: getState()[check.type][check.name],
            itemRefs: getRefs()[check.type][check.name],
        });
        // NOTE: could save timeUpdated to state, storing state in a ref, so it could reuse an object? not sure
        // const [timeUpdated, setTimeUpdated] = useState(Date.now());
        useLayoutEffect(() => {
            const name = toSafeListenerName("useStoreItem"); // note could add JSON.stringify(check) for useful listener name
            startItemEffect({
                name,
                whenToRun: "subscribe",
                check,
                onItemEffect: (theParameters) => setReturnedState(theParameters),
            });
            return () => stopEffect(name);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, hookDeps);
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
                    onItemEffect: itemEffectCallback,
                    name,
                    check: {
                        type: checkItem.type,
                        name: checkItem.name,
                        prop: loopedPropKey,
                    },
                    whenToRun: "subscribe",
                    flow: checkItem.flow,
                });
            });
            return () => {
                forEach(propNameKeys, (loopedPropKey) => {
                    const name = namePrefix + loopedPropKey;
                    stopEffect(name);
                });
            };
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, hookDeps);
    }
    function addItem(addItemOptions, callback) {
        _addItem(addItemOptions, callback);
    }
    function removeItem(itemInfo) {
        _removeItem(itemInfo);
    }
    function makeEffect(options) {
        return options;
    }
    function makeItemEffect(options) {
        return options;
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
    function makeRules(rulesToAdd) {
        // type RuleName = keyof ReturnType<typeof rulesToAdd>;
        const editedRulesToAdd = rulesToAdd(makeItemEffect, makeEffect);
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
            if (theRule.onEffect !== undefined) {
                startEffect(theRule);
            }
            else {
                startItemEffect(theRule);
            }
        }
        function stop(ruleName) {
            if (editedRulesToAdd[ruleName]) {
                stopEffect(ruleNamePrefix + ruleName);
            }
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
        };
    }
    // -----------------
    // make rules dynamic
    function makeDynamicEffectInlineFunction(theRule) {
        return theRule;
    }
    function makeDynamicItemEffectInlineFunction(theRule) {
        return theRule;
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
        const allRules = rulesToAdd(makeDynamicItemEffectInlineFunction, makeDynamicEffectInlineFunction);
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
                if (editedRuleObject.onEffect !== undefined) {
                    startEffect(editedRuleObject);
                }
                else {
                    startItemEffect(editedRuleObject);
                }
            }
        }
        function stop(ruleName, 
        // @ts-ignore
        options) {
            var _a;
            const theRuleFunction = allRules[ruleName];
            if (theRuleFunction && typeof theRuleFunction === "function") {
                const foundOrMadeRuleName = ((_a = theRuleFunction(options)) === null || _a === void 0 ? void 0 : _a.name) || getWholeRuleName(ruleName, options);
                stopEffect(foundOrMadeRuleName);
            }
            else {
                console.log("hmm no rule for ", ruleName);
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
        return {
            itemTypesChanged: [],
            itemsChanged: {},
            propsChanged: {},
            itemsAdded: {},
            itemsRemoved: {},
            itemTypesChangedBool: {},
            itemsChangedBool: {},
            propsChangedBool: {},
            itemsAddedBool: {},
            itemsRemovedBool: {},
        };
    }
    function applyPatch(patch) {
        forEach(itemTypes, (itemType) => {
            var _a, _b;
            // Loop through removed items, and run removeConceptoItem()
            forEach((_a = patch.removed[itemType]) !== null && _a !== void 0 ? _a : [], (itemName) => removeItem({ type: itemType, name: itemName }));
            // Loop through added items and run addConceptoItem()
            forEach((_b = patch.added[itemType]) !== null && _b !== void 0 ? _b : [], (itemName) => addItem({ type: itemType, name: itemName }));
        });
        // run setState(patch.changed)
        setState(patch.changed);
    }
    function applyPatchHere(newStates, patch) {
        forEach(itemTypes, (itemType) => {
            var _a, _b;
            // Loop through each removed item, and delete it from newStates
            forEach((_a = patch.removed[itemType]) !== null && _a !== void 0 ? _a : [], (itemName) => {
                const itemTypeState = newStates[itemType];
                if (itemTypeState && itemTypeState[itemName]) {
                    delete itemTypeState[itemName];
                }
            });
            // Loop through each new item, and add it to newStates with state(itemName)
            forEach((_b = patch.added[itemType]) !== null && _b !== void 0 ? _b : [], (itemName) => {
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
                                itemTypeState[itemName] =
                                    changedPropertiesForItem[propertyName];
                            });
                        }
                    }
                });
            }
        });
    }
    function getPatchOrDiff(prevState, newState, patchOrDiff) {
        const newPatch = makeEmptyPatch();
        const tempDiffInfo = makeEmptyDiffInfo();
        const tempManualUpdateChanges = initialRecordedChanges();
        meta.getStatesDiff(prevState, // currentState
        newState, // previousState
        tempDiffInfo, tempManualUpdateChanges, // manualUpdateChanges
        true // checkAllChanges
        );
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
                            var _a, _b;
                            patchChangesForItemName[propertyName] =
                                (_b = (_a = newState === null || newState === void 0 ? void 0 : newState[itemType]) === null || _a === void 0 ? void 0 : _a[itemName]) === null || _b === void 0 ? void 0 : _b[propertyName];
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
            var _a;
            if ((_a = newPatch === null || newPatch === void 0 ? void 0 : newPatch.added[itemType]) === null || _a === void 0 ? void 0 : _a.length) {
                const itemNamesAddedForType = newPatch.added[itemType];
                const newItemTypeState = newState[itemType];
                let propertyNamesForItemType = [];
                let propertyNamesHaveBeenFound = false;
                forEach(itemNamesAddedForType !== null && itemNamesAddedForType !== void 0 ? itemNamesAddedForType : [], (itemName) => {
                    const defaultItemState = defaultStates[itemType](itemName);
                    const addedItemState = newItemTypeState === null || newItemTypeState === void 0 ? void 0 : newItemTypeState[itemName];
                    if (!propertyNamesHaveBeenFound) {
                        propertyNamesForItemType = Object.keys(defaultItemState);
                        propertyNamesHaveBeenFound = true;
                    }
                    if (addedItemState) {
                        forEach(propertyNamesForItemType, (propertyName) => {
                            const defaultPropertyValue = defaultItemState[propertyName];
                            const newPropertyValue = addedItemState === null || addedItemState === void 0 ? void 0 : addedItemState[propertyName];
                            if (defaultPropertyValue !== undefined &&
                                newPropertyValue !== undefined) {
                                let valuesAreTheSame = addedItemState[propertyName] === newPropertyValue;
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
            var _a;
            if ((_a = newDiff.removed[itemType]) === null || _a === void 0 ? void 0 : _a.length) {
                const itemNamesRemovedForType = newDiff.removed[itemType];
                const prevItemTypeState = prevState[itemType];
                let propertyNamesForItemType = [];
                let propertyNamesHaveBeenFound = false;
                forEach(itemNamesRemovedForType !== null && itemNamesRemovedForType !== void 0 ? itemNamesRemovedForType : [], (itemName) => {
                    const defaultItemState = defaultStates[itemType](itemName);
                    const removedItemState = prevItemTypeState === null || prevItemTypeState === void 0 ? void 0 : prevItemTypeState[itemName];
                    if (!propertyNamesHaveBeenFound) {
                        propertyNamesForItemType = Object.keys(defaultItemState);
                        propertyNamesHaveBeenFound = true;
                    }
                    if (removedItemState) {
                        forEach(propertyNamesForItemType, (propertyName) => {
                            const defaultPropertyValue = defaultItemState[propertyName];
                            const newPropertyValue = removedItemState === null || removedItemState === void 0 ? void 0 : removedItemState[propertyName];
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
        const combinedPatch = makeEmptyPatch();
        //
        forEach(itemTypes, (itemType) => {
            // combine added and removed , and remove duplicates
            var _a;
            const itemsAddedPrev = prevPatch.added[itemType];
            const itemsAddedNew = newPatch.added[itemType];
            const hasAddedItems = (itemsAddedPrev === null || itemsAddedPrev === void 0 ? void 0 : itemsAddedPrev.length) || (itemsAddedNew === null || itemsAddedNew === void 0 ? void 0 : itemsAddedNew.length);
            if (hasAddedItems) {
                combinedPatch.added[itemType] = getUniqueArrayItems([
                    ...(itemsAddedPrev !== null && itemsAddedPrev !== void 0 ? itemsAddedPrev : []),
                    ...(itemsAddedNew !== null && itemsAddedNew !== void 0 ? itemsAddedNew : []),
                ]);
            }
            const itemsRemovedPrev = prevPatch.removed[itemType];
            const itemsRemovedNew = newPatch.removed[itemType];
            const hasRemovedItems = (itemsRemovedPrev && itemsRemovedPrev.length > 0) ||
                (itemsRemovedNew && itemsRemovedNew.length > 0);
            if (hasRemovedItems) {
                combinedPatch.removed[itemType] = getUniqueArrayItems([
                    ...(itemsRemovedPrev !== null && itemsRemovedPrev !== void 0 ? itemsRemovedPrev : []),
                    ...(itemsRemovedNew !== null && itemsRemovedNew !== void 0 ? itemsRemovedNew : []),
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
                    ...(itemsChangedPrev !== null && itemsChangedPrev !== void 0 ? itemsChangedPrev : {}),
                    ...(itemsChangedNew !== null && itemsChangedNew !== void 0 ? itemsChangedNew : {}),
                });
                if (!combinedPatch.changed[itemType]) {
                    combinedPatch.changed[itemType] = {};
                }
                const combinedPatchChangedForItemType = combinedPatch.changed[itemType];
                if (combinedPatchChangedForItemType) {
                    forEach(allChangedItemNames, (itemName) => {
                        var _a, _b;
                        const combinedPatchChangedForItemName = combinedPatchChangedForItemType[itemName];
                        combinedPatchChangedForItemType[itemName] = {
                            ...((_a = itemsChangedPrev === null || itemsChangedPrev === void 0 ? void 0 : itemsChangedPrev[itemName]) !== null && _a !== void 0 ? _a : {}),
                            ...((_b = itemsChangedNew === null || itemsChangedNew === void 0 ? void 0 : itemsChangedNew[itemName]) !== null && _b !== void 0 ? _b : {}),
                        };
                    });
                    // Remove any item changes that are in removed
                    forEach((_a = combinedPatch.removed[itemType]) !== null && _a !== void 0 ? _a : [], (itemName) => {
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
        const minimalPatch = cloneObjectWithJson(thePatch);
        // Loop through the changed items, and each changed property
        forEach(itemTypes, (itemType) => {
            const propertyNames = Object.keys(defaultStates[itemType]("anItemName"));
            const changedForType = minimalPatch.changed[itemType];
            if (changedForType) {
                const changedItemNames = Object.keys(changedForType !== null && changedForType !== void 0 ? changedForType : {});
                forEach(changedItemNames, (itemName) => {
                    var _a;
                    const changedForItem = changedForType[itemName];
                    const itemState = (_a = currentStates === null || currentStates === void 0 ? void 0 : currentStates[itemType]) === null || _a === void 0 ? void 0 : _a[itemName];
                    if (changedForItem && itemState) {
                        forEach(propertyNames, (propertyName) => {
                            // If the value’s the same as state, remove that change property
                            if (changedForItem[propertyName] === itemState[propertyName]) {
                                delete changedForItem[propertyName];
                            }
                        });
                    }
                    // (if the item has no more properties, remove that changed item)
                    const changedPropertyNames = Object.keys(changedForItem !== null && changedForItem !== void 0 ? changedForItem : {});
                    if (changedPropertyNames.length === 0) {
                        delete changedForType[itemName];
                    }
                });
            }
            // Loop through the added items, if the item already exists in state, remove it from added
            if (minimalPatch.added[itemType]) {
                minimalPatch.added[itemType] = minimalPatch.added[itemType].filter((itemName) => { var _a; return !!((_a = currentStates === null || currentStates === void 0 ? void 0 : currentStates[itemType]) === null || _a === void 0 ? void 0 : _a[itemName]); });
            }
            // Loop through the removed items, if the item doesn’t exist in state, remove it from removed
            if (minimalPatch.removed[itemType]) {
                minimalPatch.removed[itemType] = minimalPatch.removed[itemType].filter((itemName) => { var _a; return !((_a = currentStates === null || currentStates === void 0 ? void 0 : currentStates[itemType]) === null || _a === void 0 ? void 0 : _a[itemName]); });
            }
        });
    }
    function removePartialPatch(thePatch, patchToRemove) {
        const newPatch = cloneObjectWithJson(thePatch);
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
                const changedItemNames = Object.keys(removedPatchChangedForType !== null && removedPatchChangedForType !== void 0 ? removedPatchChangedForType : {});
                forEach(changedItemNames, (itemName) => {
                    const removedPatchChangedForItem = removedPatchChangedForType[itemName];
                    const newPatchChangedForItem = newPatchChangedForType[itemName];
                    if (removedPatchChangedForItem && newPatchChangedForItem) {
                        // (if the item has no more properties, remove that changed item)
                        const removedPatchChangedPropertyNames = Object.keys(removedPatchChangedForItem !== null && removedPatchChangedForItem !== void 0 ? removedPatchChangedForItem : {});
                        forEach(removedPatchChangedPropertyNames, (propertyName) => {
                            if (JSON.stringify(removedPatchChangedForItem[propertyName]) ===
                                JSON.stringify(newPatchChangedForItem[propertyName])) {
                                delete newPatchChangedForItem[propertyName];
                            }
                        });
                    }
                    const changedPropertyNamesB = Object.keys(removedPatchChangedForItem !== null && removedPatchChangedForItem !== void 0 ? removedPatchChangedForItem : {});
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
    return {
        getPreviousState,
        getState,
        setState,
        onNextTick,
        getRefs,
        getItem,
        makeRules,
        makeDynamicRules,
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
        // TODO NOTE
        // make a seperate function that creates the patch+diff functions so it can be used when needed
        // patches and diffs
        // makeEmptyPatch,
        // makeEmptyDiff,
        // applyPatch,
        // applyPatchHere,
        // getPatch,
        // getPatchAndReversed,
        // getReversePatch,
        // combineTwoPatches,
        // combinePatches,
        // makeMinimalPatch,
        // removePartialPatch,
        // getDiff,
        // getDiffFromPatches,
        // getPatchesFromDiff,
        // combineTwoDiffs,
        // combineDiffs,
    };
}
