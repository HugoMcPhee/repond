import { RecordedChanges } from "./meta";
export declare function copyStates(currentObject: any, saveToObject: any): void;
export declare function copyItemIdsByItemType(currentObject: any, saveToObject: any): void;
export declare function mergeStates(currentObject: any, saveToObject: any, recordedChanges: RecordedChanges, allRecordedChanges: RecordedChanges): void;
