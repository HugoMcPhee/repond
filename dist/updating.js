import { repondMeta as meta } from "./meta";
import { forEach } from "chootils/dist/loops";
import checkEffects from "./checkEffects";
import { runNextFrame } from "./helpers/frames";
import { getStatesDiff } from "./getStatesDiff";
import { copyStates } from "./copyStates";
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
        // NOTE possibly stop this check if it's been done enough
        // if (meta.frameRateTypeOption !== "full") {
        //   if (meta.speedTestFramesRun < 15) {
        //     if (meta.latestFrameDuration < meta.shortestFrameDuration) {
        //       meta.shortestFrameDuration = meta.latestFrameDuration;
        //     }
        //   }
        // }
    }
    else {
        meta.latestFrameDuration = 16.66667;
    }
}
function runSetStates() {
    // merges all the states from setState()
    for (let index = 0; index < meta.setStatesQue.length; index++) {
        const loopedUpdateFunction = meta.setStatesQue[index];
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    }
    meta.setStatesQue.length = 0;
}
function runAddEffects() {
    // adding listeners (rules) are queued and happen here
    // removing listeners happens instantly
    for (let index = 0; index < meta.startEffectsQue.length; index++) {
        const loopedUpdateFunction = meta.startEffectsQue[index];
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    }
    meta.startEffectsQue.length = 0;
}
function runEffectsWithRunAtStart() {
    for (let index = 0; index < meta.effectsRunAtStartQueue.length; index++) {
        const loopedUpdateFunction = meta.effectsRunAtStartQueue[index];
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    }
    meta.effectsRunAtStartQueue.length = 0;
}
function runAddAndRemove() {
    for (let index = 0; index < meta.addAndRemoveItemsQue.length; index++) {
        const loopedUpdateFunction = meta.addAndRemoveItemsQue[index];
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    }
    meta.willAddItemsInfo = {};
    meta.willRemoveItemsInfo = {};
    meta.addAndRemoveItemsQue.length = 0;
}
function runEffects(phase, stepName) {
    const effectNamesToRun = checkEffects(phase, stepName);
    for (let index = 0; index < effectNamesToRun.length; index++) {
        const name = effectNamesToRun[index];
        if (meta.allEffects[name])
            meta.allEffects[name].run(meta.diffInfo, meta.latestFrameDuration);
    }
}
function runCallbacks(callbacksToRun) {
    for (let index = 0; index < callbacksToRun.length; index++) {
        const loopedCallback = callbacksToRun[index];
        loopedCallback(meta.latestFrameDuration, meta.latestFrameTime);
    }
}
const copiedCallbacks = [];
function runAllCallbacks() {
    if (meta.callbacksQue.length > 0) {
        for (let index = 0; index < meta.callbacksQue.length; index++) {
            copiedCallbacks.push(meta.callbacksQue[index]);
        }
        meta.callbacksQue.length = 0;
    }
    runCallbacks(copiedCallbacks);
    copiedCallbacks.length = 0;
}
export function createRecordedChanges(recordedChanges) {
    recordedChanges.itemTypesBool = {};
    recordedChanges.itemIdsBool = {};
    recordedChanges.itemPropsBool = {};
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
    resetRecordedStepChanges(); // NOTE recently added to prevent 'derive' changes being remembered each time it derives again
    runEffectsWithRunAtStart(); // run the runAtStart listeners
    runEffects("duringStep", stepName); //  a running derive-listener can add more to the setStates que (or others)
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
    runStepEffects(stepName);
    if (!meta.recordedEffectChanges.somethingChanged)
        return;
    runStepEffects(stepName);
    if (!meta.recordedEffectChanges.somethingChanged)
        return;
    runStepEffects(stepName);
    if (!meta.recordedEffectChanges.somethingChanged)
        return;
    runStepEffects(stepName);
    if (!meta.recordedEffectChanges.somethingChanged)
        return;
    runStepEffects(stepName);
    if (!meta.recordedEffectChanges.somethingChanged)
        return;
    runStepEffects(stepName);
    if (!meta.recordedEffectChanges.somethingChanged)
        return;
    runStepEffects(stepName);
    if (!meta.recordedEffectChanges.somethingChanged)
        return;
    runStepEffects(stepName);
    if (!meta.recordedEffectChanges.somethingChanged)
        return;
    console.warn("WARNING: running step effects a lot, there may be an infinite setState inside an effect");
    console.log("Step name: ", meta.nowStepName);
    console.log("Effect ids:");
    console.log(JSON.stringify(meta.effectIdsByPhaseByStep.duringStep?.[meta.nowStepName], null, 2));
    console.log("Changes");
    console.log(JSON.stringify(Object.entries(meta.recordedEffectChanges.itemTypesBool)
        .filter((item) => item[1] === true)
        .map((item) => Object.values(meta.recordedEffectChanges.itemPropsBool[item[0]]).map((value) => Object.entries(value)
        .filter((propEntry) => propEntry[1] === true)
        .map((propEntry) => propEntry[0]))), null, 2));
}
function runStepEndEffectsShortcut(stepName) {
    meta.nowMetaPhase = "runningStepEndEffects"; // hm not checked anywhere, but checking metaPhase !== "runningEffects" (runnin derrivers) is
    updateDiffInfo(meta.recordedStepEndEffectChanges); // the diff for all the combined derriver changes
    runEffects("endOfStep", stepName); //  Then it runs the stepEnd effects based on the diff
}
function runAStep(stepName) {
    runSetOfStepEffects(stepName);
    runStepEndEffectsShortcut(stepName);
}
function runAStepLoop() {
    runAStep(meta.nowStepName);
    meta.nowStepIndex += 1;
    meta.nowStepName = meta.stepNames[meta.nowStepIndex];
}
function runSetOfStepsLoopShortcut() {
    meta.nowStepIndex = 0;
    meta.nowStepName = meta.stepNames[meta.nowStepIndex];
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    runAStepLoop();
    if (!meta.stepNames[meta.nowStepIndex])
        return;
    console.warn("tried to run a 30th step", meta.stepNames.length);
}
export function _updateRepond(animationFrameTime) {
    updateFrameTimes(animationFrameTime);
    meta.latestUpdateTime = performance.now();
    setMetaPhase("runningUpdates");
    // save previous state, ,
    // this won't this discard all the setStates from the callbacks
    // because all the setStates are delayed, and get added to meta.whatToRunWhenUpdating to run later
    copyStates(meta.nowState, meta.prevState);
    runSetOfStepsLoopShortcut();
    resetRecordedStepEndChanges(); // maybe resetting recorded changes here is better, before the callbacks run? maybe it doesnt matter?
    setMetaPhase("waitingForFirstUpdate");
    runAllCallbacks();
    removeRemovedItemRefs();
    // if theres nothing running on next frame
    meta.nextFrameIsFirst = meta.setStatesQue.length === 0;
    meta.latestUpdateDuration = performance.now() - meta.latestUpdateTime;
    if (meta.shouldRunUpdateAtEndOfUpdate) {
        runNextFrame();
        meta.shouldRunUpdateAtEndOfUpdate = false;
    }
}
