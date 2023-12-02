// import meta from "./meta";
import { initRepond as initRepond } from "./create";
import { RepondTypes } from "./declarations";
export * from "./declarations";
export * from "./create";

export type InitialItemsState<
  T_defaultStateFunctionType extends (...args: any) => any
> = {
  [itemName: string]: ReturnType<T_defaultStateFunctionType>; // : AtLeastOne<T>;
};

// TODO remove these
export type StoreHelperTypes<
  T_GetState extends () => { [key: string]: { [key: string]: any } },
  T_GetRefs extends () => { [key: string]: { [key: string]: any } },
  T_ItemType extends keyof ReturnType<T_GetState> & keyof ReturnType<T_GetRefs>
> = {
  ItemType: keyof ReturnType<T_GetState>;
  AllItemsState: ReturnType<T_GetState>[T_ItemType];
  ItemState: ReturnType<T_GetState>[T_ItemType][keyof ReturnType<T_GetState>[T_ItemType]];
  ItemRefs: ReturnType<T_GetRefs>[T_ItemType][keyof ReturnType<T_GetRefs>[T_ItemType]];
};

// for generating items with names
export function makeInitialState({
  itemPrefix,
  itemAmount,
  defaultState,
}: {
  itemPrefix: string;
  itemAmount: number;
  defaultState: () => any;
}) {
  const newInitialState: any = {};
  // NOTE nowehere's keeping track of the item name number
  for (var index = 0; index < itemAmount; index++) {
    const itemId = `${itemPrefix}${index}`;
    newInitialState[itemId] = defaultState();
  }
  return newInitialState;
}

export { initRepond as makeRepond };
