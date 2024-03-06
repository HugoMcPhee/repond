export declare function runNextFrame(): void;
export declare function runWhenStartingInnerEffects(whatToRun: any): void;
export declare function runWhenStoppingInnerEffects(whatToRun: any): void;
export declare function runWhenDoingInnerEffectsRunAtStart(whatToRun: any, callback?: any): void;
export declare function _setState(newState: any, callback?: any): void;
export declare function _removeItem({ type: itemType, name: itemName }: {
    type: string;
    name: string;
}, callback?: any): void;
export declare function _addItem({ type, name, state, refs, }: {
    type: string;
    name: string;
    state?: any;
    refs?: any;
}, callback?: any): void;
