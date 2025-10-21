import { breakableForEach, forEach } from "chootils/dist/loops";
import checkEffects from "./checkEffects";
import { copyChangedStates, copyItemIdsByItemType, copyStates } from "./copyStates";
import { getStatesDiff } from "./getStatesDiff";
import { updateRepondNextFrame } from "./helpers/frames";
import { warn } from "./helpers/logging";
import { repondMeta as meta, RecordedChanges, RepondMetaPhase } from "./meta";
import { EffectDef, EffectPhase } from "./types";

/**
 * Maximum number of times duringStep effects can loop before warning about potential infinite loops.
 * This prevents infinite setState cycles inside effects.
 */
const MAX_STEP_ITERATIONS = 8;

/**
 * Updates the diffInfo by comparing current state (nowState) with previous state (prevState).
 * This diff is used to determine which effects should run.
 *
 * @param recordedChanges - Tracks which items/props were modified during this phase
 */
function updateDiffInfo(recordedChanges: RecordedChanges) {
  // Calculate what changed by comparing nowState vs prevState
  // Uses recordedChanges to optimize - only checks items that were modified
  getStatesDiff(meta.nowState, meta.prevState, meta.diffInfo, recordedChanges, false /* checkAllChanges */);
}

/**
 * Sets the current meta phase (e.g., "runningEffects", "waitingForFirstUpdate").
 * Used for tracking what stage of the update cycle we're in.
 */
function setMetaPhase(metaPhase: RepondMetaPhase) {
  meta.nowMetaPhase = metaPhase;
}

/**
 * Updates frame timing information used for deltaTime calculations.
 * On the first frame, uses default 60fps timing (16.66667ms).
 *
 * @param animationFrameTime - Timestamp from requestAnimationFrame
 */
function updateFrameTimes(animationFrameTime: number) {
  meta.previousFrameTime = meta.latestFrameTime;
  meta.latestFrameTime = animationFrameTime;

  if (meta.nextFrameIsFirst === false) {
    // Calculate actual time since last frame
    meta.latestFrameDuration = meta.latestFrameTime - meta.previousFrameTime;
  } else {
    // First frame: assume 60fps (16.66667ms per frame)
    meta.latestFrameDuration = 16.66667;
  }
}

/**
 * Executes all queued setState operations.
 * setState calls are batched and executed together to:
 * - Optimize performance (single diff calculation)
 * - Allow later setStates to overwrite earlier ones in same frame
 * - Enable predictable state update ordering
 */
function runSetStates() {
  meta.isRunningSetStates = true;

  // Execute all queued setState operations
  for (let index = 0; index < meta.setStatesQueue.length; index++) {
    const loopedUpdateFunction = meta.setStatesQueue[index];
    loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
  }

  meta.isRunningSetStates = false;
  meta.setStatesQueue.length = 0; // Clear queue after processing
}

/**
 * Registers all queued effects (startEffect calls).
 * Effects are added to the live effects map here.
 * Note: Removing effects happens instantly (not queued).
 */
function runAddEffects() {
  for (let index = 0; index < meta.startEffectsQueue.length; index++) {
    const loopedUpdateFunction = meta.startEffectsQueue[index];
    loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
  }

  meta.startEffectsQueue.length = 0;
}

/**
 * Runs effects that have `runAtStart: true` set.
 * These effects run before the main effect loop.
 */
function runEffectsWithRunAtStart() {
  for (let index = 0; index < meta.effectsRunAtStartQueue.length; index++) {
    const loopedUpdateFunction = meta.effectsRunAtStartQueue[index];
    loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
  }

  meta.effectsRunAtStartQueue.length = 0;
}

/**
 * Executes all queued addItem and removeItem operations.
 * Also clears the predictive info (willAddItemsInfo, willRemoveItemsInfo)
 * used by getItemWillBeAdded/getItemWillBeRemoved.
 */
function runAddAndRemove() {
  for (let index = 0; index < meta.addAndRemoveItemsQueue.length; index++) {
    const loopedUpdateFunction = meta.addAndRemoveItemsQueue[index];
    loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
  }

  // Clear predictive info after items are actually added/removed
  meta.willAddItemsInfo = {};
  meta.willRemoveItemsInfo = {};
  meta.addAndRemoveItemsQueue.length = 0;
}

/**
 * Runs a per-item effect for a specific item type.
 *
 * This is the core optimization: only runs the effect for items that actually changed.
 * Checks three scenarios:
 * 1. Items that were added (if effect watches additions)
 * 2. Items that were removed (if effect watches removals)
 * 3. Items whose watched properties changed
 *
 * @param effect - The effect to run
 * @param type - The item type to check (e.g., "player", "enemy")
 */
