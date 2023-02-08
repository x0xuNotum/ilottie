import '!style-loader!css-loader!video.js/dist/video-js.css';
import * as React from 'react';
import { Deferred } from 'utils/promise';
import videojs from 'video.js';
import './VideoPlayer.css';
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'video-js': any;
        }
    }
}
interface IPlayOnlyProps extends videojs.PlayerOptions {
    className?: string;
    play?: boolean;
    videoEnded?: () => void;
    videoStarted?: () => void;
    playStateChanged?: (value: boolean, position: number) => void;
    playbackSpeed: number;
    resourcesLoadDeferredObj: Deferred<unknown>;
    seek: boolean;
    position?: number;
    playButton?: HTMLElement;
}
export declare class DefaultPlayButton extends React.Component {
    render(): JSX.Element;
}
export declare class VideoPlayer extends React.Component<IPlayOnlyProps> {
    videoElement: HTMLVideoElement | null;
    videoElementWrapperRef: React.RefObject<HTMLDivElement>;
    videoJs: videojs.Player | null;
    textTracks: {
        [key: string]: videojs.TextTrackOptions;
    };
    seeking: boolean;
    currentTimeToSet: number;
    showPlayButton: boolean;
    render(): JSX.Element;
    componentDidMount(): void;
    initPlayer(): void;
    componentDidUpdate(prevProps: IPlayOnlyProps): Promise<void>;
    playVideo(): Promise<void>;
    canPlayThrough(): void;
    componentWillUnmount(): void;
    videoOnPause(): void;
    videoOnPlay(): void;
    videoOnProgress(): void;
    videoOnEnded(): void;
    scrollPlay(): void;
}
export default VideoPlayer;
