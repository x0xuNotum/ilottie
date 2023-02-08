import React from 'react';
import { AnimationComponent } from 'schemas/component';
import { Deferred } from 'utils/promise';
interface AnimationMarkupProps {
    data: AnimationComponent;
    src: string;
    resourcesLoadDeferredObj: Deferred<unknown>;
}
declare class AnimationMarkup extends React.Component<AnimationMarkupProps> {
    markup: string;
    static contextType: React.Context<import("../../stores/contextStores").ContextStore>;
    render(): JSX.Element;
    componentDidMount(): Promise<void>;
    setMarkup(markup: string): void;
    get scaledFontSize(): number;
    get fontSize(): number | undefined;
}
export default AnimationMarkup;
