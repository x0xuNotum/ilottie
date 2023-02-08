import React from 'react';
import { AnimationComponent } from 'schemas/component';
import { Deferred } from 'utils/promise';
interface AnimationImageProps {
    data: AnimationComponent;
    src: string;
    resourcesLoadDeferredObj: Deferred<unknown>;
}
declare class AnimationImage extends React.Component<AnimationImageProps> {
    render(): JSX.Element;
    onload(): void;
}
export default AnimationImage;
