import meta from "./meta";
const listenerNamesToUpdate = [];
const noListenerNames = [];
export default function checkListeners(phase = "subscribe", stepName = "default") {
    listenerNamesToUpdate.length = 0;
    let foundListenerNames = meta.listenerNamesByPhaseByStep[phase][stepName] ?? noListenerNames;
    let allListeners = meta.allListeners;
    for (let nameIndex = 0; nameIndex < foundListenerNames.length; nameIndex++) {
        const listenerName = foundListenerNames[nameIndex];
        const loopedListener = allListeners[listenerName];
        const loopedCheckers = loopedListener.changesToCheck;
        for (let checkerIndex = 0; checkerIndex < loopedCheckers.length; checkerIndex++) {
            const loopedChecker = loopedCheckers[checkerIndex];
            // NOTE The diff info here could be unique for this step!
            // ( using the diff found from prevStatesByStep[stepName] )
            // NOTE the step diffInfo should probably also be passed to the listeners when they run
            if (checkIfCheckerChanged(loopedChecker, meta.diffInfo)) {
                listenerNamesToUpdate.push(loopedListener.name);
                break;
            }
        }
    }
    return listenerNamesToUpdate;
}
const checkerAllOption = ["all__"];
function checkIfCheckerChanged(theChecker, diffInfo) {
    const editedChecker = {
        types: theChecker.types || checkerAllOption,
        names: theChecker.names || checkerAllOption,
        props: theChecker.props || checkerAllOption,
    };
    let listenerShouldUpdate = false;
    // only updates on items removed if this property is true
    if (theChecker.addedOrRemoved) {
        for (let typesIndex = 0; typesIndex < editedChecker.types.length; typesIndex++) {
            const loopedItemType = editedChecker.types[typesIndex];
            if ((editedChecker.names[0] === "all__" &&
                diffInfo.itemsAdded[loopedItemType].length > 0) ||
                diffInfo.itemsRemoved[loopedItemType].length > 0) {
                listenerShouldUpdate = true;
                break;
            }
            for (let namesIndex = 0; namesIndex < editedChecker.names.length; namesIndex++) {
                const loopedItemName = editedChecker.names[namesIndex];
                if ((diffInfo.itemsAddedBool[loopedItemType] &&
                    diffInfo.itemsAddedBool[loopedItemType][loopedItemName]) ||
                    (diffInfo.itemsRemovedBool[loopedItemType] &&
                        diffInfo.itemsRemovedBool[loopedItemType][loopedItemName])) {
                    listenerShouldUpdate = true;
                    break;
                }
            }
        }
        // exist the function before checking the other updates (if onlyAddedOrRemoved is true)
        return listenerShouldUpdate;
    }
    for (let typesIndex = 0; typesIndex < editedChecker.types.length; typesIndex++) {
        const loopedItemType = editedChecker.types[typesIndex];
        if (editedChecker.names[0] === "all__" &&
            diffInfo.itemsAdded?.[loopedItemType]?.length > 0
        // diffInfo.itemsRemoved[loopedItemType].length > 0)   // checking itemsRemoved used to cause issues, but doesn't seem to now?
        ) {
            listenerShouldUpdate = true;
            break;
        }
        for (let namesIndex = 0; namesIndex < editedChecker.names.length; namesIndex++) {
            const loopedItemName = editedChecker.names[namesIndex];
            if (diffInfo.itemsAddedBool[loopedItemType] &&
                diffInfo.itemsAddedBool[loopedItemType][loopedItemName]) {
                // checking itemsRemoved used to cause issues, but doesn't seem to now?
                // (diffInfo.itemsRemovedBool[loopedItemType] &&
                // diffInfo.itemsRemovedBool[loopedItemType][loopedItemName])
                listenerShouldUpdate = true;
                break;
            }
            for (let propIndex = 0; propIndex < editedChecker.props.length; propIndex++) {
                const loopedPropertyName = editedChecker.props[propIndex];
                if (diffInfo.propsChangedBool[loopedItemType] &&
                    diffInfo.propsChangedBool[loopedItemType][loopedItemName] &&
                    (diffInfo.propsChangedBool[loopedItemType][loopedItemName][loopedPropertyName] === true ||
                        loopedPropertyName === "all__")) {
                    listenerShouldUpdate = true;
                    break;
                }
            }
        }
    }
    return listenerShouldUpdate;
}
