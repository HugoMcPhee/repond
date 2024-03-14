import { toSafeEffectId } from "../helpers/effects/internal";
import { makeEffects } from "./effects";
import { getPrevState, getState } from "./getSet";
export function makeEffectsMaker(storeName, storeItemId, storyProperty, stepName, getUsefulParams) {
    const mainEffectId = toSafeEffectId(`customEffectFor_${storeName}_${storyProperty}`);
    function newEffectMaker(callbacksMap) {
        return makeEffects(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulParams = getUsefulParams?.();
                    const latestValue = getState()[storeName][storeItemId][storyProperty];
                    callbacksMap[latestValue]?.(usefulParams);
                },
                check: { prop: [storyProperty], id: storeItemId, type: storeName },
                step: stepName ?? "default",
                atStepEnd: true,
                id: mainEffectId,
            }),
        }));
    }
    return newEffectMaker;
}
export function makeLeaveEffectsMaker(storeName, storeItemId, storyProperty, stepName, getUsefulParams) {
    const mainEffectId = toSafeEffectId(`customEffectFor_${storeName}_${storyProperty}`);
    function newEffectsMaker(callBacksObject) {
        return makeEffects(({ effect }) => ({
            whenPropertyChanges: effect({
                run(_diffInfo) {
                    const usefulStoryStuff = getUsefulParams?.();
                    const prevValue = getPrevState()[storeName][storeItemId][storyProperty];
                    callBacksObject[prevValue]?.(usefulStoryStuff);
                },
                check: { prop: [storyProperty], id: storeItemId, type: storeName },
                step: stepName ?? "default",
                atStepEnd: true,
                id: mainEffectId,
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
        return makeEffects(({ effect }) => ({
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
        return makeEffects(({ effect }) => ({
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
                id: mainEffectId,
            }),
        }));
    }
    return newRuleMaker;
}
