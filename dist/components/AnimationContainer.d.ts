import React from 'react';
import { Action, ExternalTriggerAction } from 'schemas/actions';
import { AnimationComponent } from 'schemas/component';
import { YamlConfig } from 'schemas/config';
import { EventEmitter } from 'stores/contextStores/eventEmitter';
import { ExternalValueStore } from 'stores/contextStores/externalValueStore';
import { ResourcesStore } from 'stores/contextStores/resourcesStore';
import { RunningActionsStore } from 'stores/contextStores/runningActions';
import { AnyObject } from 'utils/helpers';
interface AnimationContainerProps {
    animationConfig: YamlConfig;
    externalValue: number;
    wrapperClassName?: string;
    containerClassName?: string;
    externalValueIsNormalized: boolean;
    name?: string;
    developmentMode: boolean;
    scrollytellingFinishedCallback?: () => void;
    onExternalTrigger?: (eventName: string, options?: AnyObject) => void;
}
export interface ExtendedAction {
    action: Action;
    limits: [number, number];
}
interface HoverTrackingHelper {
    isHovered: boolean;
    component: AnimationComponent;
}
declare class AnimationContainer extends React.Component<AnimationContainerProps> {
    components: Map<string, JSX.Element | null>;
    subscriptions: Array<() => void>;
    firstLoad: boolean[];
    externalValueTracker: number | null;
    animationContainer: React.RefObject<HTMLDivElement>;
    animationWrapper: React.RefObject<HTMLDivElement>;
    hoverTrackingHelper: HoverTrackingHelper[];
    mouseLeft: boolean;
    cursorIsInsideContainer: boolean;
    wrapperHeight: number;
    wrapperWidth: number;
    static contextType: React.Context<import("../stores/contextStores").ContextStore>;
    get externalValueStore(): ExternalValueStore;
    get resourcesStore(): ResourcesStore;
    get runningActionsStore(): RunningActionsStore;
    get eventEmitter(): EventEmitter;
    get resourcesResolved(): boolean;
    render(): JSX.Element;
    constructor(a: AnimationContainerProps);
    componentDidMount(): Promise<void>;
    componentWillUnmount(): void;
    subscribeForEvent<T extends Action>(type: string, cb: (args: T) => void | Promise<void>): void;
    unsubscribeFromAllEvents(): void;
    handleExternalTrigger(action: ExternalTriggerAction): void;
    setup(): Promise<void>;
    reset(): void;
    componentDidUpdate(prevProps: AnimationContainerProps): Promise<void>;
    get width(): number;
    get height(): number;
    get fontSize(): number;
    setWrapperSizes(): void;
    get isLimitedByHeight(): boolean;
    initializeAnimationComponents(): Promise<void>;
    setUpComponent(componentConfig: AnimationComponent): void;
    setComponentByName(component: JSX.Element | null, name: string): void;
    createHoverTrackingHelpers(componentConfig: AnimationComponent): void;
    processStyleResources(): void;
    setComponentsPositionerDimensions(): void;
    handleMouseMove(e: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
    setNormalizedPosition(mouseX: number, mouseY: number): void;
    checkIfCursorIsInside(mouseX: number, mouseY: number): boolean;
    handleCursorPositionChange(cursorIsInside: boolean): void;
    handleCursorLeavingAnimationContainer(): void;
    setCursorIsInside(value: boolean): void;
    updateHoveredComponents(): void;
    setMouseLeft(value: boolean): void;
    checkIfComponentIsHovered(component: AnimationComponent): boolean;
    setHoverHelperHoverState(helper: HoverTrackingHelper, hoverState: boolean): void;
    emitActionsOnCursorPositionChange(): void;
    emitActionsOnExternalValue(prevExternalValue: number): Promise<void>;
    emitActionOnRangeLeave(prevExternalValue: number): Promise<void>;
    emitActionOnRangeEnter(prevExternalValue: number): Promise<void>;
    emitActionOnCoupledChange(): void;
    externalValueEntersRange(prevExternalValue: number, externalValueBoundaries: [number, number]): boolean;
    externalValueLeavesRange(prevExternalValue: number, externalValueBoundaries: [number, number]): boolean;
    externalValueIsWithinBoundaries(boundaries: [number, number]): boolean;
    get firstLoadForAllComponents(): boolean;
    onLeavingAnimationRange(prevExternalValue: number): void;
}
export default AnimationContainer;
