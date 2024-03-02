import meta, { RecordedChanges, RepondMetaPhase } from "./meta";
import { forEach } from "chootils/dist/loops";
import checkInnerEffects from "repond/src/checkInnerEffects";
import { EffectPhase } from "./types";
import { runNextFrame } from "./setting";

/*

ohhh, every setState is qued and run when the frame runs, so setState never runs before the frame)
but they run in a specific order so could get overwritten

and rereunning setState inside listeners is a way to change the values not depending on order

*/

function updateDiffInfo(recordedChanges: RecordedChanges) {
  //  make a diff of the changes
  meta.getStatesDiff(
    meta.currentState,
    meta.previousState,
    meta.diffInfo,
    recordedChanges,
    false // checkAllChanges
  );
}

function setMetaPhase(metaPhase: RepondMetaPhase) {
  meta.currentMetaPhase = metaPhase;
}

function updateFrameTimes(animationFrameTime: number) {
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
  } else {
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

function runAddListeners() {
  // adding listeners (rules) are queued and happen here
  // removing listeners happens instantly

  for (let index = 0; index < meta.startInnerEffectsQue.length; index++) {
    const loopedUpdateFunction = meta.startInnerEffectsQue[index];
    loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
  }

  meta.startInnerEffectsQue.length = 0;
}

function runListenersWithRunAtStart() {
  for (let index = 0; index < meta.innerEffectsRunAtStartQueue.length; index++) {
    const loopedUpdateFunction = meta.innerEffectsRunAtStartQueue[index];
    loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
  }

  meta.innerEffectsRunAtStartQueue.length = 0;
}

function runAddAndRemove() {
  for (let index = 0; index < meta.addAndRemoveItemsQue.length; index++) {
    const loopedUpdateFunction = meta.addAndRemoveItemsQue[index];
    loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
  }

  meta.addAndRemoveItemsQue.length = 0;
}

function runListeners(phase: EffectPhase, stepName: string) {
  const listenerNamesToRun = checkInnerEffects(phase, stepName);

  for (let index = 0; index < listenerNamesToRun.length; index++) {
    const name = listenerNamesToRun[index];
    if (meta.allInnerEffects[name]) meta.allInnerEffects[name].run(meta.diffInfo, meta.latestFrameDuration);
  }
}

function runCallbacks(callbacksToRun: any[]) {
  for (let index = 0; index < callbacksToRun.length; index++) {
    const loopedCallback = callbacksToRun[index];
    loopedCallback(meta.latestFrameDuration, meta.latestFrameTime);
  }
}

const copiedCallbacks: any[] = [];

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

function runAllCallfowards() {
  let copiedCallforwards: any[] = [];
  if (meta.callforwardsQue.length > 0) {
    copiedCallforwards = meta.callforwardsQue.slice(0) || [];
    meta.callforwardsQue.length = 0;
    meta.callforwardsQue = [];
  }
  runCallbacks(copiedCallforwards);
}

export function createRecordedChanges(recordedChanges: RecordedChanges) {
  recordedChanges.itemTypesBool = {};
  recordedChanges.itemNamesBool = {};
  recordedChanges.itemPropertiesBool = {};

  forEach(meta.itemTypeNames, (itemType) => {
    recordedChanges.itemTypesBool[itemType] = false;
    recordedChanges.itemNamesBool[itemType] = {};
    recordedChanges.itemPropertiesBool[itemType] = {};

    forEach(meta.itemNamesByItemType[itemType], (itemName) => {
      recordedChanges.itemNamesBool[itemType][itemName] = false;
      recordedChanges.itemPropertiesBool[itemType][itemName] = {};

      forEach(meta.propNamesByItemType[itemType], (propName) => {
        recordedChanges.itemPropertiesBool[itemType][itemName][propName]; // should have = false here?
      });
    });
  });

  recordedChanges.somethingChanged = false;
}

function resetRecordedChanges(recordedChanges: RecordedChanges) {
  recordedChanges.somethingChanged = false;

  for (let typeIndex = 0; typeIndex < meta.itemTypeNames.length; typeIndex++) {
    const itemType = meta.itemTypeNames[typeIndex];
    recordedChanges.itemTypesBool[itemType] = false;

    for (let nameIndex = 0; nameIndex < meta.itemNamesByItemType[itemType].length; nameIndex++) {
      const itemName = meta.itemNamesByItemType[itemType][nameIndex];
      recordedChanges.itemNamesBool[itemType][itemName] = false;

      for (let propIndex = 0; propIndex < meta.propNamesByItemType[itemType].length; propIndex++) {
        const propName = meta.propNamesByItemType[itemType][propIndex];
        recordedChanges.itemPropertiesBool[itemType][itemName][propName] = false;
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

function runStepEffects(stepName: string) {
  resetRecordedStepChanges(); // NOTE recently added to prevent derive changes being remembered each time it derives again
  runListenersWithRunAtStart(); // run the runAtStart listeners
  runListeners("duringStep", stepName); //  a running derive-listener can add more to the setStates que (or others)
  runAddListeners(); // add rules / effects
  runAddAndRemove(); // add and remove items
  runSetStates(); // run the qued setStates
  updateDiffInfo(meta.recordedEffectChanges);
}

function removeRemovedItemRefs() {
  if (!meta.diffInfo.itemsRemoved) return;

  for (let changedIndex = 0; changedIndex < meta.diffInfo.itemTypesChanged.length; changedIndex++) {
    const loopedItemType = meta.diffInfo.itemTypesChanged[changedIndex];

    for (let removedIndex = 0; removedIndex < meta.diffInfo.itemsRemoved[loopedItemType].length; removedIndex++) {
      const removedItemName = meta.diffInfo.itemsRemoved[loopedItemType][removedIndex];
      delete meta.currentRefs[loopedItemType][removedItemName];
    }
  }
}

function runSetOfStepEffects(stepName: string) {
  meta.currentMetaPhase = "runningInnerEffects";

  runStepEffects(stepName);
  if (!meta.recordedEffectChanges.somethingChanged) return;
  runStepEffects(stepName);
  if (!meta.recordedEffectChanges.somethingChanged) return;
  runStepEffects(stepName);
  if (!meta.recordedEffectChanges.somethingChanged) return;
  runStepEffects(stepName);
  if (!meta.recordedEffectChanges.somethingChanged) return;
  runStepEffects(stepName);
  if (!meta.recordedEffectChanges.somethingChanged) return;
  runStepEffects(stepName);
  if (!meta.recordedEffectChanges.somethingChanged) return;
  runStepEffects(stepName);
  if (!meta.recordedEffectChanges.somethingChanged) return;
  runStepEffects(stepName);
  if (!meta.recordedEffectChanges.somethingChanged) return;

  console.warn("WARNING: running step effects a lot");

  console.log("step name", meta.currentStepName);
  console.log("effect names");

  console.log(JSON.stringify(meta.innerEffectNamesByPhaseByStep.duringStep?.[meta.currentStepName], null, 2));

  console.log("changes");
  console.log(
    JSON.stringify(
      Object.entries(meta.recordedEffectChanges.itemTypesBool)
        .filter((item) => item[1] === true)
        .map((item) =>
          Object.values(meta.recordedEffectChanges.itemPropertiesBool[item[0]]).map((value) =>
            Object.entries(value)
              .filter((propEntry) => propEntry[1] === true)
              .map((propEntry) => propEntry[0])
          )
        ),
      null,
      2
    )
  );

  // meta.recordedDeriveChanges.itemPropertiesBool
  // );
}

function runStepEndEffectsShortcut(stepName: string) {
  meta.currentMetaPhase = "runningStepEndInnerEffects"; // hm not checked anywhere, but checking metaPhase !== "runningDerivers" is
  updateDiffInfo(meta.recordedStepEndEffectChanges); // the diff for all the combined derriver changes
  runListeners("endOfStep", stepName); //  Then it runs the stepEnd effects based on the diff
}

function runAStep(stepName: string) {
  runSetOfStepEffects(stepName);
  runStepEndEffectsShortcut(stepName);
}

function runAStepLoop() {
  runAStep(meta.currentStepName);
  meta.currentStepIndex += 1;
  meta.currentStepName = meta.stepNames[meta.currentStepIndex];
}

function runSetOfStepsLoopShortcut() {
  meta.currentStepIndex = 0;
  meta.currentStepName = meta.stepNames[meta.currentStepIndex];

  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;
  runAStepLoop();
  if (!meta.stepNames[meta.currentStepIndex]) return;

  console.warn("tried to run a 30th step", meta.stepNames.length);
}

export function _updateRepond(animationFrameTime: number) {
  updateFrameTimes(animationFrameTime);
  meta.latestUpdateTime = performance.now();

  setMetaPhase("runningUpdates");
  // save previous state, ,
  // this won't this disreguard all the state stuff from the callbacks
  // because all the setStates are delayed, and get added to meta.whatToRunWhenUpdating to run later
  meta.copyStates(meta.currentState, meta.previousState);

  runSetOfStepsLoopShortcut();

  resetRecordedStepEndChanges(); // maybe resetting recorded changes here is better, before the callbacks run? maybe it doesnt matter?

  setMetaPhase("waitingForFirstUpdate");
  runAllCallbacks();
  removeRemovedItemRefs();

  // runAllCallfowards(); // Moved callforwarsd to end of frame to help frame pacing issue on android? have also moved callforwarsd to inside callbacks

  // if theres nothing running on next frame
  meta.nextFrameIsFirst = meta.setStatesQue.length === 0;
  meta.latestUpdateDuration = performance.now() - meta.latestUpdateTime;

  if (meta.shouldRunUpdateAtEndOfUpdate) {
    runNextFrame();
    meta.shouldRunUpdateAtEndOfUpdate = false;
  }
}
