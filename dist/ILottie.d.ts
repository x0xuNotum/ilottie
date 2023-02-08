import React from 'react';
import { YamlConfig } from 'schemas/config';
import { ContextStore } from 'stores/contextStores';
import { LottiePlayerSettings } from 'stores/contextStores/settingsStore';
import { AnyObject } from 'utils/helpers';
import './styles.css';
interface ILottieProps {
    configSrc?: string;
    config?: string | YamlConfig;
    externalValue: number;
    name?: string;
    language?: string;
    muted?: boolean;
    developmentMode?: boolean;
    externalValueIsNormalized?: boolean;
    onResourcesLoaded?: () => void;
    onExternalValueOutOfRange?: () => void;
    onExternalTrigger?: (eventName: string, options?: AnyObject) => void;
    lottiePlayerSettings?: LottiePlayerSettings;
}
declare class ILottie extends React.Component<ILottieProps> {
    errors: string[];
    config: YamlConfig | null;
    exampleFileSelected: boolean;
    scrollElement: React.RefObject<HTMLDivElement>;
    stores: ContextStore;
    constructor(props: ILottieProps);
    render(): JSX.Element;
    componentDidMount(): Promise<void>;
    componentDidUpdate(prevProps: ILottieProps): Promise<void>;
    handleConfigChange(): void;
    handleConfigSourceChange(configSource: string): Promise<void>;
    getJSONfromConfigProp(): string | object | undefined;
    tryToTransformValidateAndSetConfig(jsonConfig: object | string): void;
    toggleExampleFileSelected(): void;
    getYamlFileContent<T>(path: string): Promise<T | null>;
    validateAndSetErrorsIfAny(config: YamlConfig): Promise<void>;
    setErrors(errors: string[]): void;
    setConfig(config: YamlConfig): void;
}
export default ILottie;
