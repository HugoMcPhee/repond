// import meta from "./meta";
import { _createStoreHelpers as createStoreHelpers } from "./create";
// for generating items with names
export function makeInitialState({ itemPrefix, itemAmount, defaultState, }) {
    const newInitialState = {};
    // NOTE nowehere's keeping track of the item name number
    for (var index = 0; index < itemAmount; index++) {
        const itemId = `${itemPrefix}${index}`;
        newInitialState[itemId] = defaultState();
    }
    return newInitialState;
}
export function exampleStepName(name) {
    return "default";
}
export { createStoreHelpers };
