export const initialRecordedChanges = () => ({
    itemTypesBool: {},
    itemNamesBool: {},
    itemPropertiesBool: {},
    somethingChanged: false,
});
export const initialRecordedChangesSet = () => ({
    think: initialRecordedChanges(),
    draw: initialRecordedChanges(),
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

store all the think and draw changes lik enormal?
but then, if setState is run when a step has already run, add it to the

*/
const pietemMeta = {
    // any changes that happened after a step ran, and before the callbacks ran (that would otherwise be msised by recordedDrawChanges and recordedThinkChanges)
    // recordedChangesByStep: {
    //   default: initialRecordedChangesSet(),
    // } as Record<string, ReturnType<typeof initialRecordedChangesSet>>,
    // prevStatesByStep: {
    //   default: {},
    // } as Record<string, any>,
    //
    // this gets reset at the start of a frame, and kept added to throughout the frame
    recordedSubscribeChanges: initialRecordedChanges(),
    // this gets reset for each step
    recordedDeriveChanges: initialRecordedChanges(),
    nextFrameIsFirst: true,
    latestFrameId: 0,
    previousFrameTime: 0,
    latestFrameTime: 0,
    latestFrameDuration: 16.66667,
    diffInfo: initialDiffInfo,
    // state
    previousState: {},
    currentState: {},
    initialState: {},
    // refs
    currentRefs: {},
    currentPhase: "waitingForFirstUpdate",
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
export default pietemMeta;
export function toSafeListenerName(prefix) {
    const theId = pietemMeta.autoListenerNameCounter;
    pietemMeta.autoListenerNameCounter += 1;
    return (prefix || "autoListener") + "_" + theId;
}
