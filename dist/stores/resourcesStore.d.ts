declare class ResourcesStore {
    dataPromises: Array<Promise<any>>;
    addPromise(newPromise: Promise<any>): void;
    resolveAll(): Promise<any[]>;
}
export declare const resourcesStore: ResourcesStore;
export {};
