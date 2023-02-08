import { Action, ActionTriggerType } from 'schemas/actions';
export declare class RunningActionsStore {
    actionsSequences: Action[][];
    actionsReferencies: Action[][];
    interferingActions: Action[][];
    checkActionsAndPostponeExecutionIfNeeded(actions: Action[], isRunForControl?: boolean, triggerName?: ActionTriggerType): Promise<void>;
    private _findAndStoreInterferingActions;
    private _addActionsSequenceIfInterfering;
    private _findCommonComponentsWithinActionsSequences;
    private _findAllComponentsFromActionsSequence;
    private _addActionsSequence;
    private get _actionsDoNotInterfere();
    private _addInterferingActionsSequence;
    private _processActionsWhenNoInterference;
    private _processActionsWhenInterference;
    private _executeActionsFastAndStopTrackingThem;
}
export declare const runningActionsStore: RunningActionsStore;
