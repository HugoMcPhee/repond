import { ChangeToCheck, ListenerType } from "./types";
export declare type RecordedChanges = {
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
export declare const initialRecordedChangesSet: () => {
    think: RecordedChanges;
    draw: RecordedChanges;
};
export declare const initialDiffInfo: UntypedDiffInfo;
export declare type UntypedListenerBeforeNormalize = {
    name: string;
    changesToCheck: ChangeToCheck<any, any>[] | ChangeToCheck<any, any>;
    whatToDo: (diffInfo: UntypedDiffInfo, frameDuration: number) => void;
    listenerType?: ListenerType;
    flow?: string;
};
export declare type UntypedListener = {
    name: string;
    changesToCheck: ChangeToCheck<any, any>[];
    whatToDo: (diffInfo: UntypedDiffInfo, frameDuration: number) => void;
    listenerType?: ListenerType;
    flow?: string;
};
declare type PropertiesByItemType<T, K extends keyof T> = keyof NonNullable<T[K]>[keyof T[keyof T]];
declare type DiffInfo_PropertiesChanged<T = any> = {
    [key: string]: {
        [itemName: string]: PropertiesByItemType<T, any>[];
    } & {
        all__?: PropertiesByItemType<T, any>[];
    };
} & {
    all__?: string[];
};
declare type DiffInfo_PropertiesChangedBool<T = any> = {
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
declare type UntypedDiffInfo = {
    itemTypesChanged: [];
    itemsChanged: {};
    itemsAdded: {
        [type: string]: string[];
    };
    itemsRemoved: {
        [type: string]: string[];
    };
    propsChanged: DiffInfo_PropertiesChanged;
    itemTypesChangedBool: {};
    itemsChangedBool: {};
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
declare type AFunction = (...args: any[]) => void;
export declare type ConceptoPhase = "waitingForFirstUpdate" | "waitingForMoreUpdates" | "runningUpdates" | "runningDeriveListeners" | "runningSubscribeListeners" | "runningCallbacks";
declare const conceptoMeta: {
    recordedSubscribeChanges: RecordedChanges;
    recordedDeriveChanges: RecordedChanges;
    nextFrameIsFirst: boolean;
    latestFrameId: number;
    previousFrameTime: number;
    latestFrameTime: number;
    latestFrameDuration: number;
    diffInfo: UntypedDiffInfo;
    previousState: any;
    currentState: any;
    initialState: any;
    currentRefs: any;
    currentPhase: ConceptoPhase;
    addAndRemoveItemsQue: AFunction[];
    startListenersQue: AFunction[];
    setStatesQue: AFunction[];
    callforwardsQue: AFunction[];
    callbacksQue: AFunction[];
    allListeners: Record<string, UntypedListener>;
    listenerNamesByTypeByFlow: Record<ListenerType, Record<string, string[]>>;
    itemTypeNames: string[];
    propNamesByItemType: {
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
    autoListenerNameCounter: number;
    flowNames: readonly string[];
    currentFlowName: string;
    currentFlowIndex: number;
};
export declare type ConceptoMeta = typeof conceptoMeta;
export default conceptoMeta;
export declare function toSafeListenerName(prefix?: string): string;
