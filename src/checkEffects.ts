import meta from "repond/src/meta";
import { EffectCheck, EffectPhase } from "repond/src/types";

const NO_EFFECT_NAMES: string[] = [];
const CHECK_ALL_OPTION = ["all__"];

// created once and cleared to avoid making many new arrays each time, to save memory
const effectNamesToUpdate: string[] = [];

export default function checkEffects(phase: EffectPhase = "endOfStep", stepName: string = "default"): string[] {
  effectNamesToUpdate.length = 0;

  let foundEffectNames = meta.effectIdsByPhaseByStep[phase][stepName] ?? NO_EFFECT_NAMES;
  let allEffects = meta.allEffects;

  for (let nameIndex = 0; nameIndex < foundEffectNames.length; nameIndex++) {
    const effectName = foundEffectNames[nameIndex];

    const effect = allEffects[effectName];
    const effectCheck = effect.check;

    for (let checkerIndex = 0; checkerIndex < effectCheck.length; checkerIndex++) {
      const check = effectCheck[checkerIndex];

      // NOTE The diff info here could be unique for this step!
      // ( using the diff found from prevStatesByStep[stepName] )
      // NOTE the step diffInfo should probably also be passed to the effects when they run

      if (checkForChanges(check, meta.diffInfo)) {
        effectNamesToUpdate.push(effect.id);
        break;
      }
    }
  }

  return effectNamesToUpdate;
}

function checkForChanges(check: EffectCheck<any, any>, diffInfo: typeof meta.diffInfo) {
  const editedCheck = {
    types: check.types || CHECK_ALL_OPTION,
    ids: check.ids || CHECK_ALL_OPTION,
    props: check.props || CHECK_ALL_OPTION,
  };

  let didChange = false;

  // only updates on items removed if this property is true
  if (check.addedOrRemoved) {
    for (let typesIndex = 0; typesIndex < editedCheck.types.length; typesIndex++) {
      const itemType = editedCheck.types[typesIndex];

      if (
        (editedCheck.ids[0] === "all__" && diffInfo.itemsAdded[itemType].length > 0) ||
        diffInfo.itemsRemoved[itemType].length > 0
      ) {
        didChange = true;
        break;
      }

      for (let idsIndex = 0; idsIndex < editedCheck.ids.length; idsIndex++) {
        const itemId = editedCheck.ids[idsIndex];

        if (
          (diffInfo.itemsAddedBool[itemType] && diffInfo.itemsAddedBool[itemType][itemId]) ||
          (diffInfo.itemsRemovedBool[itemType] && diffInfo.itemsRemovedBool[itemType][itemId])
        ) {
          didChange = true;
          break;
        }
      }
    }

    // exist the function before checking the other updates (if onlyAddedOrRemoved is true)
    return didChange;
  }

  for (let typesIndex = 0; typesIndex < editedCheck.types.length; typesIndex++) {
    const loopedItemType = editedCheck.types[typesIndex];

    if (
      editedCheck.ids[0] === "all__" &&
      diffInfo.itemsAdded?.[loopedItemType]?.length > 0
      // diffInfo.itemsRemoved[loopedItemType].length > 0)   // checking itemsRemoved used to cause issues, but doesn't seem to now?
    ) {
      didChange = true;
      break;
    }

    for (let idsIndex = 0; idsIndex < editedCheck.ids.length; idsIndex++) {
      const loopedItemId = editedCheck.ids[idsIndex];

      if (diffInfo.itemsAddedBool[loopedItemType] && diffInfo.itemsAddedBool[loopedItemType][loopedItemId]) {
        // checking itemsRemoved used to cause issues, but doesn't seem to now?
        // (diffInfo.itemsRemovedBool[loopedItemType] &&
        // diffInfo.itemsRemovedBool[loopedItemType][loopedItemId])
        didChange = true;
        break;
      }

      for (let propIndex = 0; propIndex < editedCheck.props.length; propIndex++) {
        const loopedPropertyName = editedCheck.props[propIndex];
        if (
          diffInfo.propsChangedBool[loopedItemType] &&
          diffInfo.propsChangedBool[loopedItemType][loopedItemId] &&
          (diffInfo.propsChangedBool[loopedItemType][loopedItemId][loopedPropertyName] === true ||
            loopedPropertyName === "all__")
        ) {
          didChange = true;
          break;
        }
      }
    }
  }

  return didChange;
}
