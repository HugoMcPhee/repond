import { forEach } from "chootils/dist/loops";
import meta, { RecordedChanges, UntypedDiffInfo } from "./meta";

export function createDiffInfo(diffInfo: UntypedDiffInfo) {
  diffInfo.itemTypesChanged = [];
  diffInfo.itemsChanged.all__ = [];
  diffInfo.propsChanged.all__ = [];

  diffInfo.itemTypesChangedBool = {};
  diffInfo.itemsChangedBool.all__ = {};
  diffInfo.propsChangedBool.all__ = {};

  diffInfo.itemsAdded.all__ = [];
  diffInfo.itemsRemoved.all__ = [];

  diffInfo.itemsAddedBool.all__ = {};
  diffInfo.itemsRemovedBool.all__ = {};

  // let itemTypeAddedToItemsTypesChanged = false;
  // let propAddedToPropsChanged = false;

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
    diffInfo.propsChangedBool[itemType].all__ = {};
    diffInfo.propsChanged[itemType].all__ = [];

    forEach(meta.itemNamesByItemType[itemType], (itemName) => {
      diffInfo.itemsChangedBool[itemType][itemName] = false;
      diffInfo.propsChangedBool[itemType][itemName] = {};
      diffInfo.propsChanged[itemType][itemName] = [];

      forEach(meta.propNamesByItemType[itemType], (propName) => {
        diffInfo.propsChangedBool[itemType][itemName][propName] = false;
        diffInfo.propsChangedBool[itemType].all__![propName] = false;
        diffInfo.propsChangedBool.all__![propName] = false;
      });
    });
  });
}

function clearDiffInfo(diffInfo: UntypedDiffInfo) {
  diffInfo.itemTypesChanged.length = 0;
  diffInfo.itemsChanged.all__.length = 0;
  diffInfo.propsChanged.all__!.length = 0;

  diffInfo.itemsAdded.all__.length = 0;
  diffInfo.itemsRemoved.all__.length = 0;

  // let itemTypeAddedToItemsTypesChanged = false;
  // let propAddedToPropsChanged = false;

  for (let typeIndex = 0; typeIndex < meta.itemTypeNames.length; typeIndex++) {
    const itemType = meta.itemTypeNames[typeIndex];

    diffInfo.itemTypesChangedBool[itemType] = false;
    diffInfo.itemsAdded[itemType].length = 0;
    diffInfo.itemsRemoved[itemType].length = 0;
    diffInfo.itemsChanged[itemType].length = 0;
    diffInfo.propsChanged[itemType].all__!.length = 0;

    for (let nameIndex = 0; nameIndex < meta.itemNamesByItemType[itemType].length; nameIndex++) {
      const itemName = meta.itemNamesByItemType[itemType][nameIndex];

      diffInfo.itemsChangedBool[itemType][itemName] = false;

      diffInfo.itemsAddedBool[itemType][itemName] = false;
      diffInfo.itemsAddedBool.all__[itemName] = false;
      diffInfo.itemsRemovedBool[itemType][itemName] = false;
      diffInfo.itemsRemovedBool.all__[itemName] = false;
      diffInfo.propsChanged[itemType][itemName].length = 0;

      for (let propIndex = 0; propIndex < meta.propNamesByItemType[itemType].length; propIndex++) {
        const propName = meta.propNamesByItemType[itemType][propIndex];

        diffInfo.propsChangedBool[itemType][itemName][propName] = false;
        diffInfo.propsChangedBool[itemType].all__![propName] = false;
      }
    }
  }
}

