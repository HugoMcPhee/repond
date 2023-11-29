import { RecordedChanges } from "./meta";
export declare function makeCopyStatesFunction_both_prev(copyType?: "copy" | "merge"): any;
export declare function makeCopyStatesFunction_string_version(): any;
export default function makeCopyStatesFunction_both_nonstring(copyType?: "copy" | "merge"): ((currentObject: any, saveToObject: any, recordedChanges: RecordedChanges, allRecordedChanges: RecordedChanges) => void) | undefined;
