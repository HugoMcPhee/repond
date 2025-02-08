import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toSafeEffectId } from "../helpers/effects";
import { repondMeta as meta } from "../meta";
import { AllState, Effect, ItemPropsByType, ItemType } from "../types";
import { startNewEffect, stopEffect } from "./effects";
import { getState } from "./getSet";

export function useStore<K_Type extends ItemType, T_ReturnedRepondProps>(
  whatToReturn: (diffInfo: typeof meta.diffInfo) => T_ReturnedRepondProps,
  options: Omit<Effect, "run">,
  hookDeps: any[] = []
): T_ReturnedRepondProps {
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((tick) => tick + 1), []);

  useEffect(() => {
    const effectId = toSafeEffectId("reactComponent");
    startNewEffect({
      isPerItem: false, // isPerItem false since it's not an item effect, and it can only return one value
      atStepEnd: true,
      id: effectId,
      run: rerender,
      runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
      ...options,
    });

    return () => stopEffect(effectId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, hookDeps);

  return whatToReturn(meta.diffInfo) as T_ReturnedRepondProps;
}

export function useStoreEffect<K_Type extends ItemType>(
  run: Effect["run"],
  options: Omit<Effect, "run">,
  hookDeps: any[] | undefined = undefined
) {
  // const stringifiedCheck = JSON.stringify(check); // NOTE this may be bad for memory and performance, and might be better for people to have to manually update deps
  const stringifiedCheck = JSON.stringify(options?.itemIds); // NOTE this may be bad for memory and performance, and might be better for people to have to manually update deps
  useLayoutEffect(
    () => {
      const effectId = toSafeEffectId("useStoreEffect_" + JSON.stringify(options.changes));
      startNewEffect({ id: effectId, atStepEnd: true, run, runAtStart: true, ...options }); // runAtStart true so it works like useEffect
      return () => stopEffect(effectId);
    },
    hookDeps ? [...hookDeps, stringifiedCheck] : [stringifiedCheck]
    // hookDeps.length > 0 ? [...hookDeps, ...(options?.itemIds ?? [])] : options?.itemIds
    // hookDeps ? hookDeps : []
  );
}

// NOTE types might be hard here, since it checks the first "changes" path to get the item type
export function useStoreItem<K_Type extends ItemType, T_ReturnType>(
  itemEffectCallback: (itemState: AllState[K_Type][keyof AllState[K_Type]]) => T_ReturnType,
  options: {
    id: string;
    type: K_Type;
    props: ItemPropsByType[K_Type];
  },
  hookDeps?: any[]
) {
  const { id, type, props } = options;

  const didRender = useRef(false);
  const returnedStateRef = useRef<AllState[K_Type][keyof AllState[K_Type]]>(getState(type, id));

  // const [returnedState, setReturnedState] = useState(getState(type, id));

  const [, setTick] = useState(0);
  // const rerender = useCallback(() => {
  //   returnedStateRef.current = getState(type, id);
  //   setTick((tick) => tick + 1);
  // }, []);
  const rerender = () => {
    returnedStateRef.current = getState(type, id);
    setTick((tick) => tick + 1);
  };

  useLayoutEffect(
    () => {
      // if (didRender.current) setReturnedState(getState(type, id));
      if (didRender.current) rerender();

      const effectId = toSafeEffectId("useStoreItem" + id); // note could add JSON.stringify(check) for useful effect name

      startNewEffect({
        id: effectId,
        // run: (itemId) => rerender(),
        run() {
          // returnedStateRef.current = getState(type, id);
          // setTick((tick) => tick + 1);
          rerender();
        },
        atStepEnd: true,
        changes: props.map((prop) => `${type}.${prop}`),
        itemIds: [id],
        runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
        isPerItem: true,
      });
      didRender.current = true;

      return () => stopEffect(effectId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    hookDeps && hookDeps?.length > 0 ? [...hookDeps, ...props, id] : [...props, id] // NOTE maybe need to change this to be stringified
  );

  // useEffect(() => {
  //   console.log("returnedState updated", returnedState);
  // }, [returnedState]);

  return itemEffectCallback(returnedStateRef.current);
  // return itemEffectCallback(getState(type, id));
}

// useStoreItemPrevState
