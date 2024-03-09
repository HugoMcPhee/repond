export declare function cloneObjectWithJson(theObject: {
    [key: string]: any;
}): any;
export declare function toMaybeArray<T_Item>(theValue: T_Item | T_Item[] | undefined): NonNullable<T_Item>[] | undefined;
export declare function toArray<T_Item>(theValue: T_Item | T_Item[] | undefined): T_Item[];
