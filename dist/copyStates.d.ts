import { RecordedChanges } from "./meta";
export declare function copyStates(currentObject: any, saveToObject: any): void;
export declare function copyItemIdsByItemType(currentObject: any, saveToObject: any): void;
export declare function mergeToState(storeType: string, propKey: string, newValue: string, foundItemId: string, saveToObject: any, recordedChanges: RecordedChanges, allRecordedChanges: RecordedChanges): void;
export declare function cloneObjectWithJson(theObject: {
    [key: string]: any;
}): any;
