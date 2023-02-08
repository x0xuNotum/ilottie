export declare class VolumeStore {
    private _muted;
    private _volume;
    get muted(): boolean;
    get volume(): number;
    constructor(muted: boolean);
    setVolume(value: number): boolean;
    setMuted(value: boolean): void;
}
