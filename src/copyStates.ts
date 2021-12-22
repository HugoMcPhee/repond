import meta, { RecordedChanges } from "./meta";
import { forEach } from "chootils/dist/loops";

function addIfEmpty(propertyString: string, initialValue: string) {
  return `if (!${propertyString}) {
  ${propertyString} = ${initialValue};
}
`;
}

export function makeCopyStatesFunction_both_prev(
  copyType: "copy" | "merge" = "copy"
) {
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
      } else if (copyType === "merge") {
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
  return new Function(
    "currentObject",
    "saveToObject",
    "recordedChanges", // for the currently running listener type, think or draw
    "allRecordedChanges", // collected for a whole (frame or step?) used when doing "subscribe" (for a step?)

    copierFunctionString
  ) as any;
}

export function makeCopyStatesFunction() {
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
  return new Function(
    "currentObject",
    "saveToObject",
    "recordedChanges", // for the currently running listener type, think or draw
    "allRecordedChanges", // collected for a whole (frame or step?) used when doing "subscribe" (for a step?)

    copierFunctionString
  ) as any;
}

export default function makeCopyStatesFunction_both_nonstring(
  copyType: "copy" | "merge" = "copy"
) {
  if (copyType === "copy") {
    return makeCopyStatesFunction();
    // return function copyStates(currentObject: any, saveToObject: any) {
    //   const { itemTypeNames, propNamesByItemType } = meta;
    //
    //   let itemNames = [];
    //
    //   forEach(itemTypeNames, (itemType) => {
    //     if (copyType === "copy") {
    //       saveToObject[itemType] = {};
    //     }
    //     // it needs to get the item names each time
    //
    //     if (currentObject[itemType]) {
    //       itemNames = Object.keys(currentObject[itemType]);
    //       for (let j = 0; j < itemNames.length; ++j) {
    //         const itemName = itemNames[j];
    //
    //         if (!saveToObject[itemType][itemName]) {
    //           saveToObject[itemType][itemName] = {};
    //         }
    //
    //         forEach(propNamesByItemType[itemType], (itemProp) => {
    //           saveToObject[itemType][itemName][itemProp] =
    //             currentObject[itemType][itemName][itemProp];
    //         });
    //       }
    //     }
    //   });
    // };
  } else if (copyType === "merge") {
    return function mergeStates(
      currentObject: any,
      saveToObject: any,
      recordedChanges: RecordedChanges,
      allRecordedChanges: RecordedChanges
    ) {
      const { itemTypeNames, propNamesByItemType } = meta;

      let itemNames = [];

      forEach(itemTypeNames, (itemType) => {
        // it needs to get the item names each time

        if (currentObject[itemType]) {
          itemNames = Object.keys(currentObject[itemType]);
          for (let j = 0; j < itemNames.length; ++j) {
            const itemName = itemNames[j];

            forEach(propNamesByItemType[itemType], (itemProp) => {
              // check if the item exists before copying
              if (
                saveToObject[itemType][itemName] !== undefined &&
                currentObject[itemType] &&
                currentObject[itemType][itemName] !== undefined &&
                currentObject[itemType][itemName][itemProp] !== undefined
              ) {
                saveToObject[itemType][itemName][itemProp] =
                  currentObject[itemType][itemName][itemProp];

                recordedChanges.itemTypesBool[itemType] = true;
                if (!recordedChanges.itemNamesBool[itemType]) {
                  recordedChanges.itemNamesBool[itemType] = {};
                }
                recordedChanges.itemNamesBool[itemType][itemName] = true;

                if (!recordedChanges.itemPropertiesBool[itemType]) {
                  recordedChanges.itemPropertiesBool[itemType] = {};
                }
                if (!recordedChanges.itemPropertiesBool[itemType][itemName]) {
                  recordedChanges.itemPropertiesBool[itemType][itemName] = {};
                }
                recordedChanges.itemPropertiesBool[itemType][itemName][
                  itemProp
                ] = true;
                recordedChanges.somethingChanged = true;

                allRecordedChanges.itemTypesBool[itemType] = true;
                if (!allRecordedChanges.itemNamesBool[itemType]) {
                  allRecordedChanges.itemNamesBool[itemType] = {};
                }
                allRecordedChanges.itemNamesBool[itemType][itemName] = true;

                if (!allRecordedChanges.itemPropertiesBool[itemType]) {
                  allRecordedChanges.itemPropertiesBool[itemType] = {};
                }
                if (
                  !allRecordedChanges.itemPropertiesBool[itemType][itemName]
                ) {
                  allRecordedChanges.itemPropertiesBool[itemType][
                    itemName
                  ] = {};
                }
                allRecordedChanges.itemPropertiesBool[itemType][itemName][
                  itemProp
                ] = true;
                allRecordedChanges.somethingChanged = true;

                // allRecordedChanges.itemTypesBool[itemType] = true;
                // allRecordedChanges.itemNamesBool[itemName] = true;
                // allRecordedChanges.itemPropertiesBool[itemProp] = true;
                // allRecordedChanges.somethingChanged = true;
              }
            });
          }
        }
      });
    };
  }
}
