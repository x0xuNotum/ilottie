import { ActionTriggerType } from 'schemas/actions';
import { CursorPositionRectangle, NumbersTuple } from 'schemas/helpers';
interface Events {
    [key: string]: Function[];
}
export interface ILottieEvent {
    type: ActionTriggerType | '__complete';
    components: string | string[];
    interrupted?: boolean;
    paused?: boolean;
    segments?: NumbersTuple[];
    range?: [number, number];
    position?: CursorPositionRectangle;
}
export declare class EventEmitter {
    events: Events;
    constructor(events?: Events);
    subscribe<T extends ILottieEvent>(componentName: string, type: string, cb: (event: T) => void | Promise<void>): () => Function[];
    unsubscribeAll(componentName: string): void;
    private _callbackAlreadyRigesteredForName;
    emit<T extends ILottieEvent>(event: T): Promise<void>;
}
export declare const eventEmitter: EventEmitter;
export {};
