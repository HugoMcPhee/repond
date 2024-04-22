import { DiffInfo, Effect, EffectPhase, FramerateTypeOption } from "./types";
import { ParamEffectsGroup } from "./usable/paramEffects";
export type RecordedChanges = {
    itemTypesBool: {
        [type: string]: boolean;
    };
    itemIdsBool: {
        [type: string]: {
            [itemId: string]: boolean;
        };
    };
    itemPropsBool: {
        [type: string]: {
            [itemId: string]: {
                [itemProp: string]: boolean;
            };
        };
    };
    somethingChanged: boolean;
};
export declare const initialRecordedChanges: () => RecordedChanges;
export declare const initialDiffInfo: UntypedDiffInfo;
type PropsByItemType<T, K extends keyof T> = keyof NonNullable<T[K]>[keyof T[keyof T]];
type DiffInfo_PropsChanged<T = any> = {
    [key: string]: {
        [itemId: string]: PropsByItemType<T, any>[];
    } & {
        all__?: PropsByItemType<T, any>[];
    };
} & {
    all__?: string[];
};
type DiffInfo_PropsChangedBool<T = any> = {
    [K in any]: {
        [itemId: string]: {
            [K_P in PropsByItemType<T, any>]: boolean;
        };
    } & {
        all__?: {
            [K_P in PropsByItemType<T, any>]: boolean;
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
    propsChanged: DiffInfo_PropsChanged;
    itemTypesChangedBool: {
        [type: string]: boolean;
    };
    itemsChangedBool: {
        [type: string]: {
            [itemId: string]: boolean;
        };
    };
    propsChangedBool: DiffInfo_PropsChangedBool;
    itemsAddedBool: {
        [type: string]: {
            [itemId: string]: boolean;
        };
    };
    itemsRemovedBool: {
        [type: string]: {
            [itemId: string]: boolean;
        };
    };
};
type AFunction = (...args: any[]) => void;
export type RepondMetaPhase = "waitingForFirstUpdate" | "waitingForMoreUpdates" | "runningUpdates" | "runningEffects" | "runningStepEndEffects" | "runningCallbacks";
export declare const repondMeta: {
    didInit: boolean;
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
    frameRateTypeOption: FramerateTypeOption;
    frameRateType: "full" | "half";
    lateFramesAmount: number;
    shouldRunUpdateAtEndOfUpdate: boolean;
    diffInfo: DiffInfo;
    prevState: any;
    nowState: any;
    initialState: any;
    nowRefs: any;
    nowMetaPhase: RepondMetaPhase;
    addAndRemoveItemsQue: AFunction[];
    effectsRunAtStartQueue: AFunction[];
    startEffectsQue: AFunction[];
    setStatesQue: AFunction[];
    callbacksQue: AFunction[];
    allEffects: Record<string, Effect>;
    effectIdsByPhaseByStep: Record<EffectPhase, Record<string, string[]>>;
    allEffectGroups: Record<string, Record<string, Effect>>;
    allParamEffectGroups: Record<string, ParamEffectsGroup<any, any>>;
    paramEffectIdsByGroupPlusParamKey: Record<string, string[]>;
    itemTypeNames: string[];
    propNamesByItemType: {
        [itemTypeName: string]: string[];
    };
    itemIdsByItemType: {
        [itemTypeName: string]: string[];
    };
    defaultRefsByItemType: {
        [itemTypeName: string]: (itemId?: string, itemState?: any) => {
            [itemPropertyName: string]: any;
        };
    };
    defaultStateByItemType: {
        [itemTypeName: string]: (itemId?: string) => {
            [itemPropertyName: string]: any;
        };
    };
    willAddItemsInfo: {
        [itemTypeName: string]: {
            [itemId: string]: any;
        };
    };
    willRemoveItemsInfo: {
        [itemTypeName: string]: {
            [itemId: string]: any;
        };
    };
    getStatesDiff: (nowState: any, prevState: any, diffInfo: any, recordedChanges: RecordedChanges, checkAllChanges: boolean) => void;
    autoEffectIdCounter: number;
    stepNames: readonly string[];
    nowStepName: string;
    nowStepIndex: number;
};
export type RepondMeta = typeof repondMeta;
export {};
