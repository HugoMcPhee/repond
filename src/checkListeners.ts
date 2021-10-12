import { forEach, breakableForEach } from "shutils/dist/loops";
import meta from "./meta";
import { ChangeToCheck, ListenerType } from "./types";

export default function checkListeners(
  listenerType: ListenerType = "subscribe",
  flowName: string = "default"
): string[] {
  const listenerNamesToUpdate: string[] = [];

  let foundListenerNames =
    meta.listenerNamesByTypeByFlow[listenerType][flowName] ?? [];
  let allListeners = meta.allListeners;

  forEach(foundListenerNames, (listenerName: string) => {
    const loopedListener = allListeners[listenerName];
    const loopedCheckers = loopedListener.changesToCheck;

    breakableForEach(
      loopedCheckers,
      (loopedChecker: ChangeToCheck<any, any>) => {
        // NOTE The diff info here could be unique for this flow!
        // ( using the diff found from prevStatesByFlow[flowName] )
        // NOTE the flow diffInfo should probably also be passed to the listeners when they run

        if (checkIfCheckerChanged(loopedChecker, meta.diffInfo)) {
          listenerNamesToUpdate.push(loopedListener.name);
          return true;
        }
      }
    );
  });

  return listenerNamesToUpdate;
}

function checkIfCheckerChanged(
  theChecker: ChangeToCheck<any, any>,
  diffInfo: typeof meta.diffInfo
) {
  const editedChecker = {
    types: theChecker.types || ["all__"],
    names: theChecker.names || ["all__"],
    props: theChecker.props || ["all__"],
  };

  let listenerShouldUpdate = false;

  // only updates on items removed if this property is true
  if (theChecker.addedOrRemoved) {
    breakableForEach(editedChecker.types as any[], (loopedItemType) => {
      if (
        (editedChecker.names[0] === "all__" &&
          diffInfo.itemsAdded[loopedItemType].length > 0) ||
        diffInfo.itemsRemoved[loopedItemType].length > 0
      ) {
        listenerShouldUpdate = true;
        return true;
      }

      breakableForEach(editedChecker.names, (loopedItemName) => {
        if (
          (diffInfo.itemsAddedBool[loopedItemType] &&
            diffInfo.itemsAddedBool[loopedItemType][loopedItemName]) ||
          (diffInfo.itemsRemovedBool[loopedItemType] &&
            diffInfo.itemsRemovedBool[loopedItemType][loopedItemName])
        ) {
          listenerShouldUpdate = true;
          return true;
        }
      });
    });

    // exist the function before checking the other updates (if onlyAddedOrRemoved is true)
    return listenerShouldUpdate;
  }

  breakableForEach(editedChecker.types as any[], (loopedItemType) => {
    if (
      editedChecker.names[0] === "all__" &&
      diffInfo.itemsAdded?.[loopedItemType]?.length > 0
      // diffInfo.itemsRemoved[loopedItemType].length > 0)   // checking itemsRemoved used to cause issues, but doesn't seem to now?
    ) {
      listenerShouldUpdate = true;
      return true;
    }

    breakableForEach(editedChecker.names, (loopedItemName) => {
      if (
        diffInfo.itemsAddedBool[loopedItemType] &&
        diffInfo.itemsAddedBool[loopedItemType][loopedItemName]
      ) {
        // checking itemsRemoved used to cause issues, but doesn't seem to now?
        // (diffInfo.itemsRemovedBool[loopedItemType] &&
        // diffInfo.itemsRemovedBool[loopedItemType][loopedItemName])
        listenerShouldUpdate = true;
        return true;
      }
      breakableForEach(editedChecker.props as any[], (loopedPropertyName) => {
        if (
          diffInfo.propsChangedBool[loopedItemType] &&
          diffInfo.propsChangedBool[loopedItemType][loopedItemName] &&
          (diffInfo.propsChangedBool[loopedItemType][loopedItemName][
            loopedPropertyName
          ] ||
            loopedPropertyName === "all__")
        ) {
          listenerShouldUpdate = true;
          return true;
        }
      });
    });
  });

  return listenerShouldUpdate;
}
