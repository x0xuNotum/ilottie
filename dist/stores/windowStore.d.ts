declare class Window {
    width: number;
    height: number;
    scrollBlocked: boolean;
    constructor();
    updateViewportHeight: () => void;
    updateViewportWidth: () => void;
    get isLandscape(): boolean;
    setScrollBlocked(value: boolean): void;
}
export declare const windowStore: Window;
export {};
