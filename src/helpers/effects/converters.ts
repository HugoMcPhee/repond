import { breakableForEach, forEach } from "chootils/dist/loops";
import { repondMeta as meta } from "../../meta";
import { AllState, DiffInfo, Effect, ItemType, PropName } from "../../types";
import { getPrevState, getState } from "../../usable/getSet";
import { toMaybeArray } from "../../utils";

function makeCombinedRun<K_Type extends ItemType, K_PropName extends PropName<K_Type>>(effect: Effect) {
  let allowedIdsMap: { [itemId: string]: boolean } | undefined = undefined;
  const changes = effect.changes;
  const ids = toMaybeArray(effect.itemIds);

  if (ids) {
    allowedIdsMap = {};
    forEach(ids, (itemId) => (allowedIdsMap![itemId] = true));
  }

  //

  return (diffInfo: DiffInfo, frameDuration: number, skipChangeCheck?: boolean) => {
    // if skipChangeCheck is true, it will run the run function regardless of the changes
    if (skipChangeCheck) {
      breakableForEach(changes, (changeName) => {
        const propName = meta.propKeyByPropPathId[changeName];
        let itemType = meta.itemTypeByPropPathId[changeName];

        const isForAddedOrRemoved = !propName;

        if (isForAddedOrRemoved) {
          const [itemType, secondPart] = changeName.split(":")[1];
          const isForAdded = secondPart === "_added";
          const isForRemoved = secondPart === "_removed";

          // check changes for added or removed here and run the run function?
          // return
        }

        const idsToRun = effect.itemIds?.length ? effect.itemIds : meta.itemIdsByItemType[type];

        forEach(idsToRun, (itemId) => {
          effect.run(itemId, "none", frameDuration);
          return true; // break out of the props loop, so it only runs once per item
        });
      });
      return true; // return early if skipChangeCheck was true
    }

    forEach(diffInfo.itemsChanged[type], (itemIdThatChanged) => {
      if (!(!allowedIdsMap || (allowedIdsMap && allowedIdsMap[itemIdThatChanged as string]))) return;

      let thisItemsPrevState = getPrevState(type, itemIdThatChanged) as AllState[K_Type][keyof AllState[K_Type]];
      const itemWasJustAdded = diffInfo.itemsAddedBool[type][itemIdThatChanged];
      if (itemWasJustAdded) thisItemsPrevState = meta.defaultStateByItemType[type](itemIdThatChanged) as any;

      breakableForEach(props, (propName) => {
        if (!(diffInfo.propsChangedBool as any)[type][itemIdThatChanged][propName]) return;
        const itemState = getState(type, itemIdThatChanged);
        const newValue = itemState?.[propName];

        run({
          itemId: itemIdThatChanged as any,
          newValue,
          prevValue: thisItemsPrevState[propName],
          itemState: itemState as any,
          itemRefs: itemsRefs[itemIdThatChanged],
          frameDuration,
          ranWithoutChange: false,
        });
        return true; // break out of the loop, so it only runs once
      });
    });
  };
}
