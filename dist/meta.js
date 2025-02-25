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
    // Items -----------------------------------------------------
    prevState: {},
    nowState: {},
    nowRefs: {},
    stepNames: ["default"],
    // Live info -----------------------------------------------------
    nowStepName: "default",
    nowStepIndex: 0,
    nowEffectPhase: "duringStep",
    isFirstDuringPhaseLoop: true,
    nowMetaPhase: "waitingForFirstUpdate",
    willAddItemsInfo: {},
    willRemoveItemsInfo: {},
    isRunningSetStates: false,
    didInit: false,
    didStartFirstFrame: false, // so we can add items instantly before the first frame
    // Recording changes -----------------------------------------------------
    diffInfo: initialDiffInfo,
    // this gets reset for each step (might not still be true)
    recordedEffectChanges: initialRecordedChanges(), // resets every time a steps derive listeners run, only records changes made while deriving?
    // this gets reset at the start of a frame, and kept added to throughout the frame
    recordedStepEndEffectChanges: initialRecordedChanges(),
    //
    // recordedPropIdsChanged_duringStep: {},
    // recordedPropIdsChanged_endOfStep: {},
    recordedPropIdsChangedMap: { duringStep: {}, endOfStep: {} },
    // Frames -----------------------------------------------------
    nextFrameIsFirst: true, // when the next frame is the first in a chain of frames
    previousFrameTime: 0,
    latestFrameTime: 0,
    latestFrameDuration: 16.66667,
    shouldRunUpdateAtEndOfUpdate: false,
    // Callback queues -----------------------------------------------------
    addAndRemoveItemsQueue: [],
    effectsRunAtStartQueue: [],
    startEffectsQueue: [],
    setStatesQueue: [],
    nextTickQueue: [],
    // Effects -----------------------------------------------------
    autoEffectIdCounter: 1,
    // Normal effects
    liveEffectsMap: {},
    // effectIdsByPhaseByStep: { duringStep: {}, endOfStep: {} } as Record<
    //   EffectPhase,
    //   Record<string, string[]> //  phase : stepName : listenerNames[]  // derive: checkInput: ['whenKeyboardPressed']
    // >,
    effectIdsByPhaseByStepByPropId: { duringStep: {}, endOfStep: {} },
    storedEffectsMap: {},
    effectIdsByGroup: {}, // effectGroup: [effectId]
    // Param effects
    allParamEffectGroups: {},
    paramEffectIdsByGroupPlusParamKey: {}, // effectGroup: {paramKey: [effectId]}
    //
    // propIdsChangedInSetStateByPhaseByStep: { duringStep: {}, endOfStep: {} } as Record<
    //   EffectPhase,
    //   Record<string, string[]>
    // >, // phase: stepName: propPathId[]
    // Cached info -----------------------------------------------------
    itemTypeNames: [],
    propNamesByItemType: {},
    itemIdsByItemType: {}, // current item names only, not previous..
    prevItemIdsByItemType: {}, // this should be manually copied when the prevState is copied
    defaultRefsByItemType: {},
    defaultStateByItemType: {},
    // PropPathId info
    itemTypeByPropPathId: {}, // For propPathId like pieces.piecePropertyA and alsp pieces.__added
    propKeyByPropPathId: {}, // To get "piecePropertyA" from "pieces.piecePropertyA" quickly ( in O(1) time )
    specialKeyByPropPathId: {}, // For special keys like __added, __removed
};
