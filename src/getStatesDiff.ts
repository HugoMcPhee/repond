import { forEach } from "chootils/dist/loops";
import { repondMeta as meta, RecordedChanges, UntypedDiffInfo } from "./meta";

export function createDiffInfo(diffInfo: UntypedDiffInfo) {
  diffInfo.itemTypesChanged = [];
  // Not needed since these should already be defined, but maybe its better to jsut make this function return an empty diffInfo, instead of filling out a minimum one
  // diffInfo.itemTypesWithAdded = [];
  // diffInfo.itemTypesWithRemoved = [];
  // diffInfo.itemsChanged = {};
  // diffInfo.propsChanged = {};
  // diffInfo.itemsAdded = {};
  // diffInfo.itemsRemoved = {};
  diffInfo.itemsChanged.__all = [];
  diffInfo.propsChanged.__all = [];

  diffInfo.itemTypesChangedBool = {};
  diffInfo.itemTypesWithAddedBool = {};
  diffInfo.itemTypesWithRemovedBool = {};
  diffInfo.itemsChangedBool.__all = {};
  diffInfo.propsChangedBool.__all = {};

  diffInfo.itemsAdded.__all = [];
  diffInfo.itemsRemoved.__all = [];
  diffInfo.itemTypesWithAdded = [];
  diffInfo.itemTypesWithRemoved = [];

  diffInfo.itemsAddedBool.__all = {};
  diffInfo.itemsRemovedBool.__all = {};
  diffInfo.itemTypesWithAddedBool = {};
  diffInfo.itemTypesWithRemovedBool = {};

  forEach(meta.itemTypeNames, (itemType) => {
    diffInfo.itemTypesChangedBool[itemType] = false;
    diffInfo.itemsChangedBool[itemType] = {};
    diffInfo.propsChangedBool[itemType] = {};
    diffInfo.itemsAdded[itemType] = [];
    diffInfo.itemsRemoved[itemType] = [];
    diffInfo.itemsAddedBool[itemType] = {};
    diffInfo.itemsRemovedBool[itemType] = {};
    diffInfo.itemsChanged[itemType] = [];
    diffInfo.propsChanged[itemType] = {};
    diffInfo.propsChangedBool[itemType].__all = {};
    diffInfo.propsChanged[itemType].__all = [];

    forEach(meta.itemIdsByItemType[itemType], (itemId) => {
      diffInfo.itemsChangedBool[itemType][itemId] = false;
      diffInfo.propsChangedBool[itemType][itemId] = {};
      diffInfo.propsChanged[itemType][itemId] = [];

      forEach(meta.propNamesByItemType[itemType], (propName) => {
        diffInfo.propsChangedBool[itemType][itemId][propName] = false;
        diffInfo.propsChangedBool[itemType].__all![propName] = false;
        diffInfo.propsChangedBool.__all![propName] = false;
      });
    });
  });
}

