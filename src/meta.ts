import { EffectPhase, UntypedEffect } from "./types";

export type RecordedChanges = {
  itemTypesBool: { [type: string]: boolean };
  itemIdsBool: { [type: string]: { [itemId: string]: boolean } };
  itemPropsBool: { [type: string]: { [itemId: string]: { [itemProp: string]: boolean } } };
  somethingChanged: boolean;
};

export const initialRecordedChanges: () => RecordedChanges = () => ({
  itemTypesBool: {},
  itemIdsBool: {},
  itemPropsBool: {},
  somethingChanged: false,
});

export const initialDiffInfo: UntypedDiffInfo = {
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

type PropsByItemType<T, K extends keyof T> = keyof NonNullable<T[K]>[keyof T[keyof T]];

type DiffInfo_PropsChanged<T = any> = {
  [key: string]: { [itemId: string]: PropsByItemType<T, any>[] } & { all__?: PropsByItemType<T, any>[] };
} & { all__?: string[] };
type DiffInfo_PropsChangedBool<T = any> = {
  [K in any]: {
    [itemId: string]: { [K_P in PropsByItemType<T, any>]: boolean };
  } & { all__?: { [K_P in PropsByItemType<T, any>]: boolean } };
} & { all__?: { [K_P in string]: boolean } };

export type UntypedDiffInfo = {
  itemTypesChanged: [];
  itemsChanged: { [type: string]: string[] };
  itemsAdded: { [type: string]: string[] };
  itemsRemoved: { [type: string]: string[] };
  propsChanged: DiffInfo_PropsChanged;
  itemTypesChangedBool: { [type: string]: boolean };
  itemsChangedBool: { [type: string]: { [itemId: string]: boolean } };
  propsChangedBool: DiffInfo_PropsChangedBool;
  itemsAddedBool: { [type: string]: { [itemId: string]: boolean } };
  itemsRemovedBool: { [type: string]: { [itemId: string]: boolean } };
};

type AFunction = (...args: any[]) => void;

export type RepondMetaPhase =
  | "waitingForFirstUpdate"
  | "waitingForMoreUpdates"
  | "runningUpdates"
  | "runningEffects"
  | "runningStepEndEffects"
  | "runningCallbacks"; // might need more metaPhases for the different types of callbacks

const repondMeta = {
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
  frameRateTypeOption: "auto" as "full" | "half" | "auto",
  frameRateType: "full" as "full" | "half",
  lateFramesAmount: 0, // if there's a late frame this increases by 15, if not it decreases by 1
  shouldRunUpdateAtEndOfUpdate: false,
  //
  diffInfo: initialDiffInfo,
  // state
  prevState: {} as any,
  nowState: {} as any,
  initialState: {} as any,
  // refs
  nowRefs: {} as any,
  nowMetaPhase: "waitingForFirstUpdate" as RepondMetaPhase,
  // functions
  addAndRemoveItemsQue: [] as AFunction[],
  effectsRunAtStartQueue: [] as AFunction[],
  startEffectsQue: [] as AFunction[],
  setStatesQue: [] as AFunction[],
  callforwardsQue: [] as AFunction[], // runs at the start of a tick
  callbacksQue: [] as AFunction[],
  //
  allEffects: {} as Record<string, UntypedEffect>,
  effectIdsByPhaseByStep: { duringStep: {}, endOfStep: {} } as Record<
    EffectPhase,
    Record<string, string[]> //  phase : stepName : listenerNames[]  // derive: checkInput: ['whenKeyboardPressed']
  >,
  //
  allGroupedEffects: {} as Record<string, Record<string, UntypedEffect>>,
  //
  itemTypeNames: [] as string[],
  propNamesByItemType: {} as { [itemTypeName: string]: string[] },
  itemIdsByItemType: {} as { [itemTypeName: string]: string[] }, // current item names only, not previous..
  defaultRefsByItemType: {} as {
    [itemTypeName: string]: (itemId?: string, itemState?: any) => { [itemPropertyName: string]: any };
  },
  defaultStateByItemType: {} as {
    [itemTypeName: string]: (itemId?: string) => //   itemId?: string
    { [itemPropertyName: string]: any };
  },
  copyStates: (
    nowState: any,
    saveToObject: any,
    recordedChanges?: RecordedChanges, // NOTE these aren't used, but added to have same type as mergeStates
    allRecordedChanges?: RecordedChanges // NOTE these aren't used, but added to have same type as mergeStates
  ) => {},
  mergeStates: (
    newStates: any,
    saveToObject: any,
    recordedChanges: RecordedChanges,
    allRecordedChanges: RecordedChanges
  ) => {},
  getStatesDiff: (
    nowState: any,
    prevState: any,
    diffInfo: any,
    recordedChanges: RecordedChanges,
    checkAllChanges: boolean
  ) => {},
  // react specific?
  autoEffectIdCounter: 1,
  //
  stepNames: ["default"] as const as Readonly<string[]>,
  nowStepName: "default" as Readonly<string>,
  nowStepIndex: 0,
};

export type RepondMeta = typeof repondMeta;

export default repondMeta;
