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
but then, if setState is run when a flow has already run, add it to the

*/
const conceptoMeta = {
    // any changes that happened after a flow ran, and before the callbacks ran (that would otherwise be msised by recordedDrawChanges and recordedThinkChanges)
    // recordedChangesByFlow: {
    //   default: initialRecordedChangesSet(),
    // } as Record<string, ReturnType<typeof initialRecordedChangesSet>>,
    // prevStatesByFlow: {
    //   default: {},
    // } as Record<string, any>,
    //
    // this gets reset at the start of a frame, and kept added to throughout the frame
    recordedSubscribeChanges: initialRecordedChanges(),
    // this gets reset for each flow
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
    listenerNamesByTypeByFlow: { derive: {}, subscribe: {} },
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
    flowNames: ["default"],
    currentFlowName: "default",
    currentFlowIndex: 0,
};
export default conceptoMeta;
export function toSafeListenerName(prefix) {
    const theId = conceptoMeta.autoListenerNameCounter;
    conceptoMeta.autoListenerNameCounter += 1;
    return (prefix || "autoListener") + "_" + theId;
}
