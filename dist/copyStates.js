import meta from "./meta";
import { forEach } from "chootils/dist/loops";
function addIfEmpty(propertyString, initialValue) {
    return `if (!${propertyString}) {
  ${propertyString} = ${initialValue};
}
`;
}
export function makeCopyStatesFunction_both_prev(copyType = "copy") {
    const { itemTypeNames, propNamesByItemType } = meta;
    let copierFunctionString = `
  let itemNames = [];
   `;
    forEach(itemTypeNames, (itemType) => {
        if (copyType === "copy") {
            copierFunctionString += `  saveToObject.${itemType} = {}; `;
        }
        // it needs to get the item names each time
        copierFunctionString += `

    if (currentObject.${itemType}) {

    itemNames = Object.keys(currentObject['${itemType}']);
      for (let j = 0; j < itemNames.length; ++j) {
        const itemName = itemNames[j];

    `;
        if (copyType === "copy") {
            copierFunctionString += `
      ${addIfEmpty(`saveToObject.${itemType}[itemName]`, "{}")}
    `;
        }
        forEach(propNamesByItemType[itemType], (itemProp) => {
            if (copyType === "copy") {
                copierFunctionString += `
          saveToObject.${itemType}[itemName].${itemProp} = currentObject.${itemType}[itemName].${itemProp};
          `;
            }
            else if (copyType === "merge") {
                // check if the item exists before copying
                copierFunctionString += `
          if (saveToObject.${itemType}[itemName] !== undefined && currentObject.${itemType} && currentObject.${itemType}[itemName] !== undefined && currentObject.${itemType}[itemName].${itemProp} !== undefined ) {
          saveToObject.${itemType}[itemName].${itemProp} = currentObject.${itemType}[itemName].${itemProp};

          recordedChanges.itemTypesBool.${itemType} = true;
          if (!recordedChanges.itemNamesBool.${itemType}) {
            recordedChanges.itemNamesBool.${itemType} = {}
          }
          recordedChanges.itemNamesBool.${itemType}[itemName] = true;

          if (!recordedChanges.itemPropertiesBool.${itemType}) {
            recordedChanges.itemPropertiesBool.${itemType} = {}
          }
          if (!recordedChanges.itemPropertiesBool.${itemType}[itemName]) {
            recordedChanges.itemPropertiesBool.${itemType}[itemName] = {}
          }
          recordedChanges.itemPropertiesBool.${itemType}[itemName].${itemProp} = true;
          recordedChanges.somethingChanged = true;



          allRecordedChanges.itemTypesBool.${itemType} = true;
          if (!allRecordedChanges.itemNamesBool.${itemType}) {
            allRecordedChanges.itemNamesBool.${itemType} = {}
          }
          allRecordedChanges.itemNamesBool.${itemType}[itemName] = true;

          if (!allRecordedChanges.itemPropertiesBool.${itemType}) {
            allRecordedChanges.itemPropertiesBool.${itemType} = {}
          }
          if (!allRecordedChanges.itemPropertiesBool.${itemType}[itemName]) {
            allRecordedChanges.itemPropertiesBool.${itemType}[itemName] = {}
          }
          allRecordedChanges.itemPropertiesBool.${itemType}[itemName].${itemProp} = true;
          allRecordedChanges.somethingChanged = true;

          // allRecordedChanges.itemTypesBool.${itemType} = true;
          // allRecordedChanges.itemNamesBool[itemName] = true;
          // allRecordedChanges.itemPropertiesBool.${itemProp} = true;
          // allRecordedChanges.somethingChanged = true;
        }
          `;
            }
        });
        copierFunctionString += `
  }
}
`;
    });
    copierFunctionString += "";
    // return eval(copierFunctionString);
    // eslint-disable-next-line no-new-func
    return new Function("currentObject", "saveToObject", "recordedChanges", // for the currently running listener phase
    "allRecordedChanges", // collected for a whole (frame or step?) used when doing "subscribe" (for a step?)
    copierFunctionString);
}
export function makeCopyStatesFunction_string_version() {
    const { itemTypeNames, propNamesByItemType } = meta;
    let copierFunctionString = `
  let itemNames = [];
   `;
    forEach(itemTypeNames, (itemType) => {
        // it needs to get the item names each time
        copierFunctionString += `
    saveToObject.${itemType} = {};

    if (currentObject.${itemType}) {

    itemNames = Object.keys(currentObject['${itemType}']);
      for (let j = 0; j < itemNames.length; ++j) {
        const itemName = itemNames[j];

      ${addIfEmpty(`saveToObject.${itemType}[itemName]`, "{}")}

    `;
        forEach(propNamesByItemType[itemType], (itemProp) => {
            copierFunctionString += `
          saveToObject.${itemType}[itemName].${itemProp} = currentObject.${itemType}[itemName].${itemProp};
          `;
        });
        copierFunctionString += `
  }
}
`;
    });
    // return eval(copierFunctionString);
    // eslint-disable-next-line no-new-func
    return new Function("currentObject", "saveToObject", "recordedChanges", // for the currently running listener phase
    "allRecordedChanges", // collected for a whole (frame or step?) used when doing "subscribe" (for a step?)
    copierFunctionString);
}
export default function makeCopyStatesFunction_both_nonstring(copyType = "copy") {
    if (copyType === "copy") {
        // return makeCopyStatesFunction();
        return function copyStates(currentObject, saveToObject) {
            const { itemTypeNames, propNamesByItemType, itemNamesByItemType } = meta;
            // let itemNames = [];
            for (let typeIndex = 0; typeIndex < itemTypeNames.length; typeIndex++) {
                const itemType = itemTypeNames[typeIndex];
                if (copyType === "copy") {
                    saveToObject[itemType] = {};
                }
                if (currentObject[itemType]) {
                    const itemNames = itemNamesByItemType[itemType];
                    for (let nameIndex = 0; nameIndex < itemNames.length; ++nameIndex) {
                        const itemName = itemNames[nameIndex];
                        if (!saveToObject[itemType][itemName]) {
                            saveToObject[itemType][itemName] = {};
                        }
                        for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; propIndex++) {
                            const itemProp = propNamesByItemType[itemType][propIndex];
                            saveToObject[itemType][itemName][itemProp] =
                                currentObject[itemType][itemName][itemProp];
                        }
                    }
                }
            }
        };
    }
    else if (copyType === "merge") {
        return function mergeStates(currentObject, saveToObject, recordedChanges, allRecordedChanges) {
            const { itemTypeNames, propNamesByItemType, itemNamesByItemType } = meta;
            for (let typeIndex = 0; typeIndex < itemTypeNames.length; typeIndex++) {
                const itemType = itemTypeNames[typeIndex];
                if (currentObject[itemType]) {
                    const itemNames = itemNamesByItemType[itemType];
                    for (let nameIndex = 0; nameIndex < itemNames.length; ++nameIndex) {
                        const itemName = itemNames[nameIndex];
                        for (let propIndex = 0; propIndex < propNamesByItemType[itemType].length; propIndex++) {
                            const itemProp = propNamesByItemType[itemType][propIndex];
                            // check if the item exists before copying
                            if (saveToObject[itemType][itemName] !== undefined &&
                                currentObject[itemType] &&
                                currentObject[itemType][itemName] !== undefined &&
                                currentObject[itemType][itemName][itemProp] !== undefined) {
                                saveToObject[itemType][itemName][itemProp] =
                                    currentObject[itemType][itemName][itemProp];
                                recordedChanges.itemTypesBool[itemType] = true;
                                recordedChanges.itemNamesBool[itemType][itemName] = true;
                                recordedChanges.itemPropertiesBool[itemType][itemName][itemProp] = true;
                                allRecordedChanges.itemTypesBool[itemType] = true;
                                allRecordedChanges.itemNamesBool[itemType][itemName] = true;
                                allRecordedChanges.itemPropertiesBool[itemType][itemName][itemProp] = true;
                                recordedChanges.somethingChanged = true;
                                allRecordedChanges.somethingChanged = true;
                            }
                        }
                    }
                }
            }
        };
    }
}
