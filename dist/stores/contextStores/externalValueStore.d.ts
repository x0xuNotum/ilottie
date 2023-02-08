export declare class ExternalValueStore {
    private _value;
    private _maxValue;
    initialize(newMaxValue: number, alreadyNormalized?: boolean): void;
    setValue(newValue: number): void;
    get value(): number;
    normalize(value: number): number;
}
export declare const externalValueStore: ExternalValueStore;
