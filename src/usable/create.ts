import { forEach } from "chootils/dist/loops";
import { ItemTypeDefs } from "../declarations";
import { createDiffInfo } from "../getStatesDiff";
import { repondMeta as meta, UntypedDiffInfo } from "../meta";
import { createRecordedChanges } from "../updating";

const SPECIAL_CHANGE_KEYS = ["__added", "__removed"];

export function initRepond<T_ItemTypeDefs extends ItemTypeDefs, T_StepNamesParam extends Readonly<string[]>>(
  itemTypeDefs: T_ItemTypeDefs,
  stepNames: T_StepNamesParam
) {
  const renamedItemTypeDefs: ItemTypeDefs = {};

  Object.entries(itemTypeDefs).forEach(([type, definition]) => {
    renamedItemTypeDefs[type.replace(/Store$/, "")] = definition; // Remove "Store" from the end of the key, if present
  });

  meta.itemTypeNames = Object.keys(renamedItemTypeDefs);

  const editedStepNames = stepNames ? [...stepNames] : ["default"];
  if (!editedStepNames.includes("default")) editedStepNames.push("default");

  meta.stepNames = editedStepNames;
  meta.nowStepIndex = 0;
  meta.nowStepName = stepNames[meta.nowStepIndex];

  for (const type of meta.itemTypeNames) {
    meta.nowState[type] = {};
    meta.prevState[type] = {};
    meta.nowRefs[type] = {};
    meta.defaultStateByItemType[type] = renamedItemTypeDefs[type].newState;
    meta.defaultRefsByItemType[type] = renamedItemTypeDefs[type].newRefs;
    meta.itemIdsByItemType[type] = [];

    const propNames = Object.keys(meta.defaultStateByItemType[type]?.("anyItemId"));

    meta.propNamesByItemType[type] = propNames;

    SPECIAL_CHANGE_KEYS.forEach((key) => {
      meta.specialKeyByPropPathId[`${type}.${key}`] = key;
      meta.itemTypeByPropPathId[`${type}.${key}`] = type;
    });

    forEach(propNames, (propName) => {
      const propPathId = `${type}.${propName}`;
      meta.itemTypeByPropPathId[propPathId] = type;
      meta.propKeyByPropPathId[propPathId] = propName;
    });
  }

  createRecordedChanges(meta.recordedEffectChanges);
  createRecordedChanges(meta.recordedStepEndEffectChanges);
  createDiffInfo(meta.diffInfo as unknown as UntypedDiffInfo);
  meta.didInit = true;
}
