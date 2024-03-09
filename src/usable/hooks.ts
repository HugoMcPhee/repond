import { forEach } from "chootils/dist/loops";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import meta from "../meta";
import {
  AllRefs,
  AllState,
  DeepReadonly,
  EasyEffect_Check,
  EasyEffect_Run,
  ItemEffect_Check,
  ItemEffect_Run,
  ItemEffect_Run_Params,
  ItemId,
  ItemType,
  UseStoreItem_Check_OneItem,
  PropName,
  StepName,
} from "../types";
import { startNewEffect, startNewItemEffect, stopNewEffect, toSafeEffectId } from "./effects";
import { getPrevState, getRefs, getState } from "./getSet";

export type UseStoreItem_Params<K_Type extends ItemType> = {
  itemId: ItemId<K_Type>;
  prevItemState: AllState[K_Type][ItemId<K_Type>];
  itemState: AllState[K_Type][ItemId<K_Type>];
  // itemRefs: T_Refs[K_Type][keyof T_Refs[K_Type]];
  itemRefs: AllRefs[K_Type][ItemId<K_Type>];
  // frameDuration: number;
};

export function useStore<K_Type extends ItemType, T_ReturnedRepondProps>(
  whatToReturn: (state: DeepReadonly<AllState>) => T_ReturnedRepondProps,
  check: EasyEffect_Check<K_Type>,
  hookDeps: any[] = []
): T_ReturnedRepondProps {
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

  return whatToReturn(meta.nowState) as T_ReturnedRepondProps;
}

export function useStoreEffect<K_Type extends ItemType>(
  run: EasyEffect_Run,
  check: EasyEffect_Check<K_Type>,
  hookDeps: any[] = []
) {
  // const stringifiedCheck = JSON.stringify(check); // NOTE this may be bad for memory and performance, and might be better for people to have to manually update deps
  useLayoutEffect(
    () => {
      const name = toSafeEffectId("useStoreEffect_"); // note could add JSON.stringify(check) for useful effect name
      startNewEffect({ id: name, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
      return () => stopNewEffect(name);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    // hookDeps ? [...hookDeps, stringifiedCheck] : [stringifiedCheck]
    hookDeps
  );
}

export function useStoreItemEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>, T_ReturnType>(
  run: (loopedInfo: ItemEffect_Run_Params<K_Type, K_PropName>) => T_ReturnType,
  check: ItemEffect_Check<K_Type, K_PropName>,
  hookDeps: any[] = []
) {
  useLayoutEffect(
    () => {
      const effectId = toSafeEffectId("useStoreItemEffect_" + JSON.stringify(check));
      startNewItemEffect({ id: effectId, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
      return () => stopNewEffect(effectId);
    },
    hookDeps.length > 0 ? [...hookDeps, check.id] : [check.id]
  );
}

// NOTE it automatically supports changing item name, but not item type or props, that needs custom hookDeps
export function useStoreItem<
  K_Type extends ItemType,
  K_PropName extends PropName<K_Type>,
  T_ReturnType,
  T_TheParams = UseStoreItem_Params<K_Type>
>(
  itemEffectCallback: (loopedInfo: T_TheParams) => T_ReturnType,
  check: UseStoreItem_Check_OneItem<K_Type, K_PropName>,
  hookDeps: any[] = []
) {
  function getInitialState() {
    return {
      itemId: check.id,
      prevItemState: getPrevState()[check.type][check.id],
      itemState: (getState() as any)[check.type as any][check.id],
      itemRefs: getRefs()[check.type][check.id],
    } as unknown as T_TheParams;
  }

  const didRender = useRef(false);

  const [returnedState, setReturnedState] = useState(getInitialState());

  useLayoutEffect(
    () => {
      if (didRender.current) {
        setReturnedState(getInitialState());
      }
      const effectId = toSafeEffectId("useStoreItem"); // note could add JSON.stringify(check) for useful effect name

      startNewItemEffect({
        id: effectId,
        atStepEnd: true,
        check,
        run: (theParameters) => setReturnedState(theParameters as any),
        runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
      });
      didRender.current = true;

      return () => stopNewEffect(effectId);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    hookDeps.length > 0 ? [...hookDeps, check.id] : [check.id]
  );

  return itemEffectCallback(returnedState);
}

/*
  useStoreItemPropsEffect(
  { position() {}, rotationY() {}, nowAnimation() {} },
  { type: "characters", name: "walker" },
  );
  */
export function useStoreItemPropsEffect<K_Type extends ItemType>(
  checkItem: { type: K_Type; id: ItemId<K_Type>; step?: StepName },
  onPropChanges: Partial<{
    [K_PropName in PropName<K_Type>]: ItemEffect_Run<K_Type, K_PropName>;
  }>,
  hookDeps: any[] = []
) {
  useLayoutEffect(
    () => {
      type ItemEffect_PropName = keyof typeof onPropChanges;
      const propNameKeys = Object.keys(onPropChanges) as ItemEffect_PropName[];
      const effectIdPrefix = toSafeEffectId("useStoreItemPropsEffect"); // note could add checkItem.type and checkItem.name for useful effect name

      forEach(propNameKeys, (propKey) => {
        const effectId = effectIdPrefix + (propKey as string);

        const itemEffectRun = onPropChanges[propKey];
        startNewItemEffect({
          run: itemEffectRun as any,
          id: effectId,
          check: { type: checkItem.type, id: checkItem.id, prop: propKey },
          atStepEnd: true,
          step: checkItem.step,
          runAtStart: true, // runAtStart true so it works like useEffect
        });
      });

      return () => {
        forEach(propNameKeys, (propKey) => stopNewEffect(effectIdPrefix + (propKey as string)));
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    hookDeps.length > 0 ? [...hookDeps, checkItem.id] : [checkItem.id]
  );
}
