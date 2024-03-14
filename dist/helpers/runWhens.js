import { repondMeta as meta } from "../meta";
import { runNextFrameIfNeeded } from "./frames";
// Only runs when calling  _setState
export function runWhenUpdatingRepond(whatToRun, callback) {
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
export function runWhenAddingAndRemovingItems(whatToRun, callback) {
    meta.addAndRemoveItemsQue.push(whatToRun);
    if (callback)
        meta.callbacksQue.push(callback);
    runNextFrameIfNeeded();
}
