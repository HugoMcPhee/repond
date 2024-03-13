import { breakableForEach, forEach } from "chootils/dist/loops";
import meta from "../../meta";
import { AllState, DiffInfo, EasyEffect, EasyEffect_Check, Effect, ItemEffect, ItemType, PropName } from "../../types";
import { getPrevState, getRefs, getState } from "../../usable/getSet";
import { toArray, toMaybeArray } from "../../utils";
import { toSafeEffectId } from "./internal";

function itemEffectRunToEffectRun<K_Type extends ItemType, K_PropName extends PropName<K_Type>>({
  check,
  run,
}: ItemEffect<K_Type, K_PropName>) {
  let allowedIdsMap: { [itemId: string]: boolean } | undefined = undefined;
  const props = toArray(check.prop);
  const type = check.type;
  const ids = toMaybeArray(check.id);
  const becomes = check.becomes;

  if (ids) {
    allowedIdsMap = {};
    forEach(ids, (itemId) => {
      if (allowedIdsMap) allowedIdsMap[itemId] = true;
    });
  }

  return (diffInfo: DiffInfo, frameDuration: number, skipChangeCheck?: boolean) => {
    // if skipChangeCheck is true, it will run the run function regardless of the changes
    if (skipChangeCheck) {
      const idsToRun = ids?.length ? ids : meta.itemIdsByItemType[type];

      if (idsToRun?.length) {
        const prevItemsState = getPrevState()[type] as any;
        const itemsState = (getState() as AllState)[type];
        const itemsRefs = getRefs()[type];

        forEach(idsToRun, (itemId) => {
          breakableForEach(props, (propName) => {
            const newValue = itemsState[itemId][propName];

            run({
              itemId: itemId as any,
              newValue,
              prevValue: prevItemsState[itemId][propName],
              itemState: itemsState[itemId],
              itemRefs: itemsRefs[itemId],
              frameDuration,
              ranWithoutChange: true,
            });
            return true; // break out of the props loop, so it only runs once per item
          });
        });
      }
      return true; // return early if skipChangeCheck was true
    }

    const prevItemsState = getPrevState()[type] as any;
    const itemsState = (getState() as AllState)[type];
    const itemsRefs = getRefs()[type];
    forEach(diffInfo.itemsChanged[type], (itemIdThatChanged) => {
      if (!(!allowedIdsMap || (allowedIdsMap && allowedIdsMap[itemIdThatChanged as string]))) return;

      breakableForEach(props, (propName) => {
        if (!(diffInfo.propsChangedBool as any)[type][itemIdThatChanged][propName]) return;

        const newValue = itemsState[itemIdThatChanged][propName];

        let canRunRun = false;

        if (becomes === undefined) canRunRun = true;
        else if (typeof becomes === "function") {
          canRunRun = becomes(newValue, prevItemsState[itemIdThatChanged][propName]);
        } else if (becomes === newValue) canRunRun = true;

        if (!canRunRun) return;

        run({
          itemId: itemIdThatChanged as any,
          newValue,
          prevValue: prevItemsState[itemIdThatChanged][propName],
          itemState: itemsState[itemIdThatChanged],
          itemRefs: itemsRefs[itemIdThatChanged],
          frameDuration,
          ranWithoutChange: false,
        });
        return true; // break out of the loop, so it only runs once
      });
    });
  };
}

function easyEffectCheckToEffectChecks<K_Type extends ItemType>(effectCheck: EasyEffect_Check<K_Type>) {
  const checksArray = toArray(effectCheck);

  return checksArray.map((check) => ({
    types: toMaybeArray(check.type),
    names: toMaybeArray(check.id),
    props: toMaybeArray(check.prop),
    addedOrRemoved: check.addedOrRemoved,
  }));
}

export function easyEffectToEffect<T_EasyEffect extends EasyEffect<any>>(easyEffect: T_EasyEffect): Effect {
  return {
    ...easyEffect,
    id: easyEffect.id ?? toSafeEffectId("effect"),
    checks: easyEffectCheckToEffectChecks(easyEffect.check),
  };
}

export function itemEffectToEffect<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(
  itemEffect: ItemEffect<K_Type, K_PropName>
): Effect {
  let effectName = itemEffect.id || "unnamedItemEffect" + Math.random();

  return easyEffectToEffect({
    ...itemEffect,
    id: effectName,
    check: { ...itemEffect.check, becomes: undefined, prop: toMaybeArray(itemEffect.check.prop) },
    run: itemEffectRunToEffectRun(itemEffect),
  });
}
