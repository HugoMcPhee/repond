import meta from "./meta";
import { forEach } from "shutils/dist/loops";
import checkListeners from "./checkListeners";
/*

ohhh, every setState is qued and run when the frame runs, so setState never runs before the frame)
but they run in a specific order so could get overwritten

and rereunning setState inside listeners is a way to change the values not depending on order

*/
function updateDiffInfo(recordedChanges) {
    //  make a diff of the changes
    meta.getStatesDiff(meta.currentState, meta.previousState, meta.diffInfo, recordedChanges, false // checkAllChanges
    );
}
function setPhase(phaseName) {
    meta.currentPhase = phaseName;
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
    forEach(meta.setStatesQue, (loopedUpdateFunction) => {
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    });
    meta.setStatesQue = [];
}
function runAddListeners() {
    // adding listeners (rules) are queued and happen here
    // removing listeners happens instantly
    forEach(meta.startListenersQue, (loopedUpdateFunction) => {
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    });
    meta.startListenersQue = [];
}
function runAddAndRemove() {
    forEach(meta.addAndRemoveItemsQue, (loopedUpdateFunction) => {
        loopedUpdateFunction(meta.latestFrameDuration, meta.latestFrameTime);
    });
    meta.addAndRemoveItemsQue = [];
}
function runListeners(listenerType, flowName) {
    const listenerNamesToRun = checkListeners(listenerType, flowName);
    forEach(listenerNamesToRun, (name) => {
        if (meta.allListeners[name])
            meta.allListeners[name].whatToDo(meta.diffInfo, meta.latestFrameDuration);
    });
}
function runCallbacks(callbacksToRun) {
    forEach(callbacksToRun, (loopedCallback) => {
        loopedCallback(meta.latestFrameDuration, meta.latestFrameTime);
    });
}
function runAllCallbacks() {
    let copiedCallbacks = [];
    if (meta.callbacksQue.length > 0) {
        copiedCallbacks = meta.callbacksQue.slice(0) || [];
        meta.callbacksQue.length = 0;
        meta.callbacksQue = [];
    }
    runCallbacks(copiedCallbacks);
}
function runAllCallfowards() {
    let copiedCallforwards = [];
    if (meta.callforwardsQue.length > 0) {
        copiedCallforwards = meta.callforwardsQue.slice(0) || [];
        meta.callforwardsQue.length = 0;
        meta.callforwardsQue = [];
    }
    runCallbacks(copiedCallforwards);
}
function resetRecordedChanges(recordedChanges) {
    recordedChanges.itemTypesBool = {};
    recordedChanges.itemNamesBool = {};
    recordedChanges.itemPropertiesBool = {};
    recordedChanges.somethingChanged = false;
}
function resetRecordedDrawChanges() {
    resetRecordedChanges(meta.recordedSubscribeChanges);
}
function resetRecordedDeriveChanges() {
    resetRecordedChanges(meta.recordedDeriveChanges);
}
// ohhhhhhhhhhhh waiiiiiiiittttttttt , hm
// the flows should all react to any changes made from previous flows
//
// let timeLogged = Date.now();
function runDeriveListeners(flowName) {
    resetRecordedDeriveChanges(); // NOTE recently added to prevent think/derive changes being remembered each time it thinks again
    runListeners("derive", flowName); //  a running think-listener can add more to the setStates que (or others)
    runAddListeners(); // add rules / effects
    runAddAndRemove(); // add and remove items
    runSetStates(); // run the qued setStates
    updateDiffInfo(meta.recordedDeriveChanges);
}
function removeRemovedItemRefs() {
    if (!meta.diffInfo.itemsRemoved)
        return;
    forEach(meta.diffInfo.itemTypesChanged, (loopedItemType) => {
        forEach(meta.diffInfo.itemsRemoved[loopedItemType], (removedItemName) => {
            delete meta.currentRefs[loopedItemType][removedItemName];
        });
    });
}
function runSetOfThinkListeners(flowName) {
    meta.currentPhase = "runningDeriveListeners";
    // recordedDeriveChanges are reset everytime a flow thinks?
    // resetRecordedDeriveChanges();
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    runDeriveListeners(flowName);
    if (!meta.recordedDeriveChanges.somethingChanged)
        return;
    console.warn("running think listeners a lot :S", Object.keys(meta.recordedDeriveChanges.itemTypesBool), Object.keys(meta.recordedDeriveChanges.itemPropertiesBool));
}
function runDrawListenersShortcut(flowName) {
    meta.currentPhase = "runningSubscribeListeners"; // hm not checked anywhere, but checking phase !== "runningDerivers" is
    updateDiffInfo(meta.recordedSubscribeChanges); // the diff for all the combined derriver changes
    runListeners("subscribe", flowName); //  Then it runs the subscribers based on the diff
}
function runAFlow(flowName) {
    runSetOfThinkListeners(flowName);
    runDrawListenersShortcut(flowName);
    // HERE? save the current state for that flow, so it can be used as the prevState for this flow next frame?
}
function runAFlowLoop() {
    runAFlow(meta.currentFlowName);
    meta.currentFlowIndex += 1;
    meta.currentFlowName = meta.flowNames[meta.currentFlowIndex];
}
function runSetOfFlowsLoopShortcut() {
    meta.currentFlowIndex = 0;
    meta.currentFlowName = meta.flowNames[meta.currentFlowIndex];
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    runAFlowLoop();
    if (!meta.flowNames[meta.currentFlowIndex])
        return;
    console.warn("tried to run a 30th flow", meta.flowNames.length);
}
export function _updateConcepto(animationFrameTime) {
    updateFrameTimes(animationFrameTime);
    runAllCallfowards();
    setPhase("runningUpdates");
    // save previous state, ,
    // this won't this disreguard all the state stuff from the callbacks?
    // because all the setStates are delayed, and get added to meta.whatToRunWhenUpdating to run later
    meta.copyStates(meta.currentState, meta.previousState);
    runSetOfFlowsLoopShortcut();
    setPhase("waitingForFirstUpdate");
    resetRecordedDrawChanges(); // maybe resetting recorded changes here is better, before the callbacks run? maybe it doesnt matter?
    runAllCallbacks();
    removeRemovedItemRefs();
    // if theres nothing running on next frame
    meta.nextFrameIsFirst = meta.setStatesQue.length === 0;
}
