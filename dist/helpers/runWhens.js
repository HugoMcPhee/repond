import { repondMeta as meta } from "../meta";
import { runNextFrameIfNeeded } from "./frames";
export function whenSettingStates(callback) {
    if (meta.isRunningSetStates) {
        callback();
    }
    else {
        meta.setStatesQueue.push(callback);
    }
    runNextFrameIfNeeded();
}
export function whenStartingEffects(callback) {
    meta.startEffectsQueue.push(callback);
    runNextFrameIfNeeded();
}
export function whenStoppingEffects(callback) {
    // stopping listeners runs instantly
    callback();
}
export function whenDoingEffectsRunAtStart(callback) {
    meta.effectsRunAtStartQueue.push(callback);
    runNextFrameIfNeeded();
}
export function runWhenAddingAndRemovingItems(callback) {
    if (!meta.didStartFirstFrame) {
        callback();
    }
    else {
        meta.addAndRemoveItemsQueue.push(callback);
        runNextFrameIfNeeded();
    }
}
