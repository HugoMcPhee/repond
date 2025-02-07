import { removeItemFromArrayInPlace } from "chootils/dist/arrays";
import { repondMeta as meta } from "../../meta";
import { whenDoingEffectsRunAtStart, whenStartingEffects, whenStoppingEffects } from "../runWhens";
import { Effect, EffectPhase } from "../../types";
import { forEach } from "chootils/dist/loops";

export function _startEffect(newEffect: Effect) {
  const phase: EffectPhase = newEffect.atStepEnd ? "endOfStep" : "duringStep";
  const step = newEffect.step ?? "default";
  const effectId = newEffect.id ?? toSafeEffectId();

  // TODO setupEffect the frist time each time if the cache stuff isn't there
  storeCachedValuesForEffect(newEffect);

  if (newEffect.runAtStart) {
    whenDoingEffectsRunAtStart(() => runEffectWithoutChange(newEffect));
  }

  whenStartingEffects(() => {
    meta.liveEffectsMap[effectId] = newEffect;
    const idsByStep = meta.effectIdsByPhaseByStep[phase];
    idsByStep[step] = idsByStep[step] || [];
    if (!idsByStep[step].includes(effectId)) idsByStep[step].push(effectId);
  });

  return effectId;
}

export function runEffectWithoutChangeForItems(effect: Effect) {
  let itemIdsToRun = getItemIdsForEffect(effect);
  forEach(itemIdsToRun, (itemId) => effect.run(itemId, meta.diffInfo as any, 16.66666, true /* ranWithoutChange */));
}

export function runEffectWithoutChange(effect: Effect) {
  if (effect.isPerItem) {
    runEffectWithoutChangeForItems(effect);
    return;
  }

  effect.run("", meta.diffInfo as any, 16.66666, true /* ranWithoutChange */);
}

// Return or cache item types for an effect
export function getItemTypesFromEffect(effect: Effect): string[] {
  let itemIdsToRun: string[] = [];

  // if (effect._itemTypes) return effect._itemTypes;
  if (effect._itemTypes?.length) return effect._itemTypes;

  const changes = effect.changes;

  if (changes.length === 1) {
    const itemType = meta.itemTypeByPropPathId[changes[0]];
    if (!itemType) {
      console.warn(`(one change) Effect ${effect.id} has no item types =-=-=-=-=-=-=-=-=-=-'`);
      console.log("effect", effect.changes[0]);
      console.log(JSON.stringify(meta.itemTypeByPropPathId, null, 2));
      return [];
    }
    // return undefined;
    return [itemType];
  }

  const itemTypeMap = {};
  forEach(changes, (change) => {
    const itemType = meta.itemTypeByPropPathId[change];
    if (itemType && !itemTypeMap[itemType]) {
      itemTypeMap[itemType] = true;
    }
  });
  const itemTypes = Object.keys(itemTypeMap);
  if (!itemTypes.length) {
    console.warn(`Effect ${effect.id} has no item types =-=-=-=-=-=-=-=-=-=-'`);
    console.warn(effect.changes);
    console.log("effect", effect);
  }

  return itemTypes;
}

export function getItemIdsForEffect(effect: Effect): string[] {
  if (effect.itemIds) return effect.itemIds;

  let itemIdsToRun: string[] = [];
  const itemTypes = getItemTypesFromEffect(effect);

  if (!effect._itemTypes) effect._itemTypes = itemTypes;

  const changes = effect.changes;

  if (itemTypes.length === 1) {
    const itemType = meta.itemTypeByPropPathId[changes[0]];
    return meta.itemIdsByItemType[itemType] ?? [];
  }

  itemTypes.forEach((itemType) => {
    const itemIds = meta.itemIdsByItemType[itemType];
    if (itemIds) itemIdsToRun.push(...itemIds);
  });
  return itemIdsToRun;
}

export function storeCachedValuesForEffect(effect: Effect) {
  if (effect.isPerItem === undefined) effect.isPerItem = true; // default to per item

  if (effect._allowedIdsMap && effect._itemTypes && effect._propsByItemType) return; // NOTE _allowedIdsMap can be undefined, so the check isn't that useful

  let allowedIdsMap: { [itemId: string]: boolean } | undefined = undefined;

  const itemTypes = getItemTypesFromEffect(effect);
  if (!itemTypes?.length) {
    console.log(`Effect ${effect.id} has no item types =-=-=-=-=-=-=-=-=-=-'`);
  }
  effect._itemTypes = itemTypes;
  const ids = effect.itemIds;

  if (ids) {
    allowedIdsMap = {};
    forEach(ids, (itemId) => (allowedIdsMap![itemId] = true));
  }
  effect._allowedIdsMap = allowedIdsMap;

  const propsByItemType = {};
  const checkAddedByItemType = {};
  const checkRemovedByItemType = {};
  forEach(effect.changes, (change) => {
    const itemType = meta.itemTypeByPropPathId[change];
    if (!propsByItemType[itemType]) propsByItemType[itemType] = [];
    const foundPropName = meta.propKeyByPropPathId[change];
    if (foundPropName) {
      propsByItemType[itemType].push(foundPropName);
    } else {
      const foundSpecialPropName = meta.specialKeyByPropPathId[change];
      if (foundSpecialPropName === "__added") checkAddedByItemType[itemType] = true;
      if (foundSpecialPropName === "__removed") checkRemovedByItemType[itemType] = true;
    }
  });
  effect._propsByItemType = propsByItemType;
  effect._checkAddedByItemType = checkAddedByItemType;
  effect._checkRemovedByItemType = checkRemovedByItemType;
}

export function _stopEffect(effectId: string) {
  whenStoppingEffects(() => {
    const effect = meta.liveEffectsMap[effectId];
    if (!effect) return;
    const phase: EffectPhase = !!effect.atStepEnd ? "endOfStep" : "duringStep";
    const step = effect.step ?? "default";

    removeItemFromArrayInPlace(meta.effectIdsByPhaseByStep[phase][step] ?? [], effect.id);

    delete meta.liveEffectsMap[effectId];
  });
}

export function toSafeEffectId(prefix?: string): string {
  const counterNumber = meta.autoEffectIdCounter;
  meta.autoEffectIdCounter += 1;
  return (prefix || "autoEffect") + "_" + counterNumber;
}
