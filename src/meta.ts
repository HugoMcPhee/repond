import { ChangeToCheck, ListenerType } from "./types";

export type RecordedChanges = {
  itemTypesBool: { [type: string]: boolean };
  itemNamesBool: { [itemName: string]: boolean };
  itemPropertiesBool: { [itemName: string]: boolean };
  somethingChanged: boolean;
};

export const initialRecordedChanges: () => RecordedChanges = () => ({
  itemTypesBool: {},
  itemNamesBool: {},
  itemPropertiesBool: {},
  somethingChanged: false,
});
export const initialRecordedChangesSet = () => ({
  think: initialRecordedChanges(),
  draw: initialRecordedChanges(),
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

export type UntypedListenerBeforeNormalize = {
  name: string;
  changesToCheck: ChangeToCheck<any, any>[] | ChangeToCheck<any, any>;
  whatToDo: (diffInfo: UntypedDiffInfo, frameDuration: number) => void;
  listenerType?: ListenerType;
  flow?: string;
};

export type UntypedListener = {
  name: string;
  changesToCheck: ChangeToCheck<any, any>[];
  whatToDo: (diffInfo: UntypedDiffInfo, frameDuration: number) => void;
  listenerType?: ListenerType;
  flow?: string;
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

type UntypedDiffInfo = {
  itemTypesChanged: [];
  itemsChanged: {};
  itemsAdded: { [type: string]: string[] };
  itemsRemoved: { [type: string]: string[] };
  propsChanged: DiffInfo_PropertiesChanged;
  itemTypesChangedBool: {};
  itemsChangedBool: {};
  propsChangedBool: DiffInfo_PropertiesChangedBool;
  itemsAddedBool: { [type: string]: { [itemName: string]: boolean } };
  itemsRemovedBool: { [type: string]: { [itemName: string]: boolean } };
};

type AFunction = (...args: any[]) => void;

export type ConceptoPhase =
  | "waitingForFirstUpdate"
  | "waitingForMoreUpdates"
  | "runningUpdates"
  | "runningDeriveListeners"
  | "runningSubscribeListeners"
  | "runningCallbacks"; // might need more phases for the different types of callbacks

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
  recordedDeriveChanges: initialRecordedChanges(), // resets every time a flows think listeners run, only records changes made while thinking?
  nextFrameIsFirst: true, // when the next frame is the first in a chain of frames
  latestFrameId: 0,
  previousFrameTime: 0,
  latestFrameTime: 0,
  latestFrameDuration: 16.66667,
  diffInfo: initialDiffInfo,
  // state
  previousState: {} as any,
  currentState: {} as any,
  initialState: {} as any,
  // refs
  currentRefs: {} as any,
  currentPhase: "waitingForFirstUpdate" as ConceptoPhase,
  // functions
  addAndRemoveItemsQue: [] as AFunction[],
  startListenersQue: [] as AFunction[],
  setStatesQue: [] as AFunction[],
  callforwardsQue: [] as AFunction[], // runs at the start of a tick
  callbacksQue: [] as AFunction[],
  //
  allListeners: {} as Record<string, UntypedListener>,
  listenerNamesByTypeByFlow: { derive: {}, subscribe: {} } as Record<
    ListenerType,
    Record<string, string[]> //  listenerType : flowName : listenerNames[]  // think: checkInput: ['whenKeyboardPressed']
  >,
  //
  itemTypeNames: [] as string[],
  propNamesByItemType: {} as { [itemTypeName: string]: string[] },
  defaultRefsByItemType: {} as {
    [itemTypeName: string]: (
      itemName?: string,
      itemState?: any
    ) => { [itemPropertyName: string]: any };
  },
  defaultStateByItemType: {} as {
    [itemTypeName: string]: (
      itemName?: string
    ) => //   itemName?: string
    { [itemPropertyName: string]: any };
  },
  copyStates: (currentObject: any, saveToObject: any) => {},
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
  flowNames: (["default"] as const) as Readonly<string[]>,
  currentFlowName: "default" as Readonly<string>,
  currentFlowIndex: 0,
};

export type ConceptoMeta = typeof conceptoMeta;

export default conceptoMeta;

export function toSafeListenerName(prefix?: string): string {
  const theId = conceptoMeta.autoListenerNameCounter;
  conceptoMeta.autoListenerNameCounter += 1;
  return (prefix || "autoListener") + "_" + theId;
}
