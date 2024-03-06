import { InnerEffectCheck, EffectPhase } from "./types";
export type RecordedChanges = {
    itemTypesBool: {
        [type: string]: boolean;
    };
    itemNamesBool: {
        [type: string]: {
            [itemName: string]: boolean;
        };
    };
    itemPropertiesBool: {
        [type: string]: {
            [itemName: string]: {
                [itemProp: string]: boolean;
            };
        };
    };
    somethingChanged: boolean;
};
export declare const initialRecordedChanges: () => RecordedChanges;
export declare const initialDiffInfo: UntypedDiffInfo;
export type UntypedInnerEffect = {
    name: string;
    check: InnerEffectCheck<any, any>[];
    run: (diffInfo: UntypedDiffInfo, frameDuration: number) => void;
    atStepEnd?: boolean;
    step?: string;
};
type PropertiesByItemType<T, K extends keyof T> = keyof NonNullable<T[K]>[keyof T[keyof T]];
type DiffInfo_PropertiesChanged<T = any> = {
    [key: string]: {
        [itemName: string]: PropertiesByItemType<T, any>[];
    } & {
        all__?: PropertiesByItemType<T, any>[];
    };
} & {
    all__?: string[];
};
type DiffInfo_PropertiesChangedBool<T = any> = {
    [K in any]: {
        [itemName: string]: {
            [K_P in PropertiesByItemType<T, any>]: boolean;
        };
    } & {
        all__?: {
            [K_P in PropertiesByItemType<T, any>]: boolean;
        };
    };
} & {
    all__?: {
        [K_P in string]: boolean;
    };
};
export type UntypedDiffInfo = {
    itemTypesChanged: [];
    itemsChanged: {
        [type: string]: string[];
    };
    itemsAdded: {
        [type: string]: string[];
    };
    itemsRemoved: {
        [type: string]: string[];
    };
    propsChanged: DiffInfo_PropertiesChanged;
    itemTypesChangedBool: {
        [type: string]: boolean;
    };
    itemsChangedBool: {
        [type: string]: {
            [itemName: string]: boolean;
        };
    };
    propsChangedBool: DiffInfo_PropertiesChangedBool;
    itemsAddedBool: {
        [type: string]: {
            [itemName: string]: boolean;
        };
    };
    itemsRemovedBool: {
        [type: string]: {
            [itemName: string]: boolean;
        };
    };
};
type AFunction = (...args: any[]) => void;
export type RepondMetaPhase = "waitingForFirstUpdate" | "waitingForMoreUpdates" | "runningUpdates" | "runningInnerEffects" | "runningStepEndInnerEffects" | "runningCallbacks";
declare const repondMeta: {
    recordedEffectChanges: RecordedChanges;
    recordedStepEndEffectChanges: RecordedChanges;
    nextFrameIsFirst: boolean;
    latestFrameId: number;
    previousFrameTime: number;
    latestFrameTime: number;
    latestFrameDuration: number;
    shortestFrameDuration: number;
    foundScreenFramerate: boolean;
    lookingForScreenFramerate: boolean;
    latestUpdateTime: number;
    latestUpdateDuration: number;
    frameRateTypeOption: "auto" | "full" | "half";
    frameRateType: "full" | "half";
    lateFramesAmount: number;
    shouldRunUpdateAtEndOfUpdate: boolean;
    diffInfo: UntypedDiffInfo;
    previousState: any;
    currentState: any;
    initialState: any;
    currentRefs: any;
    currentMetaPhase: RepondMetaPhase;
    addAndRemoveItemsQue: AFunction[];
    innerEffectsRunAtStartQueue: AFunction[];
    startInnerEffectsQue: AFunction[];
    setStatesQue: AFunction[];
    callforwardsQue: AFunction[];
    callbacksQue: AFunction[];
    allInnerEffects: Record<string, UntypedInnerEffect>;
    innerEffectNamesByPhaseByStep: Record<EffectPhase, Record<string, string[]>>;
    allGroupedEffects: Record<string, Record<string, UntypedInnerEffect>>;
    itemTypeNames: string[];
    propNamesByItemType: {
        [itemTypeName: string]: string[];
    };
    itemNamesByItemType: {
        [itemTypeName: string]: string[];
    };
    defaultRefsByItemType: {
        [itemTypeName: string]: (itemName?: string, itemState?: any) => {
            [itemPropertyName: string]: any;
        };
    };
    defaultStateByItemType: {
        [itemTypeName: string]: (itemName?: string) => {
            [itemPropertyName: string]: any;
        };
    };
    copyStates: (currentObject: any, saveToObject: any, recordedChanges?: RecordedChanges, allRecordedChanges?: RecordedChanges) => void;
    mergeStates: (newStates: any, saveToObject: any, recordedChanges: RecordedChanges, allRecordedChanges: RecordedChanges) => void;
    getStatesDiff: (currentObject: any, previousObject: any, diffInfo: any, recordedChanges: RecordedChanges, checkAllChanges: boolean) => void;
    autoEffectNameCounter: number;
    stepNames: readonly string[];
    currentStepName: string;
    currentStepIndex: number;
};
export type RepondMeta = typeof repondMeta;
export default repondMeta;
export declare function toSafeEffectName(prefix?: string): string;
