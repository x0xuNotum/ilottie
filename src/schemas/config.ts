import { bind } from 'bind-decorator'
import { Expose, Type } from 'class-transformer'
import { IsArray, IsInt, ValidateNested } from 'class-validator'
import { computed } from 'mobx'
import 'reflect-metadata'
import { ContextStore } from 'stores/contextStores'
import { Default, IsStringArray } from 'utils/validationDecorators'
import { AnimationComponent } from './component'
import { OnExternalValue } from './onExternalValue'
import {
  Content,
  ContentAudio,
  ContentCSS,
  ContentFont,
  ContentImage,
  ContentLottie,
  ContentMarkup,
  ContentTypes,
  ContentVideo,
} from './resources'

export class YamlConfig {
  @Expose()
  @IsInt()
  @Default(1000)
  surfaceWidth: number = 1000

  @Expose()
  @IsInt()
  @Default(1000)
  surfaceHeight: number = 1000

  @Expose()
  @IsInt()
  @Default(1000)
  externalValueLimit: number = 1000

  @Expose()
  @IsStringArray()
  @Default([])
  languages: string[] = []

  @Expose()
  @IsArray()
  @Type(() => OnExternalValue)
  @ValidateNested()
  @Default([])
  onExternalValue: OnExternalValue[] = []

  @Expose()
  @Default([])
  @ValidateNested()
  @Type(() => Content, {
    keepDiscriminatorProperty: true,
    discriminator: {
      property: 'type',
      subTypes: [
        { value: ContentImage, name: 'png' },
        { value: ContentImage, name: 'jpg' },
        { value: ContentImage, name: 'svg' },
        { value: ContentLottie, name: 'lottie' },
        { value: ContentMarkup, name: 'markup' },
        { value: ContentCSS, name: 'css' },
        { value: ContentFont, name: 'font' },
        { value: ContentAudio, name: 'mp3' },
        { value: ContentVideo, name: 'mp4' },
      ],
    },
  })
  resources: ContentTypes[] = []

  @Expose()
  @IsArray()
  @Type(() => AnimationComponent)
  @ValidateNested()
  @Default([])
  components: AnimationComponent[] = []

  @computed
  get componentNames() {
    return this.components.map((component) => component.name)
  }

  afterLoad(stores: ContextStore) {
    this._normalizeRangeValues()
    this._parseStringRegexInConfig()
    this._setStores(stores)
  }

  @bind
  private _normalizeRangeValues() {
    for (const externalValueItem of this.onExternalValue) {
      externalValueItem.normalizeRangeValuesByFactor(this.externalValueLimit)
    }
  }

  @bind
  private _parseStringRegexInConfig() {
    this._parseStringRegexInExternalValue()
    this._parseStringRegexInComponents()
  }

  @bind
  private _parseStringRegexInExternalValue() {
    for (const externalValueItem of this.onExternalValue) {
      externalValueItem.parseStringRegex(this.componentNames)
    }
  }

  @bind
  private _parseStringRegexInComponents() {
    for (const component of this.components) {
      component.parseStringRegexInActions(this.componentNames)
    }
  }

  @bind
  private _setStores(stores: ContextStore) {
    this._setStoresInExternalValue(stores)
    this._setStoresInComponents(stores)
  }

  @bind
  private _setStoresInExternalValue(stores: ContextStore) {
    for (const externalValueItem of this.onExternalValue) {
      externalValueItem.setStores(stores)
    }
  }

  @bind
  private _setStoresInComponents(stores: ContextStore) {
    for (const component of this.components) {
      component.setStores(stores)
    }
  }
}
