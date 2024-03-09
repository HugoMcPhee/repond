import meta from "./meta";
import { _updateRepond } from "./updating";
function updateRepondNextFrame() {
    return requestAnimationFrame(_updateRepond);
}
function updateRepondInTwoFrames() {
    return requestAnimationFrame(updateRepondNextFrame);
}
function findScreenFramerate() {
    meta.lookingForScreenFramerate = true;
    let latestDuration = 100;
    requestAnimationFrame((frameTime1) => {
        requestAnimationFrame((frameTime2) => {
            latestDuration = frameTime2 - frameTime1;
            if (latestDuration < meta.shortestFrameDuration)
                meta.shortestFrameDuration = latestDuration;
            requestAnimationFrame((frameTime3) => {
                latestDuration = frameTime3 - frameTime2;
                if (latestDuration < meta.shortestFrameDuration)
                    meta.shortestFrameDuration = latestDuration;
                requestAnimationFrame((frameTime4) => {
                    latestDuration = frameTime4 - frameTime3;
                    if (latestDuration < meta.shortestFrameDuration)
                        meta.shortestFrameDuration = latestDuration;
                    requestAnimationFrame((frameTime5) => {
                        latestDuration = frameTime5 - frameTime4;
                        if (latestDuration < meta.shortestFrameDuration)
                            meta.shortestFrameDuration = latestDuration;
                        meta.foundScreenFramerate = true;
                        runNextFrame();
                    });
                });
            });
        });
    });
}
function runNextFrameIfNeeded() {
    if (!meta.shouldRunUpdateAtEndOfUpdate) {
        if (meta.nextFrameIsFirst && meta.nowMetaPhase === "waitingForFirstUpdate") {
            updateRepondNextFrame();
            meta.nowMetaPhase = "waitingForMoreUpdates";
        }
        else {
            meta.shouldRunUpdateAtEndOfUpdate = true;
        }
    }
}
export function runNextFrame() {
    if (!meta.foundScreenFramerate) {
        if (!meta.lookingForScreenFramerate) {
            findScreenFramerate();
        }
    }
    else {
        const isUnderShortestFrame = meta.latestUpdateDuration < meta.shortestFrameDuration;
        if (meta.frameRateTypeOption === "auto") {
            if (isUnderShortestFrame) {
                if (meta.lateFramesAmount > 0)
                    meta.lateFramesAmount -= 1;
            }
            else {
                if (meta.lateFramesAmount < 100)
                    meta.lateFramesAmount += 15;
            }
            if (meta.lateFramesAmount > 99) {
                meta.frameRateType = "half";
            }
            else if (meta.lateFramesAmount < 5) {
                meta.frameRateType = "full";
            }
        }
        if (meta.frameRateType === "full") {
            meta.latestFrameId = updateRepondNextFrame();
        }
        else if (meta.frameRateType === "half") {
            if (meta.latestUpdateDuration < meta.shortestFrameDuration) {
                meta.latestFrameId = updateRepondInTwoFrames();
            }
            else {
                meta.latestFrameId = updateRepondNextFrame();
            }
        }
    }
}
// only runs when calling  _setState
function runWhenUpdatingRepond(whatToRun, callback) {
    meta.setStatesQue.push(whatToRun);
    if (callback)
        meta.callbacksQue.push(callback);
    runNextFrameIfNeeded();
}
export function runWhenStartingEffects(whatToRun) {
    meta.startEffectsQue.push(whatToRun);
    runNextFrameIfNeeded();
}
export function runWhenStoppingEffects(whatToRun) {
    // stopping listeners runs instantly
    whatToRun();
}
export function runWhenDoingEffectsRunAtStart(whatToRun, callback) {
    meta.effectsRunAtStartQueue.push(whatToRun);
    if (callback)
        meta.effectsRunAtStartQueue.push(callback);
    runNextFrameIfNeeded();
}
function runWhenAddingAndRemovingItems(whatToRun, callback) {
    meta.addAndRemoveItemsQue.push(whatToRun);
    if (callback)
        meta.callbacksQue.push(callback);
    runNextFrameIfNeeded();
}
export function _setState(newState, callback) {
    runWhenUpdatingRepond(() => {
        const newStateValue = typeof newState === "function" ? newState(meta.nowState) : newState;
        if (!newStateValue)
            return;
        meta.mergeStates(newStateValue, meta.nowState, meta.nowMetaPhase === "runningEffects" ? meta.recordedEffectChanges : meta.recordedStepEndEffectChanges, meta.recordedStepEndEffectChanges);
    }, callback);
}
export function _removeItem({ type: itemType, id: itemId }, callback) {
    runWhenAddingAndRemovingItems(() => {
        // removing itemId
        delete meta.nowState[itemType][itemId];
        meta.itemIdsByItemType[itemType] = Object.keys(meta.nowState[itemType]);
        // delete meta.currentRefs[itemType][itemId]; // now done at the end of update repond
        meta.recordedStepEndEffectChanges.itemTypesBool[itemType] = true;
        meta.recordedStepEndEffectChanges.somethingChanged = true;
        meta.recordedEffectChanges.itemTypesBool[itemType] = true;
        meta.recordedEffectChanges.somethingChanged = true;
    }, callback);
}
export function _addItem({ type, id, state, refs }, callback) {
    runWhenAddingAndRemovingItems(() => {
        meta.nowState[type][id] = {
            ...meta.defaultStateByItemType[type](id),
            ...(state || {}),
        };
        meta.nowRefs[type][id] = {
            ...meta.defaultRefsByItemType[type](id, meta.nowState[id]),
            ...(refs || {}),
        };
        meta.itemIdsByItemType[type].push(id);
        meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;
        // TODO Figure out if adding an item should record the properties as chnaged or not?
        meta.recordedStepEndEffectChanges.itemPropsBool[type][id] = {};
        meta.recordedEffectChanges.itemPropsBool[type][id] = {};
        meta.diffInfo.propsChanged[type][id] = [];
        meta.diffInfo.propsChangedBool[type][id] = {};
        meta.recordedStepEndEffectChanges.itemIdsBool[type][id] = true;
        meta.recordedStepEndEffectChanges.somethingChanged = true;
        meta.recordedEffectChanges.itemTypesBool[type] = true;
        meta.recordedEffectChanges.itemIdsBool[type][id] = true;
        meta.recordedEffectChanges.somethingChanged = true;
    }, callback);
}
