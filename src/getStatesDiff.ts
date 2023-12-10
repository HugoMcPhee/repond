import { forEach } from "chootils/dist/loops";
import meta, { RecordedChanges, UntypedDiffInfo } from "./meta";

// for initialising array or object
// adds a if () !exists then equals [] etc
function addIfEmpty(propertyString: string, initialValue: string) {
  return `if (!${propertyString}) {
  ${propertyString} = ${initialValue};
}
`;
}

export function makeGetStatesDiffFunction_prev() {
  const { itemTypeNames, propNamesByItemType } = meta;

  // pre-compile constant iteration over object properties - Domi
  // https://stackoverflow.com/a/25700742

  let diffFunctionString = `
    let itemNames = [];
  let previousItemNames  = [];
  diffInfo.propsChanged.all__ = [];
  diffInfo.propsChangedBool.all__ = {};
  diffInfo.itemsChanged.all__ = [];
  diffInfo.itemsChangedBool.all__ = {};
  diffInfo.itemsAdded.all__ = [];
  diffInfo.itemsAddedBool.all__ = {};
  diffInfo.itemsRemoved.all__ = [];
  diffInfo.itemsRemovedBool.all__ = {};
  let itemTypeAddedToItemsTypesChanged = false;
  let propAddedToPropsChanged = false;
  diffInfo.itemTypesChanged = [];
  diffInfo.itemTypesChangedBool = {};

   `;
  for (let i = 0; i < itemTypeNames.length; ++i) {
    const itemType = itemTypeNames[i];

    // it needs to get the item names
    diffFunctionString += `


    itemTypeAddedToItemsTypesChanged = false;

    diffInfo.itemsChanged.${itemType} = [];
    diffInfo.itemsChangedBool.${itemType} = {};

    diffInfo.itemsAdded.${itemType} = [];
    diffInfo.itemsAddedBool.${itemType} = {};

    diffInfo.itemsRemoved.${itemType} = [];
    diffInfo.itemsRemovedBool.${itemType} = {};

     diffInfo.propsChanged.${itemType} = {};
     diffInfo.propsChangedBool.${itemType} = {};

if (checkAllChanges || recordedChanges.itemTypesBool.${itemType}) {


  itemNames = Object.keys(currentState['${itemType}']);
  previousItemNames = Object.keys(prevState['${itemType}']);



// check for items removed from previous object
    for (let jp = 0; jp < previousItemNames.length; ++jp) {
    const prevItemName = previousItemNames[jp];
if (currentState['${itemType}'][prevItemName] === undefined) {
  diffInfo.itemsRemoved.all__.push(prevItemName);
  diffInfo.itemsRemovedBool.all__[prevItemName] = true;
  diffInfo.itemsRemoved.${itemType}.push(prevItemName);
  diffInfo.itemsRemovedBool.${itemType}[prevItemName] = true;
}
  }

    for (let j = 0; j < itemNames.length; ++j) {
      const itemName = itemNames[j];

      if (checkAllChanges || recordedChanges.itemNamesBool.${itemType}?.[ itemName ]) {


    // check for items added since previous object
    if (prevState['${itemType}'][itemName] === undefined) {

      diffInfo.itemsAdded.all__.push(itemName);
      diffInfo.itemsAddedBool.all__[itemName] = true;
      diffInfo.itemsAdded.${itemType}.push(itemName);
      diffInfo.itemsAddedBool.${itemType}[itemName] = true;
    }

let propChanged = false;
let itemAddedToItemsChanged = false;
let itemAddedToItemsRemoved = false;
let itemAddedToItemsAdded = false;

if ( diffInfo.itemsAddedBool.all__[itemName] ) {
  // if the item was just added (should it mark all the properties as changed?)

}

if ( !diffInfo.itemsRemovedBool.all__[itemName] && !diffInfo.itemsAddedBool.all__[itemName] ) {

    `;

    for (let k = 0; k < propNamesByItemType[itemType].length; ++k) {
      const itemPropName = propNamesByItemType[itemType][k];
      diffFunctionString += `
      if (checkAllChanges || recordedChanges.itemPropertiesBool.${itemType}?.[itemName]?.${itemPropName}) {

      propAddedToPropsChanged = false;
      propChanged = currentState.${itemType}[itemName].${itemPropName} !== prevState.${itemType}[itemName].${itemPropName};


  if (propChanged) {
    if (!itemTypeAddedToItemsTypesChanged) {
      diffInfo.itemTypesChanged.push('${itemType}')
      diffInfo.itemTypesChangedBool.${itemType} = true;
      itemTypeAddedToItemsTypesChanged = true;
      }

    ${addIfEmpty(`diffInfo.itemsChanged.${itemType}`, "[]")}
    ${addIfEmpty(`diffInfo.itemsChangedBool.${itemType}`, "{}")}
    ${addIfEmpty(`diffInfo.itemsChanged.all__`, "[]")}
    ${addIfEmpty(`diffInfo.itemsChangedBool.all__`, "{}")}

  if (!itemAddedToItemsChanged) {
    diffInfo.itemsChanged.${itemType}.push(itemName);
    diffInfo.itemsChangedBool.${itemType}[itemName] = true;

    diffInfo.itemsChanged.all__.push(itemName);
    diffInfo.itemsChangedBool.all__[itemName] = true;

    itemAddedToItemsChanged = true;
    }

${addIfEmpty(`diffInfo.propsChanged.${itemType}`, "{}")}
${addIfEmpty(`diffInfo.propsChangedBool.${itemType}`, "{}")}
${addIfEmpty(`diffInfo.propsChanged.all__`, "[]")}
${addIfEmpty(`diffInfo.propsChangedBool.all__`, "{}")}
${addIfEmpty(`diffInfo.propsChanged.${itemType}[itemName]`, "[]")}
${addIfEmpty(`diffInfo.propsChangedBool.${itemType}[itemName]`, "{}")}

${addIfEmpty(`diffInfo.propsChanged.${itemType}.all__`, "[]")}
${addIfEmpty(`diffInfo.propsChangedBool.${itemType}.all__`, "{}")}

if (!diffInfo.propsChangedBool.${itemType}[itemName].${itemPropName}) {
  diffInfo.propsChanged.${itemType}[itemName].push('${itemPropName}')
  diffInfo.propsChangedBool.${itemType}[itemName].${itemPropName} = true;
}

if (!diffInfo.propsChangedBool.all__.${itemPropName}) {
  diffInfo.propsChanged.all__.push('${itemPropName}')
  diffInfo.propsChangedBool.all__.${itemPropName} = true;
}

if (!diffInfo.propsChangedBool.${itemType}.all__.${itemPropName}) {
    diffInfo.propsChanged.${itemType}.all__.push('${itemPropName}')
    diffInfo.propsChangedBool.${itemType}.all__.${itemPropName} = true;
}

}
  }
`;
    }

    diffFunctionString += `
  }
} // check recordedChanges.itemTypesBool
}
}
`;
  }

  // eslint-disable-next-line no-new-func
  return new Function(
    "currentState",
    "prevState",
    "diffInfo",
    "recordedChanges",
    "checkAllChanges",
    diffFunctionString
  ) as any;
}