function clearDiffInfo(diffInfo: UntypedDiffInfo) {
  diffInfo.itemTypesChanged.length = 0;
  diffInfo.itemTypesWithAdded.length = 0;
  diffInfo.itemTypesWithRemoved.length = 0;
  diffInfo.itemsChanged.__all.length = 0;
  diffInfo.propsChanged.__all!.length = 0;

  diffInfo.itemsAdded.__all.length = 0;
  diffInfo.itemsRemoved.__all.length = 0;

  for (let typeIndex = 0; typeIndex < meta.itemTypeNames.length; typeIndex++) {
    const itemType = meta.itemTypeNames[typeIndex];

    diffInfo.itemTypesChangedBool[itemType] = false;
    diffInfo.itemTypesWithAddedBool[itemType] = false;
    diffInfo.itemTypesWithRemovedBool[itemType] = false;
    diffInfo.itemsAdded[itemType].length = 0;
    diffInfo.itemsRemoved[itemType].length = 0;
    diffInfo.itemsChanged[itemType].length = 0;
    // diffInfo.propsChanged[itemType].__all!.length = 0;

    diffInfo.itemsChangedBool[itemType] = {};

    diffInfo.itemsAddedBool[itemType] = {};
    diffInfo.itemsAddedBool.__all = {};
    diffInfo.itemsRemovedBool[itemType] = {};
    diffInfo.itemsRemovedBool.__all = {};
    diffInfo.propsChanged[itemType] = {};
    diffInfo.propsChangedBool[itemType] = {};
    diffInfo.propsChangedBool[itemType].__all! = {};

    // for (let nameIndex = 0; nameIndex < meta.itemIdsByItemType[itemType].length; nameIndex++) {
    //   const itemId = meta.itemIdsByItemType[itemType][nameIndex];

    //   diffInfo.itemsChangedBool[itemType][itemId] = false;

    //   diffInfo.itemsAddedBool[itemType][itemId] = false;
    //   diffInfo.itemsAddedBool.__all[itemId] = false;
    //   diffInfo.itemsRemovedBool[itemType][itemId] = false;
    //   diffInfo.itemsRemovedBool.__all[itemId] = false;
    //   diffInfo.propsChanged[itemType][itemId].length = 0;

    //   for (let propIndex = 0; propIndex < meta.propNamesByItemType[itemType].length; propIndex++) {
    //     const propName = meta.propNamesByItemType[itemType][propIndex];

    //     diffInfo.propsChangedBool[itemType][itemId][propName] = false;
    //     diffInfo.propsChangedBool[itemType].__all![propName] = false;
    //   }
    // }
  }
}

