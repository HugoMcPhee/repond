import { RecordedChanges, UntypedDiffInfo } from "./meta";
export declare function makeGetStatesDiffFunction_prev(): any;
export declare function createDiffInfo(diffInfo: UntypedDiffInfo): void;
export default function makeGetStatesDiffFunction(): (currentState: any, prevState: any, diffInfo: any, recordedChanges: RecordedChanges, checkAllChanges: boolean) => void;
