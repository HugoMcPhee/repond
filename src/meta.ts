import { ChangeToCheck, Phase } from "./types";

export type RecordedChanges = {
  // itemTypesBool: { [type: string]: boolean };
  // itemNamesBool: { [itemName: string]: boolean };
  // itemPropertiesBool: { [itemName: string]: boolean };
  //
  itemTypesBool: { [type: string]: boolean };
  itemNamesBool: { [type: string]: { [itemName: string]: boolean } };
  itemPropertiesBool: {
    [type: string]: { [itemName: string]: { [itemProp: string]: boolean } };
  };
  somethingChanged: boolean;
};

export const initialRecordedChanges: () => RecordedChanges = () => ({
  itemTypesBool: {},
  itemNamesBool: {},
  itemPropertiesBool: {},
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

export type UntypedListener = {
  name: string;
  changesToCheck: ChangeToCheck<any, any>[];
  whatToDo: (diffInfo: UntypedDiffInfo, frameDuration: number) => void;
  atStepEnd?: boolean;
  step?: string;
};

type PropertiesByItemType<T, K extends keyof T> = keyof NonNullable<
  T[K]
>[keyof T[keyof T]];

type DiffInfo_PropertiesChanged<T = any> = {
  [key: string]: { [itemName: string]: PropertiesByItemType<T, any>[] } & {
    all__?: PropertiesByItemType<T, any>[];
  };
} & {
  all__?: string[];
};
type DiffInfo_PropertiesChangedBool<T = any> = {
  [K in any]: {
    [itemName: string]: { [K_P in PropertiesByItemType<T, any>]: boolean };
  } & {
    all__?: { [K_P in PropertiesByItemType<T, any>]: boolean };
  };
} & {
  all__?: { [K_P in string]: boolean };
};

export type UntypedDiffInfo = {
  itemTypesChanged: [];
  itemsChanged: { [type: string]: string[] };
  itemsAdded: { [type: string]: string[] };
  itemsRemoved: { [type: string]: string[] };
  propsChanged: DiffInfo_PropertiesChanged;
  itemTypesChangedBool: { [type: string]: boolean };
  itemsChangedBool: { [type: string]: { [itemName: string]: boolean } };
  propsChangedBool: DiffInfo_PropertiesChangedBool;
  itemsAddedBool: { [type: string]: { [itemName: string]: boolean } };
  itemsRemovedBool: { [type: string]: { [itemName: string]: boolean } };
};

type AFunction = (...args: any[]) => void;

export type RepondMetaPhase =
  | "waitingForFirstUpdate"
  | "waitingForMoreUpdates"
  | "runningUpdates"
  | "runningDeriveListeners"
  | "runningSubscribeListeners"
  | "runningCallbacks"; // might need more metaPhases for the different types of callbacks

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
  recordedDeriveChanges: initialRecordedChanges(), // resets every time a steps derive listeners run, only records changes made while deriving?
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
  previousState: {} as any,
  currentState: {} as any,
  initialState: {} as any,
  // refs
  currentRefs: {} as any,
  currentMetaPhase: "waitingForFirstUpdate" as RepondMetaPhase,
  // functions
  addAndRemoveItemsQue: [] as AFunction[],
  startListenersQue: [] as AFunction[],
  setStatesQue: [] as AFunction[],
  callforwardsQue: [] as AFunction[], // runs at the start of a tick
  callbacksQue: [] as AFunction[],
  //
  allListeners: {} as Record<string, UntypedListener>,
  listenerNamesByPhaseByStep: { derive: {}, subscribe: {} } as Record<
    Phase,
    Record<string, string[]> //  phase : stepName : listenerNames[]  // derive: checkInput: ['whenKeyboardPressed']
  >,
  //
  itemTypeNames: [] as string[],
  propNamesByItemType: {} as { [itemTypeName: string]: string[] },
  itemNamesByItemType: {} as { [itemTypeName: string]: string[] }, // current item names only, not previous..
  defaultRefsByItemType: {} as {
    [itemTypeName: string]: (
      itemName?: string,
      itemState?: any
    ) => { [itemPropertyName: string]: any };
  },
  defaultStateByItemType: {} as {
    [itemTypeName: string]: (itemName?: string) => //   itemName?: string
    { [itemPropertyName: string]: any };
  },
  copyStates: (
    currentObject: any,
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
    currentObject: any,
    previousObject: any,
    diffInfo: any,
    recordedChanges: RecordedChanges,
    checkAllChanges: boolean
  ) => {},
  // react specific?
  autoListenerNameCounter: 1,
  //
  stepNames: ["default"] as const as Readonly<string[]>,
  currentStepName: "default" as Readonly<string>,
  currentStepIndex: 0,
  //
  didGoToBackgroundEventListenerWasAdded: false,
  didGoToBackground: false, // is in a background tab, so requestAnimationFrame is paused
};

export type RepondMeta = typeof repondMeta;

export default repondMeta;

export function toSafeListenerName(prefix?: string): string {
  const theId = repondMeta.autoListenerNameCounter;
  repondMeta.autoListenerNameCounter += 1;
  return (prefix || "autoListener") + "_" + theId;
}
