declare type RendererType = 'svg' | 'canvas';
declare type QualityType = 'high' | 'medium' | 'low';
export interface LottiePlayerSettings {
    renderer: RendererType;
    quality: QualityType;
}
export declare class SettingsStore {
    settings: LottiePlayerSettings;
    constructor(lottiePlayerSettings?: LottiePlayerSettings);
    update(lottiePlayerSettings?: LottiePlayerSettings): void;
}
export {};
