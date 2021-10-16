import { forEach, breakableForEach } from "shutils/dist/loops";
import meta from "./meta";
export default function checkListeners(listenerType = "subscribe", flowName = "default") {
    var _a;
    const listenerNamesToUpdate = [];
    let foundListenerNames = (_a = meta.listenerNamesByTypeByFlow[listenerType][flowName]) !== null && _a !== void 0 ? _a : [];
    let allListeners = meta.allListeners;
    forEach(foundListenerNames, (listenerName) => {
        const loopedListener = allListeners[listenerName];
        const loopedCheckers = loopedListener.changesToCheck;
        breakableForEach(loopedCheckers, (loopedChecker) => {
            // NOTE The diff info here could be unique for this flow!
            // ( using the diff found from prevStatesByFlow[flowName] )
            // NOTE the flow diffInfo should probably also be passed to the listeners when they run
            if (checkIfCheckerChanged(loopedChecker, meta.diffInfo)) {
                listenerNamesToUpdate.push(loopedListener.name);
                return true;
            }
        });
    });
    return listenerNamesToUpdate;
}
function checkIfCheckerChanged(theChecker, diffInfo) {
    const editedChecker = {
        types: theChecker.types || ["all__"],
        names: theChecker.names || ["all__"],
        props: theChecker.props || ["all__"],
    };
    let listenerShouldUpdate = false;
    // only updates on items removed if this property is true
    if (theChecker.addedOrRemoved) {
        breakableForEach(editedChecker.types, (loopedItemType) => {
            if ((editedChecker.names[0] === "all__" &&
                diffInfo.itemsAdded[loopedItemType].length > 0) ||
                diffInfo.itemsRemoved[loopedItemType].length > 0) {
                listenerShouldUpdate = true;
                return true;
            }
            breakableForEach(editedChecker.names, (loopedItemName) => {
                if ((diffInfo.itemsAddedBool[loopedItemType] &&
                    diffInfo.itemsAddedBool[loopedItemType][loopedItemName]) ||
                    (diffInfo.itemsRemovedBool[loopedItemType] &&
                        diffInfo.itemsRemovedBool[loopedItemType][loopedItemName])) {
                    listenerShouldUpdate = true;
                    return true;
                }
            });
        });
        // exist the function before checking the other updates (if onlyAddedOrRemoved is true)
        return listenerShouldUpdate;
    }
    breakableForEach(editedChecker.types, (loopedItemType) => {
        var _a, _b;
        if (editedChecker.names[0] === "all__" &&
            ((_b = (_a = diffInfo.itemsAdded) === null || _a === void 0 ? void 0 : _a[loopedItemType]) === null || _b === void 0 ? void 0 : _b.length) > 0
        // diffInfo.itemsRemoved[loopedItemType].length > 0)   // checking itemsRemoved used to cause issues, but doesn't seem to now?
        ) {
            listenerShouldUpdate = true;
            return true;
        }
        breakableForEach(editedChecker.names, (loopedItemName) => {
            if (diffInfo.itemsAddedBool[loopedItemType] &&
                diffInfo.itemsAddedBool[loopedItemType][loopedItemName]) {
                // checking itemsRemoved used to cause issues, but doesn't seem to now?
                // (diffInfo.itemsRemovedBool[loopedItemType] &&
                // diffInfo.itemsRemovedBool[loopedItemType][loopedItemName])
                listenerShouldUpdate = true;
                return true;
            }
            breakableForEach(editedChecker.props, (loopedPropertyName) => {
                if (diffInfo.propsChangedBool[loopedItemType] &&
                    diffInfo.propsChangedBool[loopedItemType][loopedItemName] &&
                    (diffInfo.propsChangedBool[loopedItemType][loopedItemName][loopedPropertyName] ||
                        loopedPropertyName === "all__")) {
                    listenerShouldUpdate = true;
                    return true;
                }
            });
        });
    });
    return listenerShouldUpdate;
}
