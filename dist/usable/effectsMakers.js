import { toSafeEffectId } from "../helpers/effects";
import { makeEffects } from "./effects";
import { getPrevState, getState } from "./getSet";
export function makeEffectsMaker(storeName, storeItemId, storyProperty, stepName, getUsefulParams) {
    const mainEffectId = toSafeEffectId(`customEffectFor_${storeName}_${storyProperty}`);
    function newEffectMaker(callbacksMap) {
        return makeEffects((makeEffect) => ({
            whenPropertyChanges: makeEffect((_, _diffInfo) => {
                const usefulParams = getUsefulParams?.();
                const latestValue = getState(storeName, storeItemId)[storyProperty];
                callbacksMap[latestValue]?.(usefulParams);
            }, {
                changes: [`${storeName}.${storyProperty}`],
                itemIds: [storeItemId],
                step: stepName ?? "default",
                atStepEnd: true,
                id: mainEffectId,
                isPerItem: false,
            }),
        }));
    }
    return newEffectMaker;
}
export function makeLeaveEffectsMaker(storeName, storeItemId, storyProperty, stepName, getUsefulParams) {
    const mainEffectId = toSafeEffectId(`customEffectFor_${storeName}_${storyProperty}`);
    function newEffectsMaker(callBacksObject) {
        return makeEffects((makeEffect) => ({
            whenPropertyChanges: makeEffect((_, _diffInfo) => {
                const usefulStoryStuff = getUsefulParams?.();
                const prevValue = getPrevState(storeName, storeItemId)[storyProperty];
                callBacksObject[prevValue]?.(usefulStoryStuff);
            }, {
                changes: [`${storeName}.${storyProperty}`],
                itemIds: [storeItemId],
                step: stepName ?? "default",
                atStepEnd: true,
                id: mainEffectId,
                isPerItem: false,
            }),
        }));
    }
    return newEffectsMaker;
}
/** Similar to makeEffectsMaker but accepts parameters for two store properties (can be from different stores) , and the callback fires when properties of both stores change */
export function makeNestedEffectsMaker(storeInfo1, storeInfo2, stepName, getUsefulParams) {
    const [storeName1, storeItemId1, storyProp1] = storeInfo1;
    const [storeName2, storeItemId2, storyProp2] = storeInfo2;
    const mainEffectId = toSafeEffectId(`customEffectFor_${storeName1}_${storyProp1}_${storeName2}_${storyProp2}`);
    function newEffectsMaker(callBacksObject) {
        return makeEffects((makeEffect) => ({
            whenPropertyChanges: makeEffect((_, diffInfo) => {
                const usefulStoryStuff = getUsefulParams?.();
                const latestValue1 = getState(storeName1, storeItemId1)?.[storyProp1];
                const latestValue2 = getState(storeName2, storeItemId2)?.[storyProp2];
                // Make sure value1 changed for itemType1 etc, since it listens for both itemIIds for both stores (might not be neccesary)
                const didValue1Change = diffInfo.propsChangedBool[storeName1][storeItemId1][storyProp1];
                const didValue2Change = diffInfo.propsChangedBool[storeName2][storeItemId2][storyProp2];
                if (didValue1Change || didValue2Change)
                    return;
                callBacksObject[latestValue1]?.[latestValue2]?.(usefulStoryStuff);
            }, {
                changes: [`${storeName1}.${storyProp1}`, `${storeName2}.${storyProp2}`],
                itemIds: [storeItemId1, storeItemId2],
                step: stepName ?? "default",
                atStepEnd: true,
                id: mainEffectId,
            }),
        }));
    }
    return newEffectsMaker;
}
/** The same as makeNestedRuleMaker , but the callback fires when the properties of both stores become NOT the specified values, but were previously */
export function makeNestedLeaveEffectsMaker(storeInfo1, storeInfo2, stepName, getUsefulParams) {
    const [storeName1, storeItemId1, storyProperty1] = storeInfo1;
    const [storeName2, storeItemId2, storyProperty2] = storeInfo2;
    const mainEffectId = toSafeEffectId(`customLeaveEffectFor_${storeName1}_${storyProperty1}_${storeName2}_${storyProperty2}`);
    function newRuleMaker(callBacksObject) {
        return makeEffects((makeEffect) => ({
            whenPropertyChanges: makeEffect((_, diffInfo) => {
                const usefulParams = getUsefulParams?.();
                const latestValue1 = getState(storeName1, storeItemId1)?.[storyProperty1];
                const latestValue2 = getState(storeName2, storeItemId2)?.[storyProperty2];
                const prevValue1 = getPrevState(storeName1, storeItemId1)[storyProperty1];
                const prevValue2 = getPrevState(storeName2, storeItemId2)[storyProperty2];
                // Make sure value1 changed for itemType1 etc, since it listens for both itemIIds for both stores (might not be neccesary)
                const didValue1Change = diffInfo.propsChangedBool[storeName1][storeItemId1][storyProperty1];
                const didValue2Change = diffInfo.propsChangedBool[storeName2][storeItemId2][storyProperty2];
                if (didValue1Change || didValue2Change)
                    return;
                const callback = callBacksObject[prevValue1]?.[prevValue2];
                if (callback)
                    callback(usefulParams);
            }, {
                changes: [`${storeName1}.${storyProperty1}`, `${storeName2}.${storyProperty2}`],
                itemIds: [storeItemId1, storeItemId2],
                step: stepName ?? "default",
                atStepEnd: true,
                id: mainEffectId,
                isPerItem: false,
            }),
        }));
    }
    return newRuleMaker;
}
