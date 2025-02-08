import { DiffInfo, Effect, EffectPhase } from "./types";
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
        __all?: PropsByItemType<T, any>[];
    };
} & {
    __all?: string[];
};
type DiffInfo_PropsChangedBool<T = any> = {
    [K in any]: {
        [itemId: string]: {
            [K_P in PropsByItemType<T, any>]: boolean;
        };
    } & {
        __all?: {
            [K_P in PropsByItemType<T, any>]: boolean;
        };
    };
} & {
    __all?: {
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
    prevState: any;
    nowState: any;
    nowRefs: any;
    stepNames: readonly string[];
    nowStepName: string;
    nowStepIndex: number;
    nowMetaPhase: RepondMetaPhase;
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
    isRunningSetStates: boolean;
    didInit: boolean;
    didStartFirstFrame: boolean;
    diffInfo: DiffInfo;
    recordedEffectChanges: RecordedChanges;
    recordedStepEndEffectChanges: RecordedChanges;
    nextFrameIsFirst: boolean;
    previousFrameTime: number;
    latestFrameTime: number;
    latestFrameDuration: number;
    shouldRunUpdateAtEndOfUpdate: boolean;
    addAndRemoveItemsQueue: AFunction[];
    effectsRunAtStartQueue: AFunction[];
    startEffectsQueue: AFunction[];
    setStatesQueue: AFunction[];
    nextTickQueue: AFunction[];
    autoEffectIdCounter: number;
    liveEffectsMap: Record<string, Effect>;
    effectIdsByPhaseByStep: Record<EffectPhase, Record<string, string[]>>;
    storedEffectsMap: Record<string, Effect>;
    effectIdsByGroup: Record<string, string[]>;
    allParamEffectGroups: Record<string, ParamEffectsGroup<any, any>>;
    paramEffectIdsByGroupPlusParamKey: Record<string, string[]>;
    itemTypeNames: string[];
    propNamesByItemType: {
        [itemTypeName: string]: string[];
    };
    itemIdsByItemType: {
        [itemTypeName: string]: string[];
    };
    prevItemIdsByItemType: {
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
    itemTypeByPropPathId: Record<string, string>;
    propKeyByPropPathId: Record<string, string>;
    specialKeyByPropPathId: Record<string, string>;
};
export type RepondMeta = typeof repondMeta;
export {};