function runEffectChangesPerItemForItemType(effect: EffectDef, type: string) {
  const diffInfo = meta.diffInfo;
  const allowedIdsMap = effect._allowedIdsMap; // If set, only these item IDs are allowed
  const props = effect._propsByItemType?.[type]; // Properties this effect watches
  const frameDuration = meta.latestFrameDuration;

  const shouldCheckAdded = effect._checkAddedByItemType?.[type];
  const shouldCheckRemoved = effect._checkRemovedByItemType?.[type];

  // Track which items already ran to avoid running effect multiple times for same item
  let alreadyRanIdsMap = undefined as { [itemId: string]: boolean } | undefined;

  // Handle item additions and removals
  if (shouldCheckAdded || shouldCheckRemoved) {
    if (shouldCheckAdded) {
      const itemsAddedIds = diffInfo.itemsAdded[type];
      itemsAddedIds.forEach((itemId) => {
        // Only run if item is in allowed list (or no allowed list exists)
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
        // Only run if item is in allowed list and hasn't already run
        if (!allowedIdsMap || (allowedIdsMap[itemId] && !alreadyRanIdsMap?.[itemId])) {
          effect.run(itemId, meta.diffInfo, frameDuration, false);
          alreadyRanIdsMap = alreadyRanIdsMap ?? {};
          alreadyRanIdsMap[itemId] = true;
        }
      });
    }
  }

  // If there are no properties to watch for this item type, we're done
  if (!props?.length) return;

  // Check items with property changes
  forEach(diffInfo.itemsChanged[type], (itemIdThatChanged) => {
    // Skip if item is not in allowed list
    if (!(!allowedIdsMap || (allowedIdsMap && allowedIdsMap[itemIdThatChanged as string]))) return;

    // Check if any of the watched properties changed
    breakableForEach(props, (propName) => {
      if (!diffInfo.propsChangedBool[type][itemIdThatChanged][propName]) return;
      if (alreadyRanIdsMap?.[itemIdThatChanged]) return; // Skip if already ran

      // Run effect for this item
      effect.run(itemIdThatChanged, meta.diffInfo, frameDuration, false);
      return true; // Break out of loop - only run once per item
    });
  });
}

/**
 * Runs all effects that should trigger for the given phase and step.
 *
 * Effects come in two types:
 * - Per-item effects: Run for each item that changed (optimized, O(changed items))
 * - Global effects: Run once regardless of what changed
 *
 * @param phase - Either "duringStep" or "endOfStep"
 * @param stepName - The current step name (e.g., "default", "physics", "rendering")
 */
function runEffects(phase: EffectPhase, stepName: string) {
  // Determine which effects should run based on what changed
  const effectNamesToRun = checkEffects(phase, stepName);

  for (let index = 0; index < effectNamesToRun.length; index++) {
    const name = effectNamesToRun[index];
    const effect = meta.liveEffectsMap[name];
    if (!effect) return warn("no effect found for ", name);

    if (effect.isPerItem) {
      // Per-item effect: run for each changed item
      const itemTypes = effect._itemTypes;
      if (!itemTypes) return warn("no item types found for ", name);

      if (itemTypes?.length === 1) {
        // Optimization: if only one item type, skip forEach
        runEffectChangesPerItemForItemType(effect, itemTypes[0]);
      } else {
        // Multiple item types: run for each type
        forEach(itemTypes, (type) => runEffectChangesPerItemForItemType(effect, type));
      }
    } else {
      // Global effect: run once with empty itemId
      effect.run("", meta.diffInfo, meta.latestFrameDuration, false);
    }
  }
}

/**
 * Executes an array of callbacks with frame timing info.
 */
function runCallbacks(callbacksToRun: any[]) {
  for (let index = 0; index < callbacksToRun.length; index++) {
    const loopedCallback = callbacksToRun[index];
    loopedCallback(meta.latestFrameDuration, meta.latestFrameTime);
  }
}

/**
 * Reusable array for copying callbacks (avoids allocation).
 */
const copiedCallbacks: any[] = [];

/**
 * Runs callbacks queued with `onNextTick()`.
 * These run after all effects and state updates complete.
 *
 * Callbacks are copied to avoid issues if callbacks queue more callbacks.
 */
function runNextTickCallbacks() {
  if (meta.nextTickQueue.length > 0) {
    // Copy callbacks before running (in case callbacks add more to queue)
    for (let index = 0; index < meta.nextTickQueue.length; index++) {
      copiedCallbacks.push(meta.nextTickQueue[index]);
    }
    meta.nextTickQueue.length = 0;
  }
  runCallbacks(copiedCallbacks);
  copiedCallbacks.length = 0;
}

/**
 * Initializes the recordedChanges data structure.
 * This tracks which items/props changed during setState operations.
 * Used to optimize diff calculation (only check what was actually modified).
 */
