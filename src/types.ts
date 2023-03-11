// https://stackoverflow.com/questions/49401866/all-possible-keys-of-an-union-type
export type KeysOfUnion<T> = T extends any ? keyof T : never;

export type ChangeToCheck<
  T_State extends { [key: string]: any },
  T_ItemType extends string
> =
  | {
      types?: [T_ItemType];
      names?: string[];
      props?: KeysOfUnion<
        NonNullable<T_State[T_ItemType]>[keyof T_State[T_ItemType]]
      >[];
      addedOrRemoved?: boolean;
    }
  | {
      types?: T_ItemType;
      names?: string[];
      props?: KeysOfUnion<
        NonNullable<T_State[T_ItemType]>[keyof T_State[T_ItemType]]
      >[];
      addedOrRemoved?: boolean;
    };
//

// https://stackoverflow.com/a/55930310 Readonly object , Ben Carp

export type DeepReadonly<T> =
  // tslint:disable-next-line: ban-types
  T extends AnyFunction | Primitive
    ? T // eslint-disable-next-line @typescript-eslint/no-unused-vars
    : T extends ReadonlyArray<infer R>
    ? T
    : T extends ReadonlyMap<infer K, infer V>
    ? IDRMap<K, V>
    : T extends ReadonlySet<infer ItemType>
    ? ReadonlySetDeep<ItemType>
    : T extends object
    ? DeepReadonlyObject<T>
    : T;

export type Primitive =
  | null
  | undefined
  | string
  | number
  | boolean
  | symbol
  | bigint;

export type AnyFunction = (...args: any[]) => any;

type DeepReadonlyObject<T> = {
  readonly [P in keyof T]: DeepReadonly<T[P]>;
};

interface IDRMap<K, V> extends ReadonlyMap<DeepReadonly<K>, DeepReadonly<V>> {}

interface ReadonlySetDeep<ItemType>
  extends ReadonlySet<DeepReadonly<ItemType>> {}
//

// ----------------------------
// stuff from createStoreHelpers

// type Without<T, K> = Pick<T, Exclude<keyof T, K>>;
type WithoutB<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };
export type XOR<T, U> = T | U extends object
  ? (WithoutB<T, U> & U) | (WithoutB<U, T> & T)
  : T | U;
// NOTE: could use ts-xor package (same)

export type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> };

// export type GetReadOnlyState<T_State> = {
//   [P_Type in keyof T_State]?: {
//     [P_Name in keyof T_State[P_Type]]?: {
//       [P_Property in keyof T_State[P_Type][P_Name]]?: P_Property extends keyof T_State[P_Type][P_Name]
//         ? Readonly<T_State[P_Type][P_Name][P_Property]>
//         : never;
//     };
//   };
// };

export type GetPartialState<T_State> = {
  [P_Type in keyof T_State]?: {
    [P_Name in keyof T_State[P_Type]]?: {
      [P_Property in keyof T_State[P_Type][P_Name]]?: P_Property extends keyof T_State[P_Type][P_Name]
        ? T_State[P_Type][P_Name][P_Property]
        : never;
    };
  };
};

export type ExtendsString<T> = T extends string ? T : never;

// ------------------------------------

export type RepondCallback = (frameDuration: number, frameTime: number) => any;

export type SetRepondState<T_State> = (
  newState:
    | GetPartialState<T_State>
    | ((state: DeepReadonly<T_State>) => GetPartialState<T_State>),
  callback?: RepondCallback
) => void;

export type Phase = "subscribe" | "derive";
