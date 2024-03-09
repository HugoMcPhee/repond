import meta from "./meta";
import { Effect_OneCheck, EffectPhase } from "./types";

const NO_EFFECT_NAMES: string[] = [];
const CHECK_ALL_OPTION = ["all__"];

// created once and cleared to avoid making many new arrays each time, to save memory
const changedEffectIds: string[] = [];

export default function checkEffects(phase: EffectPhase = "endOfStep", stepName: string = "default"): string[] {
  changedEffectIds.length = 0;

  let effectNames = meta.effectIdsByPhaseByStep[phase][stepName] ?? NO_EFFECT_NAMES;
  let allEffects = meta.allEffects;

  for (let nameIndex = 0; nameIndex < effectNames.length; nameIndex++) {
    const effectName = effectNames[nameIndex];

    const effect = allEffects[effectName];

    const effectChecks = effect.checks;

    for (let checkIndex = 0; checkIndex < effectChecks.length; checkIndex++) {
      const check = effectChecks[checkIndex];
      if (checkOneCheckForChanges(check, meta.diffInfo)) {
        changedEffectIds.push(effect.id);
        break;
      }
    }
  }

  return changedEffectIds;
}

function checkOneCheckForChanges(check: Effect_OneCheck, diffInfo: typeof meta.diffInfo) {
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
    const itemType = editedCheck.types[typesIndex];

    // NOTE checking itemsRemoved used to cause issues, but doesn't seem to now?
    if (editedCheck.ids[0] === "all__" && diffInfo.itemsAdded?.[itemType]?.length > 0) {
      didChange = true;
      break;
    }

    for (let idIndex = 0; idIndex < editedCheck.ids.length; idIndex++) {
      const itemId = editedCheck.ids[idIndex];

      // used to check itemsRemoved, but not now?
      if (diffInfo.itemsAddedBool[itemType] && diffInfo.itemsAddedBool[itemType][itemId]) {
        didChange = true;
        break;
      }

      for (let propIndex = 0; propIndex < editedCheck.props.length; propIndex++) {
        const loopedPropertyName = editedCheck.props[propIndex];
        if (
          diffInfo.propsChangedBool[itemType] &&
          diffInfo.propsChangedBool[itemType][itemId] &&
          (diffInfo.propsChangedBool[itemType][itemId][loopedPropertyName] === true || loopedPropertyName === "all__")
        ) {
          didChange = true;
          break;
        }
      }
    }
  }

  return didChange;
}