export function createRecordedChanges(recordedChanges: RecordedChanges) {
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
        recordedChanges.itemPropsBool[itemType][itemId][propName]; // TODO: should initialize to false?
      });
    });
  });

  recordedChanges.somethingChanged = false;
}

/**
 * Resets the recorded changes tracker to default state.
 * Called between effect phases to start fresh tracking.
 *
 * Note: Commented-out code suggests potential optimization to only reset
 * what actually changed (rather than resetting everything).
 */
function resetRecordedChanges(recordedChanges: RecordedChanges) {
  recordedChanges.somethingChanged = false;

  for (let typeIndex = 0; typeIndex < meta.itemTypeNames.length; typeIndex++) {
    const itemType = meta.itemTypeNames[typeIndex];
    recordedChanges.itemTypesBool[itemType] = false;
    recordedChanges.itemIdsBool[itemType] = {};
    recordedChanges.itemPropsBool[itemType] = {};

    // Commented out: potential optimization to only reset changed items
    // for (let nameIndex = 0; nameIndex < meta.itemIdsByItemType[itemType].length; nameIndex++) {
    //   const itemId = meta.itemIdsByItemType[itemType][nameIndex];
    //   recordedChanges.itemIdsBool[itemType][itemId] = false;

    //   for (let propIndex = 0; propIndex < meta.propNamesByItemType[itemType].length; propIndex++) {
    //     const propName = meta.propNamesByItemType[itemType][propIndex];
    //     recordedChanges.itemPropsBool[itemType][itemId][propName] = false;
    //   }
    // }
  }
}

/**
 * Resets the step-end effect changes tracker.
 */
function resetRecordedStepEndChanges() {
  resetRecordedChanges(meta.recordedStepEndEffectChanges);
}

/**
 * Resets the duringStep effect changes tracker.
 */
function resetRecordedStepChanges() {
  resetRecordedChanges(meta.recordedEffectChanges);
}

/**
 * Runs a single iteration of "duringStep" effects.
 *
 * This is called in a loop (up to MAX_STEP_ITERATIONS times) until no more changes occur.
 *
 * Execution order:
 * 1. Reset recorded changes (fresh start for this iteration)
 * 2. Run effects with runAtStart: true
 * 3. Run duringStep effects (can queue more setStates)
 * 4. Register new effects (startEffect calls)
 * 5. Add/remove items
 * 6. Execute queued setStates
 * 7. Update diffInfo for next iteration
 *
 * Note: First iteration uses diffInfo from previous step's endOfStep phase,
 * allowing effects to react to changes from the prior step.
 *
 * @param stepName - Current step (e.g., "default", "physics", "rendering")
 */
function runStepEffects(stepName: string) {
  resetRecordedStepChanges(); // Fresh tracking for this iteration (prevents carrying over "derived" changes)
  runEffectsWithRunAtStart(); // Run effects with runAtStart: true
  runEffects("duringStep", stepName); // Run duringStep effects (can trigger more setStates)
  meta.recordedPropIdsChangedMap.duringStep = {}; // Clear recorded prop IDs
  runAddEffects(); // Register new effects
  runAddAndRemove(); // Add and remove items
  runSetStates(); // Execute queued setState operations
  updateDiffInfo(meta.recordedEffectChanges); // Calculate diff for next iteration
}

/**
 * Cleans up refs for items that were removed.
 * Refs are stored separately from state and need manual cleanup.
 * Called at the end of the update cycle.
 */
function removeRemovedItemRefs() {
  if (!meta.diffInfo.itemsRemoved) return;

  for (let changedIndex = 0; changedIndex < meta.diffInfo.itemTypesChanged.length; changedIndex++) {
    const loopedItemType = meta.diffInfo.itemTypesChanged[changedIndex];

    for (let removedIndex = 0; removedIndex < meta.diffInfo.itemsRemoved[loopedItemType].length; removedIndex++) {
      const removedItemId = meta.diffInfo.itemsRemoved[loopedItemType][removedIndex];
      delete meta.nowRefs[loopedItemType][removedItemId];
    }
  }
}

/**
 * Runs the duringStep effects in a loop until no changes occur.
 *
 * Loops up to MAX_STEP_ITERATIONS times. If still changing after that,
 * warns about potential infinite loop.
 *
 * This allows "derived" state patterns where effects set state based on other state,
 * and those changes trigger more effects, etc., until everything settles.
 *
 * @param stepName - Current step name
 */
function runSetOfStepEffects(stepName: string) {
  meta.nowMetaPhase = "runningEffects";
  meta.nowEffectPhase = "duringStep";
  meta.isFirstDuringPhaseLoop = true;

  for (let i = 0; i < MAX_STEP_ITERATIONS; i++) {
    runStepEffects(stepName);
    meta.isFirstDuringPhaseLoop = false;

    // Exit early if nothing changed (state has settled)
    if (!meta.recordedEffectChanges.somethingChanged) return;
  }

  // Still changing after MAX_STEP_ITERATIONS - likely infinite loop
  logTooManySetStatesMessage();
}

