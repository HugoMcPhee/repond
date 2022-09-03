import meta, { RecordedChanges } from "./meta";

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
  diffInfo.propsChanged.all__.length = 0;
  diffInfo.propsChangedBool.all__ = {};
  diffInfo.itemsChanged.all__.length = 0;
  diffInfo.itemsChangedBool.all__ = {};
  diffInfo.itemsAdded.all__.length = 0;
  diffInfo.itemsAddedBool.all__ = {};
  diffInfo.itemsRemoved.all__.length = 0;
  diffInfo.itemsRemovedBool.all__ = {};
  let itemTypeAddedToItemsTypesChanged = false;
  let propAddedToPropsChanged = false;
  diffInfo.itemTypesChanged.length = 0;
  diffInfo.itemTypesChangedBool = {};

   `;
  for (let i = 0; i < itemTypeNames.length; ++i) {
    const itemType = itemTypeNames[i];

    // it needs to get the item names
    diffFunctionString += `


    itemTypeAddedToItemsTypesChanged = false;

    diffInfo.itemsChanged.${itemType}.length = 0;
    diffInfo.itemsChangedBool.${itemType} = {};

    diffInfo.itemsAdded.${itemType}.length = 0;
    diffInfo.itemsAddedBool.${itemType} = {};

    diffInfo.itemsRemoved.${itemType}.length = 0;
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

