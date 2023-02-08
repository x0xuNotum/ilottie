declare class ExternalValueStore {
    _value: number;
    _maxValue: number;
    initialize(newMaxValue: number, alreadyNormalized?: boolean): void;
    setValue(newValue: number): void;
    get value(): number;
    normalize(value: number): number;
}
export declare const externalValueStore: ExternalValueStore;
export {};
