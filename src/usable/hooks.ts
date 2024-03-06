import { forEach } from "chootils/dist/loops";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import meta, { toSafeEffectName } from "../meta";
import {
  AllState,
  DeepReadonly,
  Effect_Check,
  Effect_Run,
  ItemEffect_Check,
  ItemEffect_Run,
  ItemEffect_Run_Params,
  ItemName,
  ItemType,
  OneItem_Check,
  PropName,
  StepName,
  UseStoreItem_Params,
} from "../types";
import { startNewEffect, startNewItemEffect, stopNewEffect } from "../usable/effects";
import { getPrevState, getRefs, getState } from "../usable/getSet";

export function useStore<K_Type extends ItemType, T_ReturnedRepondProps>(
  whatToReturn: (state: DeepReadonly<AllState>) => T_ReturnedRepondProps,
  check: Effect_Check<K_Type>,
  hookDeps: any[] = []
): T_ReturnedRepondProps {
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

  return whatToReturn(meta.currentState) as T_ReturnedRepondProps;
}

export function useStoreEffect<K_Type extends ItemType>(
  run: Effect_Run,
  check: Effect_Check<K_Type>,
  hookDeps: any[] = []
) {
  // const stringifiedCheck = JSON.stringify(check); // NOTE this may be bad for memory and performance, and might be better for people to have to manually update deps
  useLayoutEffect(
    () => {
      const name = toSafeEffectName("useStoreEffect_"); // note could add JSON.stringify(check) for useful effect name
      startNewEffect({ name, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
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
      const name = toSafeEffectName("useStoreItemEffect_" + JSON.stringify(check));
      startNewItemEffect({ name, atStepEnd: true, check, run, runAtStart: true }); // runAtStart true so it works like useEffect
      return () => stopNewEffect(name);
    },
    hookDeps.length > 0 ? [...hookDeps, check.name] : [check.name]
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
  check: OneItem_Check<K_Type, K_PropName>,
  hookDeps: any[] = []
) {
  function getInitialState() {
    return {
      itemName: check.name,
      prevItemState: getPrevState()[check.type][check.name],
      itemState: (getState() as any)[check.type as any][check.name],
      itemRefs: getRefs()[check.type][check.name],
    } as unknown as T_TheParams;
  }

  const didRender = useRef(false);

  const [returnedState, setReturnedState] = useState(getInitialState());

  useLayoutEffect(
    () => {
      if (didRender.current) {
        setReturnedState(getInitialState());
      }
      const name = toSafeEffectName("useStoreItem"); // note could add JSON.stringify(check) for useful effect name

      startNewItemEffect({
        name,
        atStepEnd: true,
        check,
        run: (theParameters) => setReturnedState(theParameters as any),
        runAtStart: false, // runAtStart false since it's returning the initial state already, no need to set state
      });
      didRender.current = true;

      return () => stopNewEffect(name);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    hookDeps.length > 0 ? [...hookDeps, check.name] : [check.name]
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
  checkItem: {
    type: K_Type;
    name: ItemName<K_Type>;
    step?: StepName;
  },
  onPropChanges: Partial<{
    [K_PropName in PropName<K_Type>]: ItemEffect_Run<K_Type, K_PropName>;
  }>,
  hookDeps: any[] = []
) {
  useLayoutEffect(
    () => {
      type ItemEffect_PropName = keyof typeof onPropChanges;
      const propNameKeys = Object.keys(onPropChanges) as ItemEffect_PropName[];
      const namePrefix = toSafeEffectName("useStoreItemPropsEffect"); // note could add checkItem.type and checkItem.name for useful effect name

      forEach(propNameKeys, (propKey) => {
        const name = namePrefix + (propKey as string);

        const itemEffectRun = onPropChanges[propKey];
        startNewItemEffect({
          run: itemEffectRun as any,
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
        forEach(propNameKeys, (propKey) => stopNewEffect(namePrefix + (propKey as string)));
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    hookDeps.length > 0 ? [...hookDeps, checkItem.name.name] : [checkItem.name.name]
  );
}
