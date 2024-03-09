export declare function runNextFrame(): void;
export declare function runWhenStartingEffects(whatToRun: any): void;
export declare function runWhenStoppingEffects(whatToRun: any): void;
export declare function runWhenDoingEffectsRunAtStart(whatToRun: any, callback?: any): void;
export declare function _setState(newState: any, callback?: any): void;
export declare function _removeItem({ type: itemType, id: itemId }: {
    type: string;
    id: string;
}, callback?: any): void;
export declare function _addItem({ type, id, state, refs }: {
    type: string;
    id: string;
    state?: any;
    refs?: any;
}, callback?: any): void;
