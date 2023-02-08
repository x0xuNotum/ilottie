export declare function sleep(ms: number): Promise<void>;
export declare function sleepAbortable(ms: number): [Promise<boolean>, Function];
export declare function nextTick(): Promise<void>;
export declare function doNotWaitResult<T>(retVal: Promise<T>): void;
export declare function doNotWaitFct(fct: () => Promise<void>): () => void;
export declare function doNotWaitFct<T1>(fct: (t1: T1) => Promise<void>): (t1: T1) => void;
export declare function doNotWaitFct<T1, T2>(fct: (t1: T1, t2: T2) => Promise<void>): (t1: T1, t2: T2) => void;
export declare function doNotWaitFct<T1, T2, T3>(fct: (t1: T1, t2: T2, t3: T3) => Promise<void>): (t1: T1, t2: T2, t3: T3) => void;
export declare function doNotWaitFct<T1, T2, T3, T4>(fct: (t1: T1, t2: T2, t3: T3, t4: T4) => Promise<void>): (t1: T1, t2: T2, t3: T3, t4: T4) => void;
export declare function doNotWaitFct<T1, T2, T3, T4, T5>(fct: (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => Promise<void>): (t1: T1, t2: T2, t3: T3, t4: T4, t5: T5) => void;
export interface Deferred<T> {
    promise: Promise<T>;
    resolve?: (value: T) => void;
    reject?: (value: T) => void;
}
export declare function deferred<T>(): Deferred<T>;
