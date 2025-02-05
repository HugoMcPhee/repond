import { DiffInfo, Effect, EffectPhase, FramerateTypeOption } from "./types";
import { ParamEffectsGroup } from "./usable/paramEffects";

// This is changes recorded from setStates, and addItem and removeItem
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

export const repondMeta = {
  // prevStatesByStep: {
  //   default: {},
  // } as Record<string, any>,
  //
  didInit: false,
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
  frameRateTypeOption: "full" as FramerateTypeOption,
  frameRateType: "full" as "full" | "half",
  lateFramesAmount: 0, // if there's a late frame this increases by 15, if not it decreases by 1
  shouldRunUpdateAtEndOfUpdate: false,
  //
  diffInfo: initialDiffInfo as DiffInfo,
  // state
  prevState: {} as any,
  nowState: {} as any,
  initialState: {} as any,
  // refs
  nowRefs: {} as any,
  nowMetaPhase: "waitingForFirstUpdate" as RepondMetaPhase,
  // functions
  addAndRemoveItemsQueue: [] as AFunction[],
  effectsRunAtStartQueue: [] as AFunction[],
  startEffectsQueue: [] as AFunction[],
  setStatesQueue: [] as AFunction[],
  nextTickQueue: [] as AFunction[],
  //
  liveEffectsMap: {} as Record<string, Effect>,
  effectIdsByPhaseByStep: { duringStep: {}, endOfStep: {} } as Record<
    EffectPhase,
    Record<string, string[]> //  phase : stepName : listenerNames[]  // derive: checkInput: ['whenKeyboardPressed']
  >,
  storedEffectsMap: {} as Record<string, Effect>,
  effectIdsByGroup: {} as Record<string, string[]>, // effectGroup: [effectId]

  // storedParamEffectsMap: {} as Record<string, Effect>, // NOTE Not used yet! it's complicated
  allParamEffectGroups: {} as Record<string, ParamEffectsGroup<any, any>>,
  paramEffectIdsByGroupPlusParamKey: {} as Record<string, string[]>, // effectGroup: {paramKey: [effectId]}
  //
  itemTypeNames: [] as string[],
  propNamesByItemType: {} as { [itemTypeName: string]: string[] },
  itemIdsByItemType: {} as { [itemTypeName: string]: string[] }, // current item names only, not previous..
  prevItemIdsByItemType: {} as { [itemTypeName: string]: string[] }, // this should be manually copied when the prevState is copied
  defaultRefsByItemType: {} as {
    [itemTypeName: string]: (itemId?: string, itemState?: any) => { [itemPropertyName: string]: any };
  },
  defaultStateByItemType: {} as {
    [itemTypeName: string]: (itemId?: string) => //   itemId?: string
    { [itemPropertyName: string]: any };
  },
  willAddItemsInfo: {} as { [itemTypeName: string]: { [itemId: string]: any } },
  willRemoveItemsInfo: {} as { [itemTypeName: string]: { [itemId: string]: any } },
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

  // -----------------------------------------------------
  // -----------------------------------------------------
  // New stuff
  itemTypeByPropPathId: {} as Record<string, string>, // For propPathId like pieces.piecePropertyA and alsp pieces.__added
  propKeyByPropPathId: {} as Record<string, string>, // To get "piecePropertyA" from "pieces.piecePropertyA" quickly ( in O(1) time )
  specialKeyByPropPathId: {} as Record<string, string>, // For special keys like __added, __removed

  isRunningSetStates: false,
};

export type RepondMeta = typeof repondMeta;
