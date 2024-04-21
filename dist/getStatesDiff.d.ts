import { RecordedChanges, UntypedDiffInfo } from "./meta";
export declare function createDiffInfo(diffInfo: UntypedDiffInfo): void;
export declare function getStatesDiff(nowState: any, prevState: any, diffInfo: any, recordedChanges: RecordedChanges, checkAllChanges: boolean): void;
