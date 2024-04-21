import { forEach } from "chootils/dist/loops";
import { repondMeta as meta } from "../meta";
import { _updateRepond } from "../updating";
import { runWhenAddingAndRemovingItems, runWhenDoingSetStates } from "./runWhens";
import { mergeStates } from "../copyStates";

export function _setState(newState: any, callback?: any) {
  runWhenDoingSetStates(() => {
    const newStateValue = typeof newState === "function" ? newState(meta.nowState) : newState;

    if (!newStateValue) return;
    mergeStates(
      newStateValue,
      meta.nowState,
      meta.nowMetaPhase === "runningEffects" ? meta.recordedEffectChanges : meta.recordedStepEndEffectChanges,
      meta.recordedStepEndEffectChanges
    );
  }, callback);
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
  }, callback);
}

export function _addItem(
  { type, id, state, refs }: { type: string; id: string; state?: any; refs?: any },
  callback?: any
) {
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
  }, callback);
}
