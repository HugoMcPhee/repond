import { breakableForEach, forEach } from "chootils/dist/loops";
import checkEffects from "./checkEffects";
import { copyItemIdsByItemType, copyStates } from "./copyStates";
import { getStatesDiff } from "./getStatesDiff";
import { updateRepondNextFrame } from "./helpers/frames";
import { repondMeta as meta } from "./meta";
const MAX_STEP_ITERATIONS = 8;
// NOTE maybe update to only check propIds and also itemIds by propId or something?
function updateDiffInfo(recordedChanges) {
    //  make a diff of the changes
    getStatesDiff(meta.nowState, meta.prevState, meta.diffInfo, recordedChanges, false /* checkAllChanges */);
}
function setMetaPhase(metaPhase) {
    meta.nowMetaPhase = metaPhase;
}
function updateFrameTimes(animationFrameTime) {
    meta.previousFrameTime = meta.latestFrameTime;
    meta.latestFrameTime = animationFrameTime;
    if (meta.nextFrameIsFirst === false) {
        meta.latestFrameDuration = meta.latestFrameTime - meta.previousFrameTime;
    }
    else {
        meta.latestFrameDuration = 16.66667;
    }
}
function runSetStates() {
    // merges all the states from setState()
    meta.isRunningSetStates = true;
    for (let index = 0; index < meta.setStatesQueue.length; index++) {
        const loopedUpdateFunction = meta.setStatesQueue[index];
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    }
    meta.isRunningSetStates = false;
    meta.setStatesQueue.length = 0;
}
function runAddEffects() {
    // adding listeners (rules) are queued and happen here
    // removing listeners happens instantly
    for (let index = 0; index < meta.startEffectsQueue.length; index++) {
        const loopedUpdateFunction = meta.startEffectsQueue[index];
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    }
    meta.startEffectsQueue.length = 0;
}
function runEffectsWithRunAtStart() {
    for (let index = 0; index < meta.effectsRunAtStartQueue.length; index++) {
        const loopedUpdateFunction = meta.effectsRunAtStartQueue[index];
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    }
    meta.effectsRunAtStartQueue.length = 0;
}
function runAddAndRemove() {
    for (let index = 0; index < meta.addAndRemoveItemsQueue.length; index++) {
        const loopedUpdateFunction = meta.addAndRemoveItemsQueue[index];
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    }
    meta.willAddItemsInfo = {};
    meta.willRemoveItemsInfo = {};
    meta.addAndRemoveItemsQueue.length = 0;
}
function runEffectChangesPerItemForItemType(effect, type) {
    const diffInfo = meta.diffInfo;
    const allowedIdsMap = effect._allowedIdsMap;
    const props = effect._propsByItemType?.[type];
    const frameDuration = meta.latestFrameDuration;
    const shouldCheckAdded = effect._checkAddedByItemType?.[type];
    const shouldCheckRemoved = effect._checkRemovedByItemType?.[type];
    let alreadyRanIdsMap = undefined;
    if (shouldCheckAdded || shouldCheckRemoved) {
        if (shouldCheckAdded) {
            const itemsAddedIds = diffInfo.itemsAdded[type];
            itemsAddedIds.forEach((itemId) => {
                if (!allowedIdsMap || allowedIdsMap[itemId]) {
                    effect.run(itemId, meta.diffInfo, frameDuration, false);
                    alreadyRanIdsMap = alreadyRanIdsMap ?? {};
                    alreadyRanIdsMap[itemId] = true;
                }
            });
        }
        if (shouldCheckRemoved) {
            const itemsRemovedIds = diffInfo.itemsRemoved[type];
            itemsRemovedIds.forEach((itemId) => {
                if (!allowedIdsMap || (allowedIdsMap[itemId] && !alreadyRanIdsMap?.[itemId])) {
                    effect.run(itemId, meta.diffInfo, frameDuration, false);
                    alreadyRanIdsMap = alreadyRanIdsMap ?? {};
                    alreadyRanIdsMap[itemId] = true;
                }
            });
        }
    }
    // If there are no changes for this item type, return
    if (!props?.length)
        return;
    forEach(diffInfo.itemsChanged[type], (itemIdThatChanged) => {
        if (!(!allowedIdsMap || (allowedIdsMap && allowedIdsMap[itemIdThatChanged])))
            return;
        breakableForEach(props, (propName) => {
            if (!diffInfo.propsChangedBool[type][itemIdThatChanged][propName])
                return;
            if (alreadyRanIdsMap?.[itemIdThatChanged])
                return;
            effect.run(itemIdThatChanged, meta.diffInfo, frameDuration, false);
            return true; // break out of the loop, so it only runs once
        });
    });
}
function runEffects(phase, stepName) {
    // NOTE Check effects doesnt use recorded changes! onyl the diff info?
    const effectNamesToRun = checkEffects(phase, stepName);
    for (let index = 0; index < effectNamesToRun.length; index++) {
        const name = effectNamesToRun[index];
        const effect = meta.liveEffectsMap[name];
        if (!effect)
            return console.warn("no effect found for ", name);
        if (effect.isPerItem) {
            const itemTypes = effect._itemTypes;
            if (!itemTypes)
                return console.warn("no item types found for ", name);
            if (itemTypes?.length === 1) {
                runEffectChangesPerItemForItemType(effect, itemTypes[0]);
            }
            else {
                forEach(itemTypes, (type) => runEffectChangesPerItemForItemType(effect, type));
            }
        }
        else {
            effect.run("", meta.diffInfo, meta.latestFrameDuration, false);
        }
    }
}
function runCallbacks(callbacksToRun) {
    for (let index = 0; index < callbacksToRun.length; index++) {
        const loopedCallback = callbacksToRun[index];
        loopedCallback(meta.latestFrameDuration, meta.latestFrameTime);
    }
}
const copiedCallbacks = [];
function runNextTickCallbacks() {
    if (meta.nextTickQueue.length > 0) {
        for (let index = 0; index < meta.nextTickQueue.length; index++) {
            copiedCallbacks.push(meta.nextTickQueue[index]);
        }
        meta.nextTickQueue.length = 0;
    }
    runCallbacks(copiedCallbacks);
    copiedCallbacks.length = 0;
}
export function createRecordedChanges(recordedChanges) {
    recordedChanges.itemTypesBool = {};
    recordedChanges.itemIdsBool = {};
    recordedChanges.itemPropsBool = {};
    console.log("createRecordedChanges", meta.itemTypeNames);
    forEach(meta.itemTypeNames, (itemType) => {
        recordedChanges.itemTypesBool[itemType] = false;
        recordedChanges.itemIdsBool[itemType] = {};
        recordedChanges.itemPropsBool[itemType] = {};
        forEach(meta.itemIdsByItemType[itemType], (itemId) => {
            recordedChanges.itemIdsBool[itemType][itemId] = false;
            recordedChanges.itemPropsBool[itemType][itemId] = {};
            forEach(meta.propNamesByItemType[itemType], (propName) => {
                recordedChanges.itemPropsBool[itemType][itemId][propName]; // should have = false here?
            });
        });
    });
    recordedChanges.somethingChanged = false;
}
// Maybe this can be removed? and just the props chenge thing, and also maybe ids changed?
function resetRecordedChanges(recordedChanges) {
    recordedChanges.somethingChanged = false;
    for (let typeIndex = 0; typeIndex < meta.itemTypeNames.length; typeIndex++) {
        const itemType = meta.itemTypeNames[typeIndex];
        recordedChanges.itemTypesBool[itemType] = false;
        for (let nameIndex = 0; nameIndex < meta.itemIdsByItemType[itemType].length; nameIndex++) {
            const itemId = meta.itemIdsByItemType[itemType][nameIndex];
            recordedChanges.itemIdsBool[itemType][itemId] = false;
            for (let propIndex = 0; propIndex < meta.propNamesByItemType[itemType].length; propIndex++) {
                const propName = meta.propNamesByItemType[itemType][propIndex];
                recordedChanges.itemPropsBool[itemType][itemId][propName] = false;
            }
        }
    }
}
function resetRecordedStepEndChanges() {
    resetRecordedChanges(meta.recordedStepEndEffectChanges);
}
function resetRecordedStepChanges() {
    resetRecordedChanges(meta.recordedEffectChanges);
}
// NOTE why is runEffects happening beofre runStepEffects?
// I think it's meant to listen to the changes that happened in the last step? then if any setStates happened in the effects, they will be run in the next step, the diff info gets updated
// it expects the diff info to be updated before it runs the effects
// BUT I think the first time it runs, it doesn't have any diff info, so it runs the effects first which maybe won't do anything, then the setStates
// the setStates from clalbacks only get run here and not before
function runStepEffects(stepName) {
    // NOTE this runs based on the diff info of the PREVIOUS steps END changes, which is all colected changes so far
    //
    resetRecordedStepChanges(); // NOTE recently added to prevent 'derive' changes being remembered each time it derives again
    runEffectsWithRunAtStart(); // run the runAtStart listeners
    runEffects("duringStep", stepName); //  a running derive-listener can add more to the setStates que (or others)
    meta.recordedPropIdsChangedMap.duringStep = {};
    runAddEffects(); // add rules / effects
    runAddAndRemove(); // add and remove items
    runSetStates(); // run the qued setStates
    updateDiffInfo(meta.recordedEffectChanges);
}
// NOTE diffInfo form the previous step is kept for the first loop of step effects, so the normal/derrive listeners can run based on the previous step's changes
function removeRemovedItemRefs() {
    if (!meta.diffInfo.itemsRemoved)
        return;
    for (let changedIndex = 0; changedIndex < meta.diffInfo.itemTypesChanged.length; changedIndex++) {
        const loopedItemType = meta.diffInfo.itemTypesChanged[changedIndex];
        for (let removedIndex = 0; removedIndex < meta.diffInfo.itemsRemoved[loopedItemType].length; removedIndex++) {
            const removedItemId = meta.diffInfo.itemsRemoved[loopedItemType][removedIndex];
            delete meta.nowRefs[loopedItemType][removedItemId];
        }
    }
}
function runSetOfStepEffects(stepName) {
    meta.nowMetaPhase = "runningEffects";
    meta.nowEffectPhase = "duringStep";
    meta.isFirstDuringPhaseLoop = true;
    for (let i = 0; i < MAX_STEP_ITERATIONS; i++) {
        runStepEffects(stepName);
        meta.isFirstDuringPhaseLoop = false;
        if (!meta.recordedEffectChanges.somethingChanged)
            return;
    }
    logTooManySetStatesMessage();
}
function runStepEndEffects(stepName) {
    meta.nowMetaPhase = "runningStepEndEffects"; // hm not checked anywhere, but checking metaPhase !== "runningEffects" (runnin derrivers) is
    meta.nowEffectPhase = "endOfStep";
    updateDiffInfo(meta.recordedStepEndEffectChanges); // the diff for all the combined derriver changes
    runEffects("endOfStep", stepName); //  Then it runs the stepEnd effects based on the diff
}
function runAStep(stepName) {
    runSetOfStepEffects(stepName);
    runStepEndEffects(stepName);
}
function runAStepLoop() {
    runAStep(meta.nowStepName);
    meta.nowStepIndex += 1;
    meta.nowStepName = meta.stepNames[meta.nowStepIndex];
}
function runSetOfStepsLoop() {
    meta.nowStepIndex = 0;
    meta.nowStepName = meta.stepNames[meta.nowStepIndex];
    for (let i = 0; i < meta.stepNames.length; i++) {
        runAStepLoop();
        if (!meta.stepNames[meta.nowStepIndex])
            return;
    }
}
export function _updateRepond(animationFrameTime) {
    meta.didStartFirstFrame = true;
    updateFrameTimes(animationFrameTime);
    setMetaPhase("runningUpdates");
    // Save previous state
    // - this won't this discard all the setStates from the callbacks
    //    because all the setStates are delayed, and get added to meta.setStatesQue to run later
    copyStates(meta.nowState, meta.prevState);
    // Copy the item ids into the previous item ids
    copyItemIdsByItemType(meta.itemIdsByItemType, meta.prevItemIdsByItemType);
    runSetOfStepsLoop();
    resetRecordedStepEndChanges(); // maybe resetting recorded changes here is better, before the callbacks run? maybe it doesnt matter?
    meta.recordedPropIdsChangedMap.endOfStep = {};
    setMetaPhase("waitingForFirstUpdate");
    runNextTickCallbacks();
    removeRemovedItemRefs();
    // if theres nothing running on next frame
    meta.nextFrameIsFirst = meta.setStatesQueue.length === 0;
    if (meta.shouldRunUpdateAtEndOfUpdate) {
        updateRepondNextFrame();
        meta.shouldRunUpdateAtEndOfUpdate = false;
    }
}
// ------------------------------
// Debugging helpers
function logTooManySetStatesMessage() {
    console.warn("WARNING: running step effects a lot, there may be an infinite setState inside an effect");
    console.log("Step name: ", meta.nowStepName);
    console.log("Effect ids:");
    console.log(JSON.stringify(meta.effectIdsByPhaseByStepByPropId.duringStep?.[meta.nowStepName], null, 2));
    console.log("Changes");
    console.log(JSON.stringify(getDebugStepEffectsData(), null, 2));
}
function getDebugStepEffectsData() {
    return Object.entries(meta.recordedEffectChanges.itemTypesBool)
        .filter((item) => item[1] === true)
        .map((item) => Object.values(meta.recordedEffectChanges.itemPropsBool[item[0]]).map((value) => Object.entries(value)
        .filter((propEntry) => propEntry[1] === true)
        .map((propEntry) => propEntry[0])));
}
