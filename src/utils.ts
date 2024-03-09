export function cloneObjectWithJson(theObject: { [key: string]: any }) {
  return JSON.parse(JSON.stringify(theObject));
}

// converts values to arrays, or keeps as an array, and undefined will still return undefined
export function toMaybeArray<T_Item>(theValue: T_Item | T_Item[] | undefined) {
  if (theValue !== undefined) {
    return Array.isArray(theValue) ? (theValue as NonNullable<T_Item>[]) : ([theValue] as NonNullable<T_Item>[]);
  }
  return undefined;
}

// same as toSafeArray, but returns an empty array instead of undefined
export function toArray<T_Item>(theValue: T_Item | T_Item[] | undefined) {
  return toMaybeArray(theValue) ?? ([] as T_Item[]);
}
