import 'reflect-metadata';
import { ContextStore } from 'stores/contextStores';
import { ActionTypes, LottieAction } from './actions';
import { PositionRectangle } from './helpers';
export declare class AnimationComponent {
    name: string;
    posRect: PositionRectangle;
    zIndex: number;
    resource: string;
    eventHandlers: string[];
    onClick: ActionTypes[];
    onSecondClick: ActionTypes[];
    onHoverIn: ActionTypes[];
    onHoverOut: ActionTypes[];
    onShow: ActionTypes[];
    onHide: ActionTypes[];
    onEnd: ActionTypes[];
    onPlay: ActionTypes[];
    onPause: ActionTypes[];
    onCursorPositionChange: LottieAction[];
    visible: boolean;
    setVisibility(value: boolean): void;
    fluidFont: boolean;
    style: {
        [key: string]: string;
    };
    overflowScroll: boolean;
    parseStringRegexInActions(componentNames: string[]): void;
    checkActionArrayForStringRegexInComponents(actions: ActionTypes[], componentsNames: string[]): void;
    setStores(stores: ContextStore): void;
    setStoresForActions(actions: ActionTypes[], stores: ContextStore): void;
}
