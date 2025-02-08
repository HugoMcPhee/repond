import { repondMeta as meta } from "../meta";
import { _updateRepond } from "../updating";
export function updateRepondNextFrame() {
    return requestAnimationFrame(_updateRepond);
}
export function runNextFrameIfNeeded() {
    if (!meta.shouldRunUpdateAtEndOfUpdate) {
        if (meta.nextFrameIsFirst && meta.nowMetaPhase === "waitingForFirstUpdate") {
            updateRepondNextFrame();
            meta.nowMetaPhase = "waitingForMoreUpdates";
        }
        else {
            meta.shouldRunUpdateAtEndOfUpdate = true;
        }
    }
}
