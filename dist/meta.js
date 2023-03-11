export const initialRecordedChanges = () => ({
    itemTypesBool: {},
    itemNamesBool: {},
    itemPropertiesBool: {},
    somethingChanged: false,
});
export const initialDiffInfo = {
    itemTypesChanged: [],
    itemsChanged: {},
    propsChanged: {},
    itemsAdded: {},
    itemsRemoved: {},
    itemTypesChangedBool: {},
    itemsChangedBool: {},
    propsChangedBool: {},
    itemsAddedBool: {},
    itemsRemovedBool: {},
};
/*

store all the derive and subscribe changes like normal?
but then, if setState is run when a step has already run, add it to the

*/
const repondMeta = {
    // prevStatesByStep: {
    //   default: {},
    // } as Record<string, any>,
    //
    // this gets reset at the start of a frame, and kept added to throughout the frame
    recordedSubscribeChanges: initialRecordedChanges(),
    // this gets reset for each step (might not still be true)
    recordedDeriveChanges: initialRecordedChanges(),
    nextFrameIsFirst: true,
    latestFrameId: 0,
    previousFrameTime: 0,
    latestFrameTime: 0,
    latestFrameDuration: 16.66667,
    shortestFrameDuration: 16.6666667,
    foundScreenFramerate: false,
    lookingForScreenFramerate: false,
    //
    latestUpdateTime: 0,
    latestUpdateDuration: 16.66667,
    frameRateTypeOption: "auto",
    frameRateType: "full",
    lateFramesAmount: 0,
    shouldRunUpdateAtEndOfUpdate: false,
    //
    diffInfo: initialDiffInfo,
    // state
    previousState: {},
    currentState: {},
    initialState: {},
    // refs
    currentRefs: {},
    currentMetaPhase: "waitingForFirstUpdate",
    // functions
    addAndRemoveItemsQue: [],
    startListenersQue: [],
    setStatesQue: [],
    callforwardsQue: [],
    callbacksQue: [],
    //
    allListeners: {},
    listenerNamesByPhaseByStep: { derive: {}, subscribe: {} },
    //
    itemTypeNames: [],
    propNamesByItemType: {},
    itemNamesByItemType: {},
    defaultRefsByItemType: {},
    defaultStateByItemType: {},
    copyStates: (currentObject, saveToObject, recordedChanges, // NOTE these aren't used, but added to have same type as mergeStates
    allRecordedChanges // NOTE these aren't used, but added to have same type as mergeStates
    ) => { },
    mergeStates: (newStates, saveToObject, recordedChanges, allRecordedChanges) => { },
    getStatesDiff: (currentObject, previousObject, diffInfo, recordedChanges, checkAllChanges) => { },
    // react specific?
    autoListenerNameCounter: 1,
    //
    stepNames: ["default"],
    currentStepName: "default",
    currentStepIndex: 0,
};
export default repondMeta;
export function toSafeListenerName(prefix) {
    const theId = repondMeta.autoListenerNameCounter;
    repondMeta.autoListenerNameCounter += 1;
    return (prefix || "autoListener") + "_" + theId;
}
