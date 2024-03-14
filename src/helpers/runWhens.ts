import { repondMeta as meta } from "../meta";
import { _updateRepond } from "../updating";
import { runNextFrameIfNeeded } from "./frames";

// Only runs when calling  _setState
export function runWhenUpdatingRepond(whatToRun: any, callback?: any) {
  meta.setStatesQue.push(whatToRun);
  if (callback) meta.callbacksQue.push(callback);
  runNextFrameIfNeeded();
}

export function runWhenStartingEffects(whatToRun: any) {
  meta.startEffectsQue.push(whatToRun);
  runNextFrameIfNeeded();
}

export function runWhenStoppingEffects(whatToRun: any) {
  // stopping listeners runs instantly
  whatToRun();
}

export function runWhenDoingEffectsRunAtStart(whatToRun: any, callback?: any) {
  meta.effectsRunAtStartQueue.push(whatToRun);
  if (callback) meta.effectsRunAtStartQueue.push(callback);
  runNextFrameIfNeeded();
}

export function runWhenAddingAndRemovingItems(whatToRun: any, callback?: any) {
  meta.addAndRemoveItemsQue.push(whatToRun);
  if (callback) meta.callbacksQue.push(callback);
  runNextFrameIfNeeded();
}