export function getStatesDiff(
  nowState: any,
  prevState: any,
  diffInfo: any,
  recordedChanges: RecordedChanges,
  checkAllChanges: boolean
) {
  const propNamesByItemType = meta.propNamesByItemType;
  // NOTE could move into same loop as below!
  clearDiffInfo(diffInfo);

  let itemTypeAddedToItemsTypesChanged = false;

  const checkedItemTypes = checkAllChanges ? Object.keys(nowState) : meta.itemTypeNames;

  for (let typeIndex = 0; typeIndex < checkedItemTypes.length; ++typeIndex) {
    const itemType = checkedItemTypes[typeIndex];

    itemTypeAddedToItemsTypesChanged = false;

    // if (checkAllChanges) {
    //   const shouldCheckItemType = !!nowState[itemType];
    //   console.log("shouldCheckItemType", itemType, shouldCheckItemType);

    //   if (!shouldCheckItemType) {
    //     continue;
    //   }
    // }

    if (!checkAllChanges && recordedChanges.itemTypesBool[itemType] !== true) continue;

    const itemIds = checkAllChanges ? Object.keys(nowState[itemType]) : meta.itemIdsByItemType[itemType];

    const prevItemIds = checkAllChanges ? Object.keys(prevState[itemType]) : meta.prevItemIdsByItemType[itemType];

    // Check for items removed from previous state
    for (let prevNameIndex = 0; prevNameIndex < prevItemIds.length; ++prevNameIndex) {
      const prevItemId = prevItemIds[prevNameIndex];
      if (nowState?.[itemType]?.[prevItemId] === undefined) {
        diffInfo.itemsRemoved.__all.push(prevItemId);
        diffInfo.itemsRemovedBool.__all[prevItemId] = true;
        diffInfo.itemsRemoved[itemType].push(prevItemId);
        diffInfo.itemsRemovedBool[itemType][prevItemId] = true;
        if (diffInfo.itemTypesWithRemovedBool[itemType] !== true) {
          diffInfo.itemTypesWithRemoved.push(itemType);
          diffInfo.itemTypesWithRemovedBool[itemType] = true;
        }
      }
    }

    for (let idIndex = 0; idIndex < itemIds.length; ++idIndex) {
      const itemId = itemIds[idIndex];
      // break early
      if (!checkAllChanges && recordedChanges.itemIdsBool[itemType]?.[itemId] !== true) continue;
      // check for items added since previous object
      if (prevState?.[itemType]?.[itemId] === undefined) {
        diffInfo.itemsAdded.__all.push(itemId);
        diffInfo.itemsAddedBool.__all[itemId] = true;
        diffInfo.itemsAdded[itemType].push(itemId);
        diffInfo.itemsAddedBool[itemType][itemId] = true;
        if (diffInfo.itemTypesWithAddedBool[itemType] !== true) {
          diffInfo.itemTypesWithAdded.push(itemType);
          diffInfo.itemTypesWithAddedBool[itemType] = true;
        }
      }

      let propChanged = false;
      let itemAddedToItemsChanged = false;

      // Dont check for removed items, if it was just added then check if the properties are different to default
      // NOTE the item may never be deleted here, since it's only looping through current items
      const itemWasRemoved = diffInfo.itemsRemovedBool.__all[itemId];
      const itemWasAdded = diffInfo.itemsAddedBool.__all[itemId];
      let canRun = !itemWasRemoved;
      if (checkAllChanges) {
        canRun = !itemWasRemoved && !itemWasAdded;
      }
      // if (!diffInfo.itemsRemovedBool.__all[itemId] ) {
      if (canRun) {
        for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; ++propIndex) {
          const itemPropName = propNamesByItemType[itemType][propIndex];
          if (!checkAllChanges && recordedChanges.itemPropsBool[itemType]?.[itemId]?.[itemPropName] !== true) continue;

          /*
                TODO IDEA - fast compare object values
                
                A) Preset how specific props should be compared:
                meta.fastPropComparisonMap = { "doll.position": pointIsSame3d }
                
                B) Use a function to compare the values (cache metadata when making stores)
                meta.objectKeysByPropId = { "dolls.position": ["x","y","z"] } }

                when comparing to prevState, if the prop exists in the `meta.objectKeysByPropId` then compare the keys, instead of the whole object?

          */

          const wasJustAdded = diffInfo.itemsAddedBool.__all[itemId];

          if (wasJustAdded) {
            propChanged =
              nowState[itemType][itemId][itemPropName] !== meta.newStateByItemType[itemType](itemId)[itemPropName];
            // console.log("propChanged", itemType, itemId, itemPropName);
          } else {
            // This compares the current state to the previous state
            propChanged = nowState[itemType][itemId][itemPropName] !== prevState[itemType][itemId][itemPropName];
          }

          if (propChanged) {
            if (!itemTypeAddedToItemsTypesChanged) {
              diffInfo.itemTypesChanged.push(itemType);
              diffInfo.itemTypesChangedBool[itemType] = true;
              itemTypeAddedToItemsTypesChanged = true;
            }

            if (!itemAddedToItemsChanged) {
              diffInfo.itemsChanged[itemType].push(itemId);
              diffInfo.itemsChangedBool[itemType][itemId] = true;

              diffInfo.itemsChanged.__all.push(itemId);
              diffInfo.itemsChangedBool.__all[itemId] = true;

              itemAddedToItemsChanged = true;
            }

            if (!diffInfo.propsChangedBool?.[itemType]?.[itemId]) {
              diffInfo.propsChangedBool[itemType][itemId] = {};
              diffInfo.propsChanged[itemType][itemId] = [];
            }

            if (!diffInfo.propsChanged[itemType][itemId]) {
              diffInfo.propsChanged[itemType][itemId] = [];
              diffInfo.propsChangedBool[itemType][itemId] = {};
            }

            if (!diffInfo.propsChangedBool?.[itemType]?.[itemId]?.[itemPropName]) {
              diffInfo.propsChanged[itemType][itemId].push(itemPropName);
              diffInfo.propsChangedBool[itemType][itemId][itemPropName] = true;
            }

            if (!diffInfo.propsChangedBool.__all[itemPropName]) {
              diffInfo.propsChanged.__all.push(itemPropName);
              diffInfo.propsChangedBool.__all[itemPropName] = true;
            }

            if (!diffInfo.propsChanged[itemType].__all) {
              diffInfo.propsChanged[itemType].__all = [];
              diffInfo.propsChangedBool[itemType].__all = {};
            }
            if (!diffInfo.propsChangedBool[itemType].__all[itemPropName]) {
              diffInfo.propsChanged[itemType].__all.push(itemPropName);
              diffInfo.propsChangedBool[itemType].__all[itemPropName] = true;
            }
          }
        }
      }
    }
  }
}
