import meta from "./meta";
import { forEach } from "shutils/dist/loops";

function addIfEmpty(propertyString: string, initialValue: string) {
  return `if (!${propertyString}) {
  ${propertyString} = ${initialValue};
}
`;
}

export default function makeCopyStatesFunction(
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
          recordedChanges.itemNamesBool[itemName] = true;
          recordedChanges.itemPropertiesBool.${itemProp} = true;
          recordedChanges.somethingChanged = true;
          
          allRecordedChanges.itemTypesBool.${itemType} = true;
          allRecordedChanges.itemNamesBool[itemName] = true;
          allRecordedChanges.itemPropertiesBool.${itemProp} = true;
          allRecordedChanges.somethingChanged = true;
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
    "allRecordedChanges", // collected for a whole (frame or flow?) used when doing "subscribe" (for a flow?)

    copierFunctionString
  ) as any;
}
