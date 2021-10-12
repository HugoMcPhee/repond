import meta from "./meta";

// for initialising array or object
// adds a if () !exists then equals [] etc
function addIfEmpty(propertyString: string, initialValue: string) {
  return `if (!${propertyString}) {
  ${propertyString} = ${initialValue};
}
`;
}

export default function makeGetStatesDiffFunction() {
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

      if (checkAllChanges || recordedChanges.itemNamesBool[ itemNames[j] ]) {

    const itemName = itemNames[j];

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
      if (checkAllChanges || recordedChanges.itemPropertiesBool.${itemPropName}) {

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
