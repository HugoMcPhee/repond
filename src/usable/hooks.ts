import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { toSafeEffectId } from "../helpers/effects";
import { repondMeta as meta } from "../meta";
import { AllState, EffectDef, ItemPropsByType, ItemType, PropId } from "../types";
import { startNewEffect, stopEffect } from "./effects";
import { getState } from "./getSet";

export function useStore<K_Type extends ItemType, T_ReturnedRepondProps>(
  whatToReturn: (diffInfo: typeof meta.diffInfo) => T_ReturnedRepondProps,
  options: Omit<EffectDef, "run">,
  hookDeps: any[] = []
): T_ReturnedRepondProps {
  const [, setTick] = useState(0);
  const rerender = useCallback(() => setTick((tick) => tick + 1), []);

  // Generate stable effect ID
  const effectIdRef = useRef<string>();
  if (!effectIdRef.current) {
    effectIdRef.current = options.id ?? toSafeEffectId("reactComponent");
  }

  useEffect(() => {
    startNewEffect({
      isPerItem: false, // isPerItem false since it's not an item effect, and it can only return one value
      atStepEnd: true,
      id: effectIdRef.current,
      run: rerender,
      runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
      ...options,
    } as any);

    return () => stopEffect(effectIdRef.current!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, hookDeps);

  return whatToReturn(meta.diffInfo) as T_ReturnedRepondProps;
}

export function useStoreEffect<K_Type extends ItemType>(
  run: EffectDef["run"],
  options: Omit<EffectDef, "run">,
  hookDeps: any[] | undefined = undefined
) {
  // Generate stable ID using useRef (persists across strict mode re-renders)
  const effectIdRef = useRef<string>();
  if (!effectIdRef.current) {
    effectIdRef.current = options.id ?? toSafeEffectId("useStoreEffect_" + JSON.stringify(options.changes));
  }

  const stringifiedCheck = JSON.stringify(options?.itemIds);

  useLayoutEffect(
    () => {
      startNewEffect({
        id: effectIdRef.current,
        atStepEnd: true,
        run,
        runAtStart: true,
        ...options,
      } as any);

      return () => stopEffect(effectIdRef.current!);
    },
    hookDeps ? [...hookDeps, stringifiedCheck] : [stringifiedCheck]
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

  // Generate stable effect ID
  const effectIdRef = useRef<string>();
  if (!effectIdRef.current) {
    effectIdRef.current = toSafeEffectId("useStoreItem_" + id);
  }

  useLayoutEffect(
    () => {
      // if (didRender.current) setReturnedState(getState(type, id));
      if (didRender.current) rerender();

      startNewEffect({
        id: effectIdRef.current,
        // run: (itemId) => rerender(),
        run() {
          // returnedStateRef.current = getState(type, id);
          // setTick((tick) => tick + 1);
          rerender();
        },
        atStepEnd: true,
        changes: props.map((prop) => `${type}.${prop}`) as PropId[],
        itemIds: [id],
        runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
        isPerItem: true,
      });
      didRender.current = true;

      return () => stopEffect(effectIdRef.current!);
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
