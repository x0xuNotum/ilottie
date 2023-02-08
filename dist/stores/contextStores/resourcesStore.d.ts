export declare class ResourcesStore {
    onResourcesLoaded?: () => void;
    constructor(onResourcesLoaded?: () => void);
    name?: string;
    setName(name?: string): void;
    dataPromises: Map<string, Promise<unknown>>;
    addPromise(id: string, newPromise: Promise<unknown>): void;
    removePromiseByIndex(id: string): void;
    resolveAll(): Promise<[string, Promise<unknown>][]>;
}
