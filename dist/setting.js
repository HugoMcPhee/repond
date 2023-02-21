import meta from "./meta";
import { _updatePietem } from "./updating";
function updatePietemNextFrame() {
    return requestAnimationFrame(_updatePietem);
}
function updatePietemInTwoFrames() {
    return requestAnimationFrame(updatePietemNextFrame);
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
        if (meta.nextFrameIsFirst &&
            meta.currentMetaPhase === "waitingForFirstUpdate") {
            updatePietemNextFrame();
            meta.currentMetaPhase = "waitingForMoreUpdates";
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
            meta.latestFrameId = updatePietemNextFrame();
        }
        else if (meta.frameRateType === "half") {
            if (meta.latestUpdateDuration < meta.shortestFrameDuration) {
                meta.latestFrameId = updatePietemInTwoFrames();
            }
            else {
                meta.latestFrameId = updatePietemNextFrame();
            }
        }
    }
}
// only runs when calling  _setState
function runWhenUpdatingPietem(whatToRun, callback) {
    meta.setStatesQue.push(whatToRun);
    if (callback)
        meta.callbacksQue.push(callback);
    runNextFrameIfNeeded();
}
export function runWhenStartingPietemListeners(whatToRun) {
    meta.startListenersQue.push(whatToRun);
    runNextFrameIfNeeded();
}
export function runWhenStoppingPietemListeners(whatToRun) {
    // stopping listeners runs instantly
    whatToRun();
}
function runWhenAddingAndRemovingPietem(whatToRun, callback) {
    meta.addAndRemoveItemsQue.push(whatToRun);
    if (callback)
        meta.callbacksQue.push(callback);
    runNextFrameIfNeeded();
}
export function _setState(newState, callback) {
    runWhenUpdatingPietem(() => {
        const newStateValue = typeof newState === "function" ? newState(meta.currentState) : newState;
        if (!newStateValue)
            return;
        meta.mergeStates(newStateValue, meta.currentState, meta.currentMetaPhase === "runningDeriveListeners"
            ? meta.recordedDeriveChanges
            : meta.recordedSubscribeChanges, meta.recordedSubscribeChanges);
    }, callback);
}
export function _removeItem({ type: itemType, name: itemName }, callback) {
    runWhenAddingAndRemovingPietem(() => {
        // removing itemName
        delete meta.currentState[itemType][itemName];
        meta.itemNamesByItemType[itemType] = Object.keys(meta.currentState[itemType]);
        // delete meta.currentRefs[itemType][itemName]; // now done at the end of update pietem
        meta.recordedSubscribeChanges.itemTypesBool[itemType] = true;
        meta.recordedSubscribeChanges.somethingChanged = true;
        meta.recordedDeriveChanges.itemTypesBool[itemType] = true;
        meta.recordedDeriveChanges.somethingChanged = true;
    }, callback);
}
export function _addItem({ type, name, state, refs, }, callback) {
    runWhenAddingAndRemovingPietem(() => {
        meta.currentState[type][name] = {
            ...meta.defaultStateByItemType[type](name),
            ...(state || {}),
        };
        meta.currentRefs[type][name] = {
            ...meta.defaultRefsByItemType[type](name, meta.currentState[name]),
            ...(refs || {}),
        };
        meta.itemNamesByItemType[type].push(name);
        meta.recordedSubscribeChanges.itemTypesBool[type] = true;
        // if (!meta.recordedSubscribeChanges.itemNamesBool[type]) {
        //   meta.recordedSubscribeChanges.itemNamesBool[type] = {};
        // }
        meta.recordedSubscribeChanges.itemNamesBool[type][name] = true;
        meta.recordedSubscribeChanges.somethingChanged = true;
        meta.recordedDeriveChanges.itemTypesBool[type] = true;
        // if (!meta.recordedDeriveChanges.itemNamesBool[type]) {
        //   meta.recordedDeriveChanges.itemNamesBool[type] = {};
        // }
        meta.recordedDeriveChanges.itemNamesBool[type][name] = true;
        meta.recordedDeriveChanges.somethingChanged = true;
    }, callback);
}
