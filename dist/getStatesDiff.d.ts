import { RecordedChanges, UntypedDiffInfo } from "./meta";
/**
 * Initializes the diffInfo data structure.
 *
 * DiffInfo tracks what changed between nowState and prevState:
 * - Which item types had changes
 * - Which items were added/removed
 * - Which items had property changes
 * - Which specific properties changed
 *
 * It maintains both array (for iteration) and boolean map (for O(1) lookup) versions.
 * The __all property aggregates changes across all item types.
 *
 * @param diffInfo - The diffInfo object to initialize
 */
export declare function createDiffInfo(diffInfo: UntypedDiffInfo): void;
/**
 * Calculates the difference between nowState and prevState.
 *
 * This is a core optimization function that determines what changed:
 * - Items added/removed
 * - Properties that changed values
 *
 * Two modes:
 * 1. checkAllChanges=false (normal): Only checks items/props marked in recordedChanges (fast)
 * 2. checkAllChanges=true: Checks everything (used for manual diff calculation)
 *
 * Process:
 * 1. Clear previous diffInfo
 * 2. For each item type:
 *    a. Check for removed items (in prev but not in now)
 *    b. Check for added items (in now but not in prev)
 *    c. For existing items, compare each property
 *
 * Special handling:
 * - Newly added items: compare against default state (not prevState)
 * - Removed items: skip property comparison
 * - Uses recordedChanges to skip items/props that weren't touched (optimization)
 *
 * @param nowState - Current state
 * @param prevState - Previous state (from last frame)
 * @param diffInfo - Output: populated with what changed
 * @param recordedChanges - Hints about what might have changed (from setState calls)
 * @param checkAllChanges - If true, check everything; if false, use recordedChanges hints
 */
export declare function getStatesDiff(nowState: any, prevState: any, diffInfo: any, recordedChanges: RecordedChanges, checkAllChanges: boolean): void;