export function makeGetStatesDiffFunction() {
  const { itemTypeNames, propNamesByItemType } = meta;

  return function getStatesDiff(
    currentState: any,
    prevState: any,
    diffInfo: any,
    recordedChanges: RecordedChanges,
    checkAllChanges: boolean
  ) {
    // let itemNames = meta.itemNamesByItemType;
    let previousItemNames = [];

    // NOTE could move into same loop as below!
    clearDiffInfo(diffInfo);

    let itemTypeAddedToItemsTypesChanged = false;

    for (let typeIndex = 0; typeIndex < itemTypeNames.length; ++typeIndex) {
      const itemType = itemTypeNames[typeIndex];

      itemTypeAddedToItemsTypesChanged = false;

      if (checkAllChanges || recordedChanges.itemTypesBool[itemType] === true) {
        const itemNames = checkAllChanges ? Object.keys(currentState[itemType]) : meta.itemNamesByItemType[itemType];

        // TODO repalce this with real previous item names?
        // NOTE may need to handle added and removed items, when not using checkAllChanges (which is set when getting a patch or diff)
        const prevItemNames = checkAllChanges ? Object.keys(prevState[itemType]) : meta.itemNamesByItemType[itemType];

        // check for items removed from previous object
        for (let prevNameIndex = 0; prevNameIndex < prevItemNames.length; ++prevNameIndex) {
          const prevItemName = prevItemNames[prevNameIndex];
          if (currentState[itemType][prevItemName] === undefined) {
            diffInfo.itemsRemoved.all__.push(prevItemName);
            diffInfo.itemsRemovedBool.all__[prevItemName] = true;
            diffInfo.itemsRemoved[itemType].push(prevItemName);
            diffInfo.itemsRemovedBool[itemType][prevItemName] = true;
          }
        }

        for (let nameIndex = 0; nameIndex < itemNames.length; ++nameIndex) {
          const itemName = itemNames[nameIndex];
          if (checkAllChanges || recordedChanges.itemNamesBool[itemType]?.[itemName] === true) {
            // check for items added since previous object
            if (prevState[itemType][itemName] === undefined) {
              diffInfo.itemsAdded.all__.push(itemName);
              diffInfo.itemsAddedBool.all__[itemName] = true;
              diffInfo.itemsAdded[itemType].push(itemName);
              diffInfo.itemsAddedBool[itemType][itemName] = true;
            }

            let propChanged = false;
            let itemAddedToItemsChanged = false;
            // let itemAddedToItemsRemoved = false;
            // let itemAddedToItemsAdded = false;

            // if (diffInfo.itemsAddedBool.all__[itemName]) {
            // if the item was just added (should it mark all the properties as changed?)
            // }

            if (!diffInfo.itemsRemovedBool.all__[itemName] && !diffInfo.itemsAddedBool.all__[itemName]) {
              for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; ++propIndex) {
                const itemPropName = propNamesByItemType[itemType][propIndex];

                if (
                  checkAllChanges ||
                  recordedChanges.itemPropertiesBool[itemType]?.[itemName]?.[itemPropName] === true
                ) {
                  // propAddedToPropsChanged = false;

                  // TODO IDEA - fast compare object values
                  // if its not the same, and it's an object
                  // then compare each property
                  // There's could be a table for which properties are objects! in meta
                  // and that same table could include a list of keys
                  // meta.keysByTypeByProp = { doll: { position: "x,y,z" } }
                  // meta.objectTypeByTypeByProp = { doll: { position: "point3D" } }

                  // if the properties are x,y,z, then use "point3D" instead of the array?
                  // it can use pointIsSame3d(prevValue, newValue)

                  // if (
                  //   currentState[itemType][itemName][itemPropName] !== null &&
                  //   typeof currentState[itemType][itemName][itemPropName] ===
                  //     "object"
                  // ) {
                  //   propChanged =
                  //     JSON.stringify(
                  //       currentState[itemType][itemName][itemPropName]
                  //     ) !==
                  //     JSON.stringify(
                  //       prevState[itemType][itemName][itemPropName]
                  //     );
                  // } else {
                  //   propChanged =
                  //     currentState[itemType][itemName][itemPropName] !==
                  //     prevState[itemType][itemName][itemPropName];
                  // }

                  propChanged =
                    currentState[itemType][itemName][itemPropName] !== prevState[itemType][itemName][itemPropName];

                  if (propChanged) {
                    if (!itemTypeAddedToItemsTypesChanged) {
                      diffInfo.itemTypesChanged.push(itemType);
                      diffInfo.itemTypesChangedBool[itemType] = true;
                      itemTypeAddedToItemsTypesChanged = true;
                    }

                    if (!itemAddedToItemsChanged) {
                      diffInfo.itemsChanged[itemType].push(itemName);
                      diffInfo.itemsChangedBool[itemType][itemName] = true;

                      diffInfo.itemsChanged.all__.push(itemName);
                      diffInfo.itemsChangedBool.all__[itemName] = true;

                      itemAddedToItemsChanged = true;
                    }

                    if (!diffInfo.propsChangedBool[itemType][itemName][itemPropName]) {
                      diffInfo.propsChanged[itemType][itemName].push(itemPropName);
                      diffInfo.propsChangedBool[itemType][itemName][itemPropName] = true;
                    }

                    if (!diffInfo.propsChangedBool.all__[itemPropName]) {
                      diffInfo.propsChanged.all__.push(itemPropName);
                      diffInfo.propsChangedBool.all__[itemPropName] = true;
                    }

                    if (!diffInfo.propsChangedBool[itemType].all__[itemPropName]) {
                      diffInfo.propsChanged[itemType].all__.push(itemPropName);
                      diffInfo.propsChangedBool[itemType].all__[itemPropName] = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  // pre-compile constant iteration over object properties - Domi
  // https://stackoverflow.com/a/25700742
}
