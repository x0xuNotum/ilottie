import axios from 'axios'
import bind from 'bind-decorator'
import { plainToClass } from 'class-transformer'
import classnames from 'classnames'
import AnimationContainer from 'components/AnimationContainer'
import yaml from 'js-yaml'
import _ from 'lodash'
import { action, observable } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { YamlConfig } from 'schemas/config'
import { ContextStore, StoresContext } from 'stores/contextStores'
import { LottiePlayerSettings } from 'stores/contextStores/settingsStore'
import { windowStore } from 'stores/windowStore'
import { loadingFileErrorIsExpected } from 'utils/errors'
import { AnyObject } from 'utils/helpers'
import { getValidationErrors, safeHtml } from 'utils/validation'
import classes from './ILottie.module.css'
import './styles.css'

interface ILottieProps {
  configSrc?: string
  config?: string | YamlConfig
  externalValue: number
  name?: string
  language?: string
  muted?: boolean
  developmentMode?: boolean
  externalValueIsNormalized?: boolean
  onResourcesLoaded?: () => void
  // Function to call when all the ranges in yaml file are played
  onExternalValueOutOfRange?: () => void
  onExternalTrigger?: (eventName: string, options?: AnyObject) => void
  lottiePlayerSettings?: LottiePlayerSettings
}

@observer
class ILottie extends React.Component<ILottieProps> {
  @observable
  errors: string[] = []

  @observable
  config: YamlConfig | null = null

  @observable
  exampleFileSelected: boolean = false

  @observable.ref
  scrollElement = React.createRef<HTMLDivElement>()

  @observable.ref
  stores: ContextStore

  constructor(props: ILottieProps) {
    super(props)
    this.stores = new ContextStore(
      !!props.muted,
      props.language,
      props.lottiePlayerSettings,
      props.onResourcesLoaded
    )
  }

  render() {
    const errorsElements: JSX.Element[] = []
    const {
      externalValueIsNormalized = true,
      developmentMode = false,
      externalValue = 0,
      onExternalValueOutOfRange: scrollytellingFinishedCallback,
    } = this.props
    let content: JSX.Element = (
      <div>{/* Default content when nothing loaded */}</div>
    )
    const shouldDisplayErrors = this.errors.length

    if (!shouldDisplayErrors && this.config) {
      content = (
        <div
          className={classnames(classes['animation-wrapper-container'], {
            [classes['disabled-scroll']]: windowStore.scrollBlocked,
          })}
          ref={this.scrollElement}
        >
          <StoresContext.Provider value={this.stores}>
            <AnimationContainer
              externalValue={externalValue}
              animationConfig={this.config}
              externalValueIsNormalized={externalValueIsNormalized}
              wrapperClassName={classes['animation-wrapper']}
              name={this.props.name}
              developmentMode={developmentMode}
              onExternalTrigger={this.props.onExternalTrigger}
              scrollytellingFinishedCallback={scrollytellingFinishedCallback}
            />
          </StoresContext.Provider>
        </div>
      )
    }
    if (shouldDisplayErrors) {
      for (const error of this.errors) {
        errorsElements.push(
          <li
            key={error}
            className={classes['error-item']}
            {...safeHtml(error)}
          ></li>
        )
      }
      content = <div className={classes['errors']}>{errorsElements}</div>
    }
    return <HelmetProvider>{content}</HelmetProvider>
  }

  async componentDidMount() {
    if (this.props.config !== undefined) {
      this.handleConfigChange()
    }
    if (this.props.config === undefined && this.props.configSrc) {
      await this.handleConfigSourceChange(this.props.configSrc)
    }
  }

  async componentDidUpdate(prevProps: ILottieProps) {
    if (
      !_.isEqual(prevProps.config, this.props.config) &&
      this.props.config !== undefined
    ) {
      this.handleConfigChange()
    }
    if (
      this.props.config === undefined &&
      !_.isEqual(prevProps.configSrc, this.props.configSrc) &&
      this.props.configSrc
    ) {
      await this.handleConfigSourceChange(this.props.configSrc)
    }
    if (this.props.muted !== prevProps.muted) {
      this.stores.volumeStore.setMuted(!!this.props.muted)
    }
    // console.log('>>', prevProps, this.props)
    if (
      !_.isEqual(
        this.props.lottiePlayerSettings,
        prevProps.lottiePlayerSettings
      )
    ) {
      this.stores.settingsStore.update(this.props.lottiePlayerSettings)
    }
  }

  @bind
  handleConfigChange() {
    let jsonConfig: string | object | undefined = this.getJSONfromConfigProp()
    if (jsonConfig) {
      this.tryToTransformValidateAndSetConfig(jsonConfig)
    }
  }

  @bind
  @action
  async handleConfigSourceChange(configSource: string) {
    let doc: string | null = null
    let jsonConfig: string | object | undefined
    doc = await this.getYamlFileContent(configSource)
    if (doc) {
      try {
        jsonConfig = yaml.safeLoad(doc)
      } catch (e) {
        console.error(
          `Cannot load from iLottie configuration from "${configSource}"`
        )
        throw e
      }
    }
    if (jsonConfig) {
      this.tryToTransformValidateAndSetConfig(jsonConfig)
    }
  }

  @bind
  getJSONfromConfigProp() {
    if (typeof this.props.config === 'string') {
      return yaml.safeLoad(this.props.config)
    }
    return this.props.config
  }

  @bind
  tryToTransformValidateAndSetConfig(jsonConfig: object | string) {
    try {
      let config = plainToClass(YamlConfig, jsonConfig, {
        excludeExtraneousValues: true,
      })
      config.afterLoad(this.stores)
      this.setConfig(config)
      this.validateAndSetErrorsIfAny(config).catch((err) => console.error(err))
    } catch (err) {
      console.error(
        'An error happened while loading data. Please make sure that input data is clean and has the correct structure.'
      )
      console.error(err)
    }
  }

  @bind
  @action
  toggleExampleFileSelected() {
    this.exampleFileSelected = !this.exampleFileSelected
  }

  async getYamlFileContent<T>(path: string) {
    return axios
      .get(path)
      .then((response: any) => {
        return response.data as T
      })
      .catch((err) => {
        if (loadingFileErrorIsExpected(err)) {
          return null
        }
        throw err
      })
  }

  @bind
  async validateAndSetErrorsIfAny(config: YamlConfig) {
    const errors = await getValidationErrors(config)
    if (errors.length) {
      this.setErrors(errors)
    }
  }

  @bind
  @action
  setErrors(errors: string[]) {
    this.errors = errors
  }

  @bind
  @action
  setConfig(config: YamlConfig) {
    this.config = config
  }
}

export default ILottie
