export interface AllStoreInfoUntyped {
  [StoreName: string]: {
    state: (itemName: any) => any;
    refs: (itemName: any, type: any) => any;
    startStates?: Record<any, any>;
  };
}

export interface RepondTypesUntyped {
  AllStoreInfo: AllStoreInfoUntyped;
  StepNames: string[] | readonly string[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface CustomRepondTypes {}

// The final usable types, with the custom types overriding the default ones
export interface RepondTypes
  extends Omit<RepondTypesUntyped, keyof CustomRepondTypes>,
    CustomRepondTypes {}

// type DDDD = RepondTypes["StepNames"];
