import React from 'react';
import { Action, DisplayAction } from 'schemas/actions';
import { AnimationComponent } from 'schemas/component';
import { PositionRectangle } from 'schemas/helpers';
import { ComponentsPositioner } from 'stores/contextStores/componentsPositioner';
import { EventEmitter } from 'stores/contextStores/eventEmitter';
import { RunningActionsStore } from 'stores/contextStores/runningActions';
interface BaseAnimationComponentProps {
    data: AnimationComponent;
}
interface TransitionProperties {
    property: 'opacity';
    delay: number;
    duration: number;
    timingFunction: string;
}
declare class BaseAnimationComponent<T> extends React.Component<BaseAnimationComponentProps & T> {
    componentIsShown: boolean;
    transitionProperties: TransitionProperties;
    alreadyClicked: boolean;
    subscriptions: Array<() => void>;
    externalStyles: React.CSSProperties;
    cancel: Function | null;
    static contextType: React.Context<import("../../stores/contextStores").ContextStore>;
    get eventEmitter(): EventEmitter;
    get componentsPositioner(): ComponentsPositioner;
    get runningActionsStore(): RunningActionsStore;
    render(): JSX.Element;
    componentDidMount(): void;
    componentWillUnmount(): void;
    unsubscribeFromAllEvents(): void;
    subscribeForEvent<T extends Action>(type: string, cb: (args: T) => void | Promise<void>): void;
    handleClick(): void;
    handleShowAction(action: DisplayAction): Promise<void>;
    handleHideAction(action: DisplayAction): Promise<void>;
    get positionRectangle(): PositionRectangle;
    setComponentVisibility(value: boolean): void;
    setTransitionProperties(action: DisplayAction): void;
    toggleAlreadyClicked(): void;
    get shouldUsePointerCursor(): boolean;
    handleSetStylesAction(action: Action): void;
}
export default BaseAnimationComponent;
