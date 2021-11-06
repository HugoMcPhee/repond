import meta from "./meta";
import { _updateConcepto } from "./updating";

function runNextFrameIfNeeded() {
  if (meta.currentPhase === "waitingForFirstUpdate") {
    meta.latestFrameId = requestAnimationFrame(_updateConcepto);

    meta.currentPhase = "waitingForMoreUpdates";
  }
}

// only runs when calling  _setState
function runWhenUpdatingConcepto(whatToRun: any, callback?: any) {
  meta.setStatesQue.push(whatToRun);
  if (callback) meta.callbacksQue.push(callback);
  runNextFrameIfNeeded();
}

export function runWhenStartingConceptoListeners(whatToRun: any) {
  meta.startListenersQue.push(whatToRun);
  runNextFrameIfNeeded();
}

export function runWhenStoppingConceptoListeners(whatToRun: any) {
  // stopping listeners runs instantly
  whatToRun();
}

function runWhenAddingAndRemovingConcepto(whatToRun: any, callback?: any) {
  meta.addAndRemoveItemsQue.push(whatToRun);
  if (callback) meta.callbacksQue.push(callback);
  runNextFrameIfNeeded();
}

export function _setState(newState: any, callback?: any) {
  runWhenUpdatingConcepto(() => {
    meta.mergeStates(
      typeof newState === "function" ? newState(meta.currentState) : newState,
      meta.currentState,
      meta.currentPhase === "runningDeriveListeners"
        ? meta.recordedDeriveChanges
        : meta.recordedSubscribeChanges,
      meta.recordedSubscribeChanges
    );
  }, callback);
}

export function _removeItem(
  { type: itemType, name: itemName }: { type: string; name: string },
  callback?: any
) {
  runWhenAddingAndRemovingConcepto(() => {
    // removing itemName
    delete meta.currentState[itemType][itemName];
    // delete meta.currentRefs[itemType][itemName]; // now done at the end of update concepto
    meta.recordedSubscribeChanges.itemTypesBool[itemType] = true;
    meta.recordedSubscribeChanges.somethingChanged = true;
    meta.recordedDeriveChanges.itemTypesBool[itemType] = true;
    meta.recordedDeriveChanges.somethingChanged = true;
  }, callback);
}

export function _addItem(
  {
    type,
    name,
    state,
    refs,
  }: {
    type: string;
    name: string;
    state?: any;
    refs?: any;
  },
  callback?: any
) {
  runWhenAddingAndRemovingConcepto(() => {
    meta.currentState[type][name] = {
      ...meta.defaultStateByItemType[type](name),
      ...(state || {}),
    };
    meta.currentRefs[type][name] = {
      ...meta.defaultRefsByItemType[type](name, meta.currentState[name]),
      ...(refs || {}),
    };
    meta.recordedSubscribeChanges.itemTypesBool[type] = true;
    if (!meta.recordedSubscribeChanges.itemNamesBool) {
      meta.recordedSubscribeChanges.itemNamesBool[type] = {};
    }
    meta.recordedSubscribeChanges.itemNamesBool[type][name] = true;
    meta.recordedSubscribeChanges.somethingChanged = true;
    meta.recordedDeriveChanges.itemTypesBool[type] = true;
    if (!meta.recordedDeriveChanges.itemNamesBool[type]) {
      meta.recordedDeriveChanges.itemNamesBool[type] = {};
    }
    meta.recordedDeriveChanges.itemNamesBool[type][name] = true;
    meta.recordedDeriveChanges.somethingChanged = true;
  }, callback);
}
