import { RecordedChanges } from "./meta";
export declare function makeCopyStatesFunction(copyType: "copy" | "merge"): ((currentObject: any, saveToObject: any, recordedChanges: RecordedChanges, allRecordedChanges: RecordedChanges) => void) | undefined;