/**
 * Runs the endOfStep effects once.
 * These run after all duringStep effects have completed (state has settled).
 * Good for effects that need the "final" state of the step.
 *
 * @param stepName - Current step name
 */
function runStepEndEffects(stepName: string) {
  meta.nowMetaPhase = "runningStepEndEffects";
  meta.nowEffectPhase = "endOfStep";

  // Update diff based on all accumulated changes from duringStep
  updateDiffInfo(meta.recordedStepEndEffectChanges);

  // Run endOfStep effects (atStepEnd: true)
  runEffects("endOfStep", stepName);
}

/**
 * Runs a complete step: duringStep loop + endOfStep effects.
 *
 * @param stepName - Current step name (e.g., "physics", "rendering")
 */
function runAStep(stepName: string) {
  runSetOfStepEffects(stepName);
  runStepEndEffects(stepName);
}

/**
 * Runs one step and advances to the next step.
 */
function runAStepLoop() {
  runAStep(meta.nowStepName);
  meta.nowStepIndex += 1;
  meta.nowStepName = meta.stepNames[meta.nowStepIndex];
}

/**
 * Runs all steps in order (e.g., "physics" → "gameLogic" → "rendering").
 * This is the top-level step orchestration.
 */
function runSetOfStepsLoop() {
  meta.nowStepIndex = 0;
  meta.nowStepName = meta.stepNames[meta.nowStepIndex];

  for (let i = 0; i < meta.stepNames.length; i++) {
    runAStepLoop();
    // Exit if we've run out of steps
    if (!meta.stepNames[meta.nowStepIndex]) return;
  }
}

/**
 * Main update function called by requestAnimationFrame.
 * This orchestrates the entire Repond update cycle.
 *
 * Update flow:
 * 1. Update frame timing
 * 2. Save current state to prevState
 * 3. Run all steps (physics → logic → rendering, etc.)
 * 4. Run onNextTick callbacks
 * 5. Clean up removed item refs
 * 6. Schedule next frame if needed
 *
 * @param animationFrameTime - Timestamp from requestAnimationFrame (DOMHighResTimeStamp)
 */
export function _updateRepond(animationFrameTime: number) {
  meta.didStartFirstFrame = true;
  updateFrameTimes(animationFrameTime);

  setMetaPhase("runningUpdates");

  // Save current state as previous state for getPrevState() and diffing
  // Note: Only copies what changed (optimization over copying everything)
  // setState calls are queued, so this doesn't discard them
  copyChangedStates(meta.nowState, meta.prevState);

  // Copy item IDs to track which items were added/removed
  copyItemIdsByItemType(meta.itemIdsByItemType, meta.prevItemIdsByItemType);

  // Run all steps in order
  runSetOfStepsLoop();

  // Reset tracking for next frame
  resetRecordedStepEndChanges();
  meta.recordedPropIdsChangedMap.endOfStep = {};

  setMetaPhase("waitingForFirstUpdate");

  // Run callbacks queued with onNextTick()
  runNextTickCallbacks();

  // Clean up refs for removed items
  removeRemovedItemRefs();

  // Track if next frame is first (for frame duration calculation)
  meta.nextFrameIsFirst = meta.setStatesQueue.length === 0;

  // If more updates were queued during this update, schedule next frame
  if (meta.shouldRunUpdateAtEndOfUpdate) {
    updateRepondNextFrame();
    meta.shouldRunUpdateAtEndOfUpdate = false;
  }
}

// ------------------------------
// Debugging helpers

/**
 * Logs a warning when step effects run too many times (MAX_STEP_ITERATIONS).
 * Indicates a potential infinite loop caused by an effect setting state it watches.
 * Provides debugging info: step name, effect IDs, and what changed.
 */
function logTooManySetStatesMessage() {
  warn("WARNING: running step effects a lot, there may be an infinite setState inside an effect");
  console.log("Step name: ", meta.nowStepName);
  console.log("Effect ids:");
  console.log(JSON.stringify(meta.effectIdsByPhaseByStepByPropId.duringStep?.[meta.nowStepName], null, 2));
  console.log("Changes");
  console.log(JSON.stringify(getDebugStepEffectsData(), null, 2));
}

/**
 * Extracts debugging data about what changed during step effects.
 * Returns item types and properties that were modified.
 */
function getDebugStepEffectsData() {
  return Object.entries(meta.recordedEffectChanges.itemTypesBool)
    .filter((item) => item[1] === true)
    .map((item) =>
      Object.values(meta.recordedEffectChanges.itemPropsBool[item[0]]).map((value) =>
        Object.entries(value)
          .filter((propEntry) => propEntry[1] === true)
          .map((propEntry) => propEntry[0])
      )
    );
}