/*



*/

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

    for (
      let nameIndex = 0;
      nameIndex < meta.itemNamesByItemType[itemType].length;
      nameIndex++
    ) {
      const itemName = meta.itemNamesByItemType[itemType][nameIndex];

      diffInfo.itemsChangedBool[itemType][itemName] = false;

      diffInfo.itemsAddedBool[itemType][itemName] = false;
      diffInfo.itemsRemovedBool[itemType][itemName] = false;
      if (diffInfo.propsChanged[itemType][itemName]?.length) {
        diffInfo.propsChanged[itemType][itemName].length = 0;
      }

      for (
        let propIndex = 0;
        propIndex < meta.propNamesByItemType[itemType].length;
        propIndex++
      ) {
        const propName = meta.propNamesByItemType[itemType][propIndex];

        diffInfo.propsChangedBool[itemType][itemName][propName] = false;
        diffInfo.propsChangedBool[itemType].all__![propName] = false;
      }
    }
  }
}

export default function makeGetStatesDiffFunction() {
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
        const itemNames = meta.itemNamesByItemType[itemType];
        // TODO repalce this with real previous item names
        // previousItemNames = Object.keys(prevState[itemType]);
        const previousItemNames = meta.itemNamesByItemType[itemType];

        // check for items removed from previous object
        for (
          let prevNameIndex = 0;
          prevNameIndex < previousItemNames.length;
          ++prevNameIndex
        ) {
          const prevItemName = previousItemNames[prevNameIndex];
          if (currentState[itemType][prevItemName] === undefined) {
            diffInfo.itemsRemoved.all__.push(prevItemName);
            diffInfo.itemsRemovedBool.all__[prevItemName] = true;
            diffInfo.itemsRemoved[itemType].push(prevItemName);
            diffInfo.itemsRemovedBool[itemType][prevItemName] = true;
          }
        }

        for (let nameIndex = 0; nameIndex < itemNames.length; ++nameIndex) {
          const itemName = itemNames[nameIndex];
          if (
            checkAllChanges ||
            recordedChanges.itemNamesBool[itemType]?.[itemName] === true
          ) {
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

            if (
              !diffInfo.itemsRemovedBool.all__[itemName] &&
              !diffInfo.itemsAddedBool.all__[itemName]
            ) {
              for (
                let propIndex = 0;
                propIndex < propNamesByItemType[itemType].length;
                ++propIndex
              ) {
                const itemPropName = propNamesByItemType[itemType][propIndex];

                if (
                  checkAllChanges ||
                  recordedChanges.itemPropertiesBool[itemType]?.[itemName]?.[
                    itemPropName
                  ] === true
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
                    currentState[itemType][itemName][itemPropName] !==
                    prevState[itemType][itemName][itemPropName];

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

                    if (
                      !diffInfo.propsChangedBool[itemType][itemName][
                        itemPropName
                      ]
                    ) {
                      diffInfo.propsChanged[itemType][itemName].push(
                        itemPropName
                      );
                      diffInfo.propsChangedBool[itemType][itemName][
                        itemPropName
                      ] = true;
                    }

                    if (!diffInfo.propsChangedBool.all__[itemPropName]) {
                      diffInfo.propsChanged.all__.push(itemPropName);
                      diffInfo.propsChangedBool.all__[itemPropName] = true;
                    }

                    if (
                      !diffInfo.propsChangedBool[itemType].all__[itemPropName]
                    ) {
                      diffInfo.propsChanged[itemType].all__.push(itemPropName);
                      diffInfo.propsChangedBool[itemType].all__[itemPropName] =
                        true;
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