export default function makeGetStatesDiffFunction() {
  const { itemTypeNames, propNamesByItemType } = meta;

  return function getStatesDiff(
    currentState: any,
    prevState: any,
    diffInfo: any,
    recordedChanges: RecordedChanges,
    checkAllChanges: boolean
  ) {
    let itemNames = [];
    let previousItemNames = [];
    if (!diffInfo.propsChanged.all__.length) {
      diffInfo.propsChanged.all__.length = [];
    } else diffInfo.propsChanged.all__.length = 0;
    diffInfo.propsChangedBool.all__ = {};

    if (!diffInfo.itemsChanged.all__.length) {
      diffInfo.itemsChanged.all__.length = [];
    } else diffInfo.itemsChanged.all__.length = 0;
    diffInfo.itemsChangedBool.all__ = {};

    if (!diffInfo.itemsAdded.all__.length) {
      diffInfo.itemsAdded.all__.length = [];
    } else diffInfo.itemsAdded.all__.length = 0;
    diffInfo.itemsAddedBool.all__ = {};

    if (!diffInfo.itemsRemoved.all__.length) {
      diffInfo.itemsRemoved.all__.length = [];
    } else diffInfo.itemsRemoved.all__.length = 0;
    diffInfo.itemsRemovedBool.all__ = {};

    let itemTypeAddedToItemsTypesChanged = false;
    // let propAddedToPropsChanged = false;

    if (!diffInfo.itemTypesChanged.all__.length) {
      diffInfo.itemTypesChanged.all__.length = [];
    } else diffInfo.itemTypesChanged.all__.length = 0;
    diffInfo.itemTypesChangedBool.all__ = {};

    for (let i = 0; i < itemTypeNames.length; ++i) {
      const itemType = itemTypeNames[i];

      itemTypeAddedToItemsTypesChanged = false;

      if (!diffInfo.itemsChanged[itemType]) {
        diffInfo.itemsChanged[itemType] = [];
      } else diffInfo.itemsChanged[itemType].length = 0;
      diffInfo.itemsChangedBool[itemType] = {};

      if (!diffInfo.itemsAdded[itemType]) {
        diffInfo.itemsAdded[itemType] = [];
      } else diffInfo.itemsAdded[itemType].length = 0;
      diffInfo.itemsAddedBool[itemType] = {};

      if (!diffInfo.itemsRemoved[itemType]) {
        diffInfo.itemsRemoved[itemType] = [];
      } else diffInfo.itemsRemoved[itemType].length = 0;
      diffInfo.itemsRemovedBool[itemType] = {};

      if (!diffInfo.propsChanged[itemType]) {
        diffInfo.propsChanged[itemType] = {};
      }
      diffInfo.propsChangedBool[itemType] = {};

      if (!diffInfo.propsChanged[itemType].all__) {
        diffInfo.propsChanged[itemType].all__ = [];
      } else diffInfo.propsChanged[itemType].all__.length = 0;

      if (!diffInfo.propsChangedBool[itemType].all__) {
        diffInfo.propsChangedBool[itemType].all__ = {};
      }

      if (checkAllChanges || recordedChanges.itemTypesBool[itemType]) {
        itemNames = Object.keys(currentState[itemType]);
        previousItemNames = Object.keys(prevState[itemType]);

        // check for items removed from previous object
        for (let jp = 0; jp < previousItemNames.length; ++jp) {
          const prevItemName = previousItemNames[jp];
          if (currentState[itemType][prevItemName] === undefined) {
            diffInfo.itemsRemoved.all__.push(prevItemName);
            diffInfo.itemsRemovedBool.all__[prevItemName] = true;
            diffInfo.itemsRemoved[itemType].push(prevItemName);
            diffInfo.itemsRemovedBool[itemType][prevItemName] = true;
          }
        }

        for (let j = 0; j < itemNames.length; ++j) {
          const itemName = itemNames[j];
          if (
            checkAllChanges ||
            recordedChanges.itemNamesBool[itemType]?.[itemName]
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
              for (let k = 0; k < propNamesByItemType[itemType].length; ++k) {
                const itemPropName = propNamesByItemType[itemType][k];

                if (
                  checkAllChanges ||
                  recordedChanges.itemPropertiesBool[itemType]?.[itemName]?.[
                    itemPropName
                  ]
                ) {
                  // propAddedToPropsChanged = false;

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
                    // if (itemPropName !== "frameTick") {
                    //   console.log(itemType, itemName, itemPropName);
                    // }

                    if (!itemTypeAddedToItemsTypesChanged) {
                      diffInfo.itemTypesChanged.push(itemType);
                      diffInfo.itemTypesChangedBool[itemType] = true;
                      itemTypeAddedToItemsTypesChanged = true;
                    }

                    // if (!diffInfo.itemsChanged[itemType]) {
                    //   diffInfo.itemsChanged[itemType] = [];
                    // }

                    // if (!diffInfo.itemsChangedBool[itemType]) {
                    //   diffInfo.itemsChangedBool[itemType] = {};
                    // }
                    // if (!diffInfo.itemsChanged.all__) {
                    //   diffInfo.itemsChanged.all__ = [];
                    // }
                    // if (!diffInfo.itemsChangedBool.all__) {
                    //   diffInfo.itemsChangedBool.all__ = {};
                    // }

                    if (!itemAddedToItemsChanged) {
                      diffInfo.itemsChanged[itemType].push(itemName);
                      diffInfo.itemsChangedBool[itemType][itemName] = true;

                      diffInfo.itemsChanged.all__.push(itemName);
                      diffInfo.itemsChangedBool.all__[itemName] = true;

                      itemAddedToItemsChanged = true;
                    }

                    // if (!diffInfo.propsChanged[itemType]) {
                    //   diffInfo.propsChanged[itemType] = {};
                    // }
                    // `, "{}")}

                    // if (!diffInfo.propsChangedBool[itemType]) {
                    //   diffInfo.propsChangedBool[itemType] = {};
                    // }

                    // if (!diffInfo.propsChanged.all__) {
                    //   diffInfo.propsChanged.all__ = [];
                    // } else {
                    //   diffInfo.propsChanged.all__.length = 0;
                    // }

                    // if (!diffInfo.propsChangedBool.all__) {
                    //   diffInfo.propsChangedBool.all__ = {};
                    // }

                    if (!diffInfo.propsChanged[itemType][itemName]) {
                      diffInfo.propsChanged[itemType][itemName] = [];
                    } else diffInfo.propsChanged[itemType][itemName].length = 0;

                    if (!diffInfo.propsChangedBool[itemType][itemName]) {
                      diffInfo.propsChangedBool[itemType][itemName] = {};
                    }

                    // if (!diffInfo.propsChanged[itemType].all__) {
                    //   diffInfo.propsChanged[itemType].all__ = [];
                    // } else diffInfo.propsChanged[itemType].all__.length = 0;

                    // if (!diffInfo.propsChangedBool[itemType].all__) {
                    //   diffInfo.propsChangedBool[itemType].all__ = {};
                    // }

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
