export function cloneObjectWithJson(theObject) {
    return JSON.parse(JSON.stringify(theObject));
}
// converts values to arrays, or keeps as an array, and undefined will still return undefined
export function toMaybeArray(theValue) {
    if (theValue !== undefined) {
        return Array.isArray(theValue) ? theValue : [theValue];
    }
    return undefined;
}
// same as toSafeArray, but returns an empty array instead of undefined
export function toArray(theValue) {
    return toMaybeArray(theValue) ?? [];
}
