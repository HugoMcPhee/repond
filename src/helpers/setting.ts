import { forEach } from "chootils/dist/loops";
import { repondMeta as meta } from "../meta";
import { _updateRepond } from "../updating";
import { runWhenAddingAndRemovingItems, whenSettingStates } from "./runWhens";
import { mergeStates_OLD, mergeToState } from "../copyStates";
import { onNextTick } from "repond/src/usable/getSet";

export function _setState_OLD(newState: any, callback?: any) {
  whenSettingStates(() => {
    const newStateValue = typeof newState === "function" ? newState(meta.nowState) : newState;

    if (!newStateValue) return;
    mergeStates_OLD(
      newStateValue,
      meta.nowState,
      meta.nowMetaPhase === "runningEffects" ? meta.recordedEffectChanges : meta.recordedStepEndEffectChanges,
      meta.recordedStepEndEffectChanges
    );
  });
  onNextTick(callback);
}

export function _setState(propPath: string, newValue: any, itemId?: string) {
  whenSettingStates(() => {
    if (newValue === undefined) return;

    if (!propPath) {
      console.error("propPath must be provided");
      return;
    }

    if (typeof propPath !== "string") {
      console.error("propPath must be a string");
      console.log("propPath", propPath);

      return;
    }

    const storeType = meta.itemTypeByPropPathId[propPath];
    const propKey = meta.propKeyByPropPathId[propPath];
    let foundItemId = itemId || meta.itemIdsByItemType[storeType]?.[0];
    if (!foundItemId) {
      foundItemId = Object.keys(meta.nowState[storeType] ?? {})[0];
      console.warn(
        `${propPath}No itemId found for setState ${storeType}, using first found itemId: ${foundItemId} from Object keys`
      );
    }

    mergeToState(
      storeType,
      propKey,
      newValue,
      foundItemId,
      meta.nowState,
      meta.nowMetaPhase === "runningEffects" ? meta.recordedEffectChanges : meta.recordedStepEndEffectChanges,
      meta.recordedStepEndEffectChanges
    );
  });
}

export function _removeItem({ type, id }: { type: string; id: string }, callback?: any) {
  if (!meta.willRemoveItemsInfo[type]) meta.willRemoveItemsInfo[type] = {};
  meta.willRemoveItemsInfo[type][id] = true;
  runWhenAddingAndRemovingItems(() => {
    // removing itemId
    delete meta.nowState[type][id];
    meta.itemIdsByItemType[type] = Object.keys(meta.nowState[type]);
    // delete meta.currentRefs[itemType][itemId]; // now done at the end of update repond
    meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;
    meta.recordedStepEndEffectChanges.somethingChanged = true;
    meta.recordedEffectChanges.itemTypesBool[type] = true;
    meta.recordedEffectChanges.somethingChanged = true;
  });
}

export function _addItem({ type, id, state, refs }: { type: string; id: string; state?: any; refs?: any }) {
  if (!meta.willAddItemsInfo[type]) meta.willAddItemsInfo[type] = {};
  meta.willAddItemsInfo[type][id] = true;
  runWhenAddingAndRemovingItems(() => {
    meta.nowState[type][id] = {
      ...meta.defaultStateByItemType[type](id),
      ...(state || {}),
    };
    meta.nowRefs[type][id] = {
      ...meta.defaultRefsByItemType[type](id, meta.nowState[id]),
      ...(refs || {}),
    };
    meta.itemIdsByItemType[type].push(id);
    meta.recordedStepEndEffectChanges.itemTypesBool[type] = true;

    // TODO Figure out if adding an item should record the properties as changed or not?

    meta.recordedStepEndEffectChanges.itemPropsBool[type][id] = {};
    meta.recordedEffectChanges.itemPropsBool[type][id] = {};

    meta.diffInfo.propsChanged[type][id] = [];
    meta.diffInfo.propsChangedBool[type][id] = {};

    meta.recordedStepEndEffectChanges.itemIdsBool[type][id] = true;
    meta.recordedStepEndEffectChanges.somethingChanged = true;
    meta.recordedEffectChanges.itemTypesBool[type] = true;

    meta.recordedEffectChanges.itemIdsBool[type][id] = true;
    meta.recordedEffectChanges.somethingChanged = true;

    // NOTE new items with props different to the defaults props are recorded as changed
    const itemPropNames = meta.propNamesByItemType[type];
    forEach(itemPropNames, (propName) => {
      const propChangedFromDefault =
        meta.nowState[type][id][propName] !== meta.defaultStateByItemType[type](id)[propName];
      if (propChangedFromDefault) {
        meta.recordedStepEndEffectChanges.itemPropsBool[type][id][propName] = true;
        meta.recordedEffectChanges.itemPropsBool[type][id][propName] = true;
      }
    });
  });
}
