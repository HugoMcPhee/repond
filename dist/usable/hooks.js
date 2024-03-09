import { forEach } from "chootils/dist/loops";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import meta from "../meta";
import { startNewEffect, startNewItemEffect, stopNewEffect, toSafeEffectId } from "./effects";
import { getPrevState, getRefs, getState } from "./getSet";
export function useStore(whatToReturn, check, hookDeps = []) {
    const [, setTick] = useState(0);
    const rerender = useCallback(() => setTick((tick) => tick + 1), []);
    useEffect(() => {
        const name = toSafeEffectId("reactComponent");
        startNewEffect({
            atStepEnd: true,
            id: name,
            check,
            run: rerender,
            runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
        });
        return () => stopNewEffect(name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps);
    return whatToReturn(meta.nowState);
}
export function useStoreEffect(run, check, hookDeps = []) {
    // const stringifiedCheck = JSON.stringify(check); // NOTE this may be bad for memory and performance, and might be better for people to have to manually update deps
    useLayoutEffect(() => {
        const name = toSafeEffectId("useStoreEffect_"); // note could add JSON.stringify(check) for useful effect name
        startNewEffect({ id: name, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
        return () => stopNewEffect(name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 
    // hookDeps ? [...hookDeps, stringifiedCheck] : [stringifiedCheck]
    hookDeps);
}
export function useStoreItemEffect(run, check, hookDeps = []) {
    useLayoutEffect(() => {
        const effectId = toSafeEffectId("useStoreItemEffect_" + JSON.stringify(check));
        startNewItemEffect({ id: effectId, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
        return () => stopNewEffect(effectId);
    }, hookDeps.length > 0 ? [...hookDeps, check.id] : [check.id]);
}
// NOTE it automatically supports changing item name, but not item type or props, that needs custom hookDeps
export function useStoreItem(itemEffectCallback, check, hookDeps = []) {
    function getInitialState() {
        return {
            itemId: check.id,
            prevItemState: getPrevState()[check.type][check.id],
            itemState: getState()[check.type][check.id],
            itemRefs: getRefs()[check.type][check.id],
        };
    }
    const didRender = useRef(false);
    const [returnedState, setReturnedState] = useState(getInitialState());
    useLayoutEffect(() => {
        if (didRender.current) {
            setReturnedState(getInitialState());
        }
        const effectId = toSafeEffectId("useStoreItem"); // note could add JSON.stringify(check) for useful effect name
        startNewItemEffect({
            id: effectId,
            atStepEnd: true,
            check,
            run: (theParameters) => setReturnedState(theParameters),
            runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
        });
        didRender.current = true;
        return () => stopNewEffect(effectId);
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    hookDeps.length > 0 ? [...hookDeps, check.id] : [check.id]);
    return itemEffectCallback(returnedState);
}
/*
  useStoreItemPropsEffect(
  { position() {}, rotationY() {}, nowAnimation() {} },
  { type: "characters", name: "walker" },
  );
  */
export function useStoreItemPropsEffect(checkItem, onPropChanges, hookDeps = []) {
    useLayoutEffect(() => {
        const propNameKeys = Object.keys(onPropChanges);
        const effectIdPrefix = toSafeEffectId("useStoreItemPropsEffect"); // note could add checkItem.type and checkItem.name for useful effect name
        forEach(propNameKeys, (propKey) => {
            const effectId = effectIdPrefix + propKey;
            const itemEffectRun = onPropChanges[propKey];
            startNewItemEffect({
                run: itemEffectRun,
                id: effectId,
                check: { type: checkItem.type, id: checkItem.id, prop: propKey },
                atStepEnd: true,
                step: checkItem.step,
                runAtStart: true, // runAtStart true so it works like useEffect
            });
        });
        return () => {
            forEach(propNameKeys, (propKey) => stopNewEffect(effectIdPrefix + propKey));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps.length > 0 ? [...hookDeps, checkItem.id] : [checkItem.id]);
}
