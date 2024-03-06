import { forEach } from "chootils/dist/loops";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import meta, { toSafeEffectName } from "../meta";
import { startNewEffect, startNewItemEffect, stopNewEffect } from "../usable/effects";
import { getPrevState, getRefs, getState } from "../usable/getSet";
export function useStore(whatToReturn, check, hookDeps = []) {
    const [, setTick] = useState(0);
    const rerender = useCallback(() => setTick((tick) => tick + 1), []);
    useEffect(() => {
        const name = toSafeEffectName("reactComponent");
        startNewEffect({
            atStepEnd: true,
            name,
            check,
            run: rerender,
            runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
        });
        return () => stopNewEffect(name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps);
    return whatToReturn(meta.currentState);
}
export function useStoreEffect(run, check, hookDeps = []) {
    // const stringifiedCheck = JSON.stringify(check); // NOTE this may be bad for memory and performance, and might be better for people to have to manually update deps
    useLayoutEffect(() => {
        const name = toSafeEffectName("useStoreEffect_"); // note could add JSON.stringify(check) for useful effect name
        startNewEffect({ name, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
        return () => stopNewEffect(name);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, 
    // hookDeps ? [...hookDeps, stringifiedCheck] : [stringifiedCheck]
    hookDeps);
}
export function useStoreItemEffect(run, check, hookDeps = []) {
    useLayoutEffect(() => {
        const name = toSafeEffectName("useStoreItemEffect_" + JSON.stringify(check));
        startNewItemEffect({ name, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
        return () => stopNewEffect(name);
    }, hookDeps.length > 0 ? [...hookDeps, check.name] : [check.name]);
}
// NOTE it automatically supports changing item name, but not item type or props, that needs custom hookDeps
export function useStoreItem(itemEffectCallback, check, hookDeps = []) {
    function getInitialState() {
        return {
            itemName: check.name,
            prevItemState: getPrevState()[check.type][check.name],
            itemState: getState()[check.type][check.name],
            itemRefs: getRefs()[check.type][check.name],
        };
    }
    const didRender = useRef(false);
    const [returnedState, setReturnedState] = useState(getInitialState());
    useLayoutEffect(() => {
        if (didRender.current) {
            setReturnedState(getInitialState());
        }
        const name = toSafeEffectName("useStoreItem"); // note could add JSON.stringify(check) for useful effect name
        startNewItemEffect({
            name,
            atStepEnd: true,
            check,
            run: (theParameters) => setReturnedState(theParameters),
            runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
        });
        didRender.current = true;
        return () => stopNewEffect(name);
    }, 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    hookDeps.length > 0 ? [...hookDeps, check.name] : [check.name]);
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
        const namePrefix = toSafeEffectName("useStoreItemPropsEffect"); // note could add checkItem.type and checkItem.name for useful effect name
        forEach(propNameKeys, (propKey) => {
            const name = namePrefix + propKey;
            const itemEffectRun = onPropChanges[propKey];
            startNewItemEffect({
                run: itemEffectRun,
                name,
                check: {
                    type: checkItem.type,
                    name: checkItem.name,
                    prop: propKey,
                },
                atStepEnd: true,
                step: checkItem.step,
                runAtStart: true, // runAtStart true so it works like useEffect
            });
        });
        return () => {
            forEach(propNameKeys, (propKey) => stopNewEffect(namePrefix + propKey));
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, hookDeps.length > 0 ? [...hookDeps, checkItem.name.name] : [checkItem.name.name]);
}
