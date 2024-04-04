export const initialRecordedChanges = () => ({
    itemTypesBool: {},
    itemIdsBool: {},
    itemPropsBool: {},
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
export const repondMeta = {
    // prevStatesByStep: {
    //   default: {},
    // } as Record<string, any>,
    //
    // this gets reset for each step (might not still be true)
    recordedEffectChanges: initialRecordedChanges(), // resets every time a steps derive listeners run, only records changes made while deriving?
    // this gets reset at the start of a frame, and kept added to throughout the frame
    recordedStepEndEffectChanges: initialRecordedChanges(),
    nextFrameIsFirst: true, // when the next frame is the first in a chain of frames
    latestFrameId: 0,
    previousFrameTime: 0,
    latestFrameTime: 0,
    latestFrameDuration: 16.66667,
    shortestFrameDuration: 16.6666667, // the screens frameRate
    foundScreenFramerate: false,
    lookingForScreenFramerate: false,
    //
    latestUpdateTime: 0,
    latestUpdateDuration: 16.66667, // how long everything inside "update" took
    frameRateTypeOption: "auto",
    frameRateType: "full",
    lateFramesAmount: 0, // if there's a late frame this increases by 15, if not it decreases by 1
    shouldRunUpdateAtEndOfUpdate: false,
    //
    diffInfo: initialDiffInfo,
    // state
    prevState: {},
    nowState: {},
    initialState: {},
    // refs
    nowRefs: {},
    nowMetaPhase: "waitingForFirstUpdate",
    // functions
    addAndRemoveItemsQue: [],
    effectsRunAtStartQueue: [],
    startEffectsQue: [],
    setStatesQue: [],
    callbacksQue: [],
    //
    allEffects: {},
    effectIdsByPhaseByStep: { duringStep: {}, endOfStep: {} },
    allEffectGroups: {},
    allParamEffectGroups: {},
    paramEffectIdsByGroupPlusParamKey: {}, // effectGroup: {paramKey: [effectId]}
    //
    itemTypeNames: [],
    propNamesByItemType: {},
    itemIdsByItemType: {}, // current item names only, not previous..
    defaultRefsByItemType: {},
    defaultStateByItemType: {},
    willAddItemsInfo: {},
    willRemoveItemsInfo: {},
    copyStates: (nowState, saveToObject, recordedChanges, // NOTE these aren't used, but added to have same type as mergeStates
    allRecordedChanges // NOTE these aren't used, but added to have same type as mergeStates
    ) => { },
    mergeStates: (newStates, saveToObject, recordedChanges, allRecordedChanges) => { },
    getStatesDiff: (nowState, prevState, diffInfo, recordedChanges, checkAllChanges) => { },
    // react specific?
    autoEffectIdCounter: 1,
    //
    stepNames: ["default"],
    nowStepName: "default",
    nowStepIndex: 0,
};
