import 'reflect-metadata';
import { ContextStore } from './../stores/contextStores/index';
import { ActionTypes, LottieAction, VideoAction } from './actions';
import { NumbersTuple } from './helpers';
export interface WithRange {
    range: NumbersTuple;
}
export declare class OnExternalValue {
    range: NumbersTuple;
    onRangeEnter: ActionTypes[];
    onRangeLeave: ActionTypes[];
    onCoupledChange: Array<LottieAction | VideoAction>;
    normalizeRangeValuesByFactor(max: number): void;
    private _normalizeRange;
    private _getNormalizedRangeFromItemWithRange;
    private _normalizeCoupledActions;
    parseStringRegex(componentsNames: string[]): void;
    checkActionArrayForStringRegexInComponents(actions: ActionTypes[], componentsNames: string[]): void;
    setStores(stores: ContextStore): void;
    setStoresForActions(actions: ActionTypes[], stores: ContextStore): void;
}
