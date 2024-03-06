import meta from "./meta";
const effectNamesToUpdate = [];
const noEffectNames = [];
export default function checkInnerEffects(phase = "endOfStep", stepName = "default") {
    effectNamesToUpdate.length = 0;
    let foundEffectNames = meta.innerEffectNamesByPhaseByStep[phase][stepName] ?? noEffectNames;
    let allListeners = meta.allInnerEffects;
    for (let nameIndex = 0; nameIndex < foundEffectNames.length; nameIndex++) {
        const listenerName = foundEffectNames[nameIndex];
        const effect = allListeners[listenerName];
        const effectCheck = effect.check;
        for (let checkerIndex = 0; checkerIndex < effectCheck.length; checkerIndex++) {
            const check = effectCheck[checkerIndex];
            // NOTE The diff info here could be unique for this step!
            // ( using the diff found from prevStatesByStep[stepName] )
            // NOTE the step diffInfo should probably also be passed to the listeners when they run
            if (didCheckChange(check, meta.diffInfo)) {
                effectNamesToUpdate.push(effect.name);
                break;
            }
        }
    }
    return effectNamesToUpdate;
}
const checkAllOption = ["all__"];
function didCheckChange(check, diffInfo) {
    const editedCheck = {
        types: check.types || checkAllOption,
        names: check.names || checkAllOption,
        props: check.props || checkAllOption,
    };
    let innerEffectShouldUpdate = false;
    // only updates on items removed if this property is true
    if (check.addedOrRemoved) {
        for (let typesIndex = 0; typesIndex < editedCheck.types.length; typesIndex++) {
            const itemType = editedCheck.types[typesIndex];
            if ((editedCheck.names[0] === "all__" && diffInfo.itemsAdded[itemType].length > 0) ||
                diffInfo.itemsRemoved[itemType].length > 0) {
                innerEffectShouldUpdate = true;
                break;
            }
            for (let namesIndex = 0; namesIndex < editedCheck.names.length; namesIndex++) {
                const loopedItemName = editedCheck.names[namesIndex];
                if ((diffInfo.itemsAddedBool[itemType] && diffInfo.itemsAddedBool[itemType][loopedItemName]) ||
                    (diffInfo.itemsRemovedBool[itemType] && diffInfo.itemsRemovedBool[itemType][loopedItemName])) {
                    innerEffectShouldUpdate = true;
                    break;
                }
            }
        }
        // exist the function before checking the other updates (if onlyAddedOrRemoved is true)
        return innerEffectShouldUpdate;
    }
    for (let typesIndex = 0; typesIndex < editedCheck.types.length; typesIndex++) {
        const loopedItemType = editedCheck.types[typesIndex];
        if (editedCheck.names[0] === "all__" &&
            diffInfo.itemsAdded?.[loopedItemType]?.length > 0
        // diffInfo.itemsRemoved[loopedItemType].length > 0)   // checking itemsRemoved used to cause issues, but doesn't seem to now?
        ) {
            innerEffectShouldUpdate = true;
            break;
        }
        for (let namesIndex = 0; namesIndex < editedCheck.names.length; namesIndex++) {
            const loopedItemName = editedCheck.names[namesIndex];
            if (diffInfo.itemsAddedBool[loopedItemType] && diffInfo.itemsAddedBool[loopedItemType][loopedItemName]) {
                // checking itemsRemoved used to cause issues, but doesn't seem to now?
                // (diffInfo.itemsRemovedBool[loopedItemType] &&
                // diffInfo.itemsRemovedBool[loopedItemType][loopedItemName])
                innerEffectShouldUpdate = true;
                break;
            }
            for (let propIndex = 0; propIndex < editedCheck.props.length; propIndex++) {
                const loopedPropertyName = editedCheck.props[propIndex];
                if (diffInfo.propsChangedBool[loopedItemType] &&
                    diffInfo.propsChangedBool[loopedItemType][loopedItemName] &&
                    (diffInfo.propsChangedBool[loopedItemType][loopedItemName][loopedPropertyName] === true ||
                        loopedPropertyName === "all__")) {
                    innerEffectShouldUpdate = true;
                    break;
                }
            }
        }
    }
    return innerEffectShouldUpdate;
}
