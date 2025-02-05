import { repondMeta as meta } from "../meta";
import { _updateRepond } from "../updating";

function updateRepondNextFrame() {
  return requestAnimationFrame(_updateRepond);
}

function updateRepondInTwoFrames() {
  return requestAnimationFrame(updateRepondNextFrame);
}

function findScreenFramerate() {
  meta.lookingForScreenFramerate = true;
  let latestDuration = 100;
  requestAnimationFrame((frameTime1) => {
    requestAnimationFrame((frameTime2) => {
      latestDuration = frameTime2 - frameTime1;
      if (latestDuration < meta.shortestFrameDuration) meta.shortestFrameDuration = latestDuration;
      requestAnimationFrame((frameTime3) => {
        latestDuration = frameTime3 - frameTime2;
        if (latestDuration < meta.shortestFrameDuration) meta.shortestFrameDuration = latestDuration;
        requestAnimationFrame((frameTime4) => {
          latestDuration = frameTime4 - frameTime3;
          if (latestDuration < meta.shortestFrameDuration) meta.shortestFrameDuration = latestDuration;
          requestAnimationFrame((frameTime5) => {
            latestDuration = frameTime5 - frameTime4;
            if (latestDuration < meta.shortestFrameDuration) meta.shortestFrameDuration = latestDuration;

            meta.foundScreenFramerate = true;
            runNextFrame();
          });
        });
      });
    });
  });
}

export function runNextFrameIfNeeded() {
  if (!meta.shouldRunUpdateAtEndOfUpdate) {
    if (meta.nextFrameIsFirst && meta.nowMetaPhase === "waitingForFirstUpdate") {
      updateRepondNextFrame();
      meta.nowMetaPhase = "waitingForMoreUpdates";
    } else {
      meta.shouldRunUpdateAtEndOfUpdate = true;
    }
  }
}

export function runNextFrame() {
  if (!meta.foundScreenFramerate) {
    if (!meta.lookingForScreenFramerate) {
      findScreenFramerate();
    }
  } else {
    // If the framerate is constently not reaching full, then switch to half
    if (meta.frameRateTypeOption === "auto") {
      const isUnderShortestFrame = meta.latestUpdateDuration < meta.shortestFrameDuration;
      if (isUnderShortestFrame) {
        if (meta.lateFramesAmount > 0) meta.lateFramesAmount -= 1;
      } else {
        if (meta.lateFramesAmount < 100) meta.lateFramesAmount += 15;
      }

      if (meta.lateFramesAmount > 99) {
        meta.frameRateType = "half";
      } else if (meta.lateFramesAmount < 5) {
        meta.frameRateType = "full";
      }
    }

    if (meta.frameRateType === "full") {
      meta.latestFrameId = updateRepondNextFrame();
    } else if (meta.frameRateType === "half") {
      if (meta.latestUpdateDuration < meta.shortestFrameDuration) {
        meta.latestFrameId = updateRepondInTwoFrames();
      } else {
        meta.latestFrameId = updateRepondNextFrame();
      }
    }
  }
}
