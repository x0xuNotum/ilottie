/// <reference types="react" />
import { AnimationComponent } from './component';
import { Deferred } from 'utils/promise';
export declare type ContentResourceTypes = 'png' | 'jpg' | 'svg' | 'lottie' | 'markup' | 'font' | 'mp3' | 'mp4' | 'css';
interface IFontFace {
    'font-family': string;
    src: string;
    'unicode-range'?: string;
    'font-stretch'?: string;
    'font-weight'?: string;
    'font-style'?: string;
}
export interface IComponentOptions {
    allowedLanguages: string[];
    language: string;
}
export declare class Content {
    type: ContentResourceTypes;
    name: string;
    doNotCreateComponent: string[];
    get doesNotCreateComponent(): boolean;
    createComponent(_data: any, resourcesLoadDeferredObj: Deferred<unknown>): JSX.Element;
    createStyleElement(_deferredObj: Deferred<unknown>): JSX.Element | null;
}
export interface ContentImageProps {
    key: string;
    externalValue: number;
}
export declare class ContentImage extends Content {
    type: 'png' | 'jpg' | 'svg';
    src: string;
    createComponent(data: AnimationComponent, resourcesLoadDeferredObj: Deferred<unknown>, _options?: IComponentOptions): JSX.Element;
}
export declare class ContentLottie extends Content {
    type: 'lottie';
    src: string;
    createComponent(data: AnimationComponent, resourcesLoadDeferredObj: Deferred<unknown>): JSX.Element;
}
export declare class ContentMarkup extends Content {
    type: 'markup';
    content: string;
    src: string;
    defaultFontSize: string;
    createComponent(data: AnimationComponent, resourcesLoadDeferredObj: Deferred<unknown>, options?: IComponentOptions): JSX.Element;
}
export declare class ContentCSS extends Content {
    type: 'css';
    src: string;
    createStyleElement(deferredObj: Deferred<unknown>): JSX.Element | null;
}
export declare class ContentFont extends Content {
    type: 'font';
    src: string;
    fontFace: IFontFace | null;
    private readonly _fontFormats;
    get fontType(): string;
    createStyleElement(deferredObj: Deferred<unknown>): JSX.Element;
    private _buildFontFaceString;
    private _addFontFaceSrcIfMissing;
}
export declare class ContentAudio extends Content {
    type: 'mp3';
    src: string;
    createComponent(data: AnimationComponent, resourcesLoadDeferredObj: Deferred<unknown>): JSX.Element;
}
export declare class ContentVideo extends Content {
    type: 'mp4';
    src: string;
    createComponent(data: AnimationComponent, resourcesLoadDeferredObj: Deferred<unknown>): JSX.Element;
}
export declare type ContentTypes = ContentImage | ContentLottie | ContentMarkup | ContentAudio | ContentFont | ContentVideo | ContentCSS;
export {};
