import { CSSProperties } from 'react';
import 'reflect-metadata';
import { ContextStore } from './../stores/contextStores/index';
import { AnyObject } from './../utils/helpers';
import { CursorPositionRectangle, NumbersTuple } from './helpers';
export declare type ActionTriggerType = 'show' | 'hide' | 'seek' | 'play' | 'pause' | 'stop' | 'setStyles' | 'externalTrigger';
export declare type DisplayActionTriggerType = 'show' | 'hide' | 'setStyles';
export declare type MediaActionTriggerType = 'seek' | 'play' | 'pause';
export declare type AnimationFunction = 'ease-in';
export declare type VolumeAnimationFunction = 'linear' | 'logarithmic';
export declare class Action {
    type: ActionTriggerType;
    components: string | string[];
    delay: number;
    playingTurn: 'playWithPrevious' | 'playAfterPrevious';
    styles: CSSProperties;
    alreadyRunning: boolean;
    wasRun: boolean;
    actionsArray: Action[];
    cancel: Function | null;
    stores: ContextStore | null;
    shouldStopSlowExecution: boolean;
    get isCancelable(): boolean;
    get index(): number;
    get nextAction(): Action;
    get fastAction(): {
        type: any;
        components: string | string[];
    };
    get componentsIsARegex(): boolean;
    get hasRange(): boolean;
    stop(): Promise<void>;
    run(actions: Action[], shouldRunFast?: boolean): Promise<boolean | undefined>;
    setAlreadyRunning(value: boolean): void;
    initiateActionsArray(actions: Action[]): void;
    setWasRun(value: boolean): void;
    resetWasRunForAllActions(): void;
    normalizeRangeByFactor(_max: number): void;
    stopSlowExectuionForAllActions(): void;
    initiateSlowExecutionForAllActions(): void;
    setStopSlowExecution(value: boolean): void;
    resetAction(): void;
    awaitCallbackIfNeededAndProcessNextAction(callbacksExecuted: Promise<void> | undefined, shouldRunFast?: boolean): Promise<void>;
    extractComponentNamesFromRegex(componentsNames: string[]): void;
    buildComponentNamesArrayFromStringRegex(componentsNames: string[]): string[];
    setStores(stores: ContextStore): void;
}
export declare class DisplayAction extends Action {
    type: DisplayActionTriggerType;
    animationFunction: AnimationFunction;
    animationDuration: number;
    get fastAction(): this & {
        animationDuration: number;
        delay: number;
        runFast: boolean;
    };
}
export declare class LottieAction extends Action {
    type: MediaActionTriggerType;
    segments: NumbersTuple[];
    count: number;
    position?: CursorPositionRectangle;
    playbackSpeed: number;
    volumeUpFunction: VolumeAnimationFunction;
    volumeDownFunction: VolumeAnimationFunction;
    volumeUpAnimationDuration: number;
    volumeDownAnimationDuration: number;
    range: [number, number];
    get isCancelable(): boolean;
    get fastAction(): this & {
        animationDuration: number;
        delay: number;
        type: string;
    };
    normalizeRangeByFactor(max: number): void;
    private _getNormalizedRangeFromItemWithRange;
}
export declare class AudioAction extends Action {
    type: MediaActionTriggerType;
    count: number;
    playbackSpeed: number;
    volumeUpFunction: VolumeAnimationFunction;
    volumeDownFunction: VolumeAnimationFunction;
    volumeUpAnimationDuration: number;
    volumeDownAnimationDuration: number;
    get fastAction(): this & {
        animationDuration: number;
        delay: number;
        type: string;
    };
}
export declare class VideoAction extends AudioAction {
    type: MediaActionTriggerType;
}
export declare class ExternalTriggerAction extends Action {
    type: ActionTriggerType;
    eventName: string;
    options?: AnyObject;
}
export declare type ActionTypes = LottieAction | DisplayAction | AudioAction | VideoAction | ExternalTriggerAction;
export declare function processActions(actions: Action[]): Promise<boolean | undefined>;
export declare const ActionsTypesDiscriminator: {
    keepDiscriminatorProperty: boolean;
    discriminator: {
        property: string;
        subTypes: ({
            value: typeof DisplayAction;
            name: string;
        } | {
            value: typeof LottieAction;
            name: string;
        } | {
            value: typeof ExternalTriggerAction;
            name: string;
        })[];
    };
};
