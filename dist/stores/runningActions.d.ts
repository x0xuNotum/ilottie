import { Action } from 'schemas/actions';
declare class RunningActionsStore {
    actionsSequences: Action[][];
    interferingActions: Action[][];
    actionsMustFastForward: boolean;
    checkActionsAndPostponeExecutionIfNeeded(actions: Action[], isCleanup?: boolean): Promise<void>;
    _actionsDoNotIntersect(newActions: Action[]): boolean;
    _findAllComponentsFromActionsSequence(actions: Action[]): string[];
    addActionsSequence(actions: Action[]): void;
    setActionsMustFastForward(value: boolean): void;
    finishPlayActions(): Promise<void>;
    addInterferingActionsSequence(actions: Action[]): void;
}
export declare const runningActionsStore: RunningActionsStore;
export {};
