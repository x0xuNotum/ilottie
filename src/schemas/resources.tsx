import { Expose } from 'class-transformer'
import { IsIn, IsString } from 'class-validator'
import AnimationImage from 'components/ContentComponents/AnimationImage'
import AnimationLottie from 'components/ContentComponents/AnimationLottie'
import AnimationMarkup from 'components/ContentComponents/AnimationMarkup'
import React from 'react'
import { Default } from 'utils/validationDecorators'
import { AnimationComponent } from './component'
import { Helmet } from 'react-helmet-async'
import { AnimationSound } from 'components/ContentComponents/AnimationSound'
import { AnimationVideo } from 'components/ContentComponents/AnimationVideo'
import { hasKey } from 'utils/helpers'
import { computed } from 'mobx'
import { bind } from 'bind-decorator'
import { Deferred } from 'utils/promise'
export type ContentResourceTypes =
  | 'png'
  | 'jpg'
  | 'svg'
  | 'lottie'
  | 'markup'
  | 'font'
  | 'mp3'
  | 'mp4'
  | 'css'

interface IFontFace {
  'font-family': string
  src: string
  'unicode-range'?: string
  'font-stretch'?: string
  'font-weight'?: string
  'font-style'?: string
}

export interface IComponentOptions {
  allowedLanguages: string[]
  language: string
}

export class Content {
  @Expose()
  @IsString()
  @Default('png')
  @IsIn(['png', 'jpg', 'svg', 'lottie', 'markup', 'css', 'font', 'mp3', 'mp4'])
  type: ContentResourceTypes = 'png'

  @Expose()
  @IsString()
  @Default('')
  name: string = ''

  doNotCreateComponent = ['font', 'css']

  @computed
  get doesNotCreateComponent() {
    return this.doNotCreateComponent.indexOf(this.type) >= 0
  }

  createComponent(
    _data: any,
    resourcesLoadDeferredObj: Deferred<unknown>
  ): JSX.Element {
    if (resourcesLoadDeferredObj.resolve) {
      resourcesLoadDeferredObj.resolve(true)
    }
    return <div key="content"></div>
  }

  createStyleElement(_deferredObj: Deferred<unknown>): JSX.Element | null {
    return <div key="style_content"></div>
  }
}

export interface ContentImageProps {
  key: string
  externalValue: number
}

export class ContentImage extends Content {
  @Expose()
  @IsString()
  @Default('png')
  @IsIn(['png', 'jpg', 'svg'])
  type: 'png' | 'jpg' | 'svg' = 'png'

  @Expose()
  @IsString()
  @Default('')
  src: string = ''

  createComponent(
    data: AnimationComponent,
    resourcesLoadDeferredObj: Deferred<unknown>,
    _options?: IComponentOptions
  ): JSX.Element {
    return (
      <AnimationImage
        key={data.name}
        data={data}
        src={this.src}
        resourcesLoadDeferredObj={resourcesLoadDeferredObj}
      />
    )
  }
}

export class ContentLottie extends Content {
  @Expose()
  @IsString()
  type: 'lottie' = 'lottie'

  @Expose()
  @IsString()
  @Default('')
  src: string = ''

  createComponent(
    data: AnimationComponent,
    resourcesLoadDeferredObj: Deferred<unknown>
  ): JSX.Element {
    return (
      <AnimationLottie
        key={data.name}
        data={data}
        src={this.src}
        resourcesLoadDeferredObj={resourcesLoadDeferredObj}
      />
    )
  }
}

export class ContentMarkup extends Content {
  @Expose()
  @IsString()
  type: 'markup' = 'markup'

  @Expose()
  @IsString()
  @Default('')
  content: string = ''

  @Expose()
  @IsString()
  @Default('')
  src: string = ''

  @Expose()
  @IsString()
  @Default('')
  defaultFontSize: string = ''

  createComponent(
    data: AnimationComponent,
    resourcesLoadDeferredObj: Deferred<unknown>,
    options?: IComponentOptions
  ): JSX.Element {
    let language = 'en'
    if (options) {
      language = options.language
      if (
        options.allowedLanguages.length &&
        options.allowedLanguages.indexOf(language) < 0
      ) {
        language = options.allowedLanguages[0]
      }
    }
    const localizedSrc = options
      ? this.src.replace(/%language%/g, language)
      : this.src
    return (
      <AnimationMarkup
        data={data}
        key={data.name}
        src={localizedSrc}
        resourcesLoadDeferredObj={resourcesLoadDeferredObj}
      />
    )
  }
}

export class ContentCSS extends Content {
  @Expose()
  @IsString()
  type: 'css' = 'css'

  @Expose()
  @IsString()
  @Default('')
  src: string = ''

  createStyleElement(deferredObj: Deferred<unknown>): JSX.Element | null {
    if (deferredObj.resolve) {
      deferredObj.resolve(true)
    }
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.href = this.src
    document.head.appendChild(link)
    return null
  }
}
export class ContentFont extends Content {
  @Expose()
  @IsString()
  type: 'font' = 'font'

  @Expose()
  @IsString()
  @Default('')
  src: string = ''

  @Expose()
  @Default(null)
  fontFace: IFontFace | null = null

  private readonly _fontFormats = {
    woff2: "format('woff2')",
    woff: "format('woff')",
    ttf: "format('truetype')",
  }

  @computed
  get fontType() {
    if (this.fontFace) {
      return this.src.split('.').pop() ?? ''
    }
    return ''
  }

  createStyleElement(deferredObj: Deferred<unknown>): JSX.Element {
    let fontElement: JSX.Element | null = null
    if (!this.fontFace) {
      fontElement = <link href={this.src} rel="stylesheet"></link>
    }
    if (this.fontFace) {
      let fontFaceString = this._buildFontFaceString()
      if (fontFaceString) {
        fontElement = <style type="text/css">{fontFaceString}</style>
      }
    }
    if (deferredObj.resolve) {
      deferredObj.resolve(true)
    }
    return <Helmet key={this.src}>{fontElement}</Helmet>
  }

  @bind
  private _buildFontFaceString() {
    let fontFaceString = ''
    if (this.fontFace) {
      fontFaceString = '@font-face {\n'
      for (const key in this.fontFace) {
        if (hasKey(this.fontFace, key)) {
          fontFaceString += `${key}: ${this.fontFace[key] as string};\n`
        }
      }
      fontFaceString = this._addFontFaceSrcIfMissing(
        fontFaceString,
        this.fontFace.src
      )
      fontFaceString += '}'
    }
    return fontFaceString
  }

  @bind
  private _addFontFaceSrcIfMissing(
    fontFaceString: string,
    fontFaceSrc?: string
  ) {
    let newFontFaceString = fontFaceString.slice()
    if (!fontFaceSrc) {
      newFontFaceString += `src: url("${this.src}") ${
        (hasKey(this._fontFormats, this.fontType) &&
          this._fontFormats[this.fontType]) ||
        ''
      }\n`
    }
    return newFontFaceString
  }
}

export class ContentAudio extends Content {
  @Expose()
  @IsString()
  type: 'mp3' = 'mp3'

  @Expose()
  @IsString()
  @Default('')
  src: string = ''

  createComponent(
    data: AnimationComponent,
    resourcesLoadDeferredObj: Deferred<unknown>
  ): JSX.Element {
    return (
      <AnimationSound
        data={data}
        key={data.name}
        src={this.src}
        resourcesLoadDeferredObj={resourcesLoadDeferredObj}
      />
    )
  }
}

export class ContentVideo extends Content {
  @Expose()
  @IsString()
  type: 'mp4' = 'mp4'

  @Expose()
  @IsString()
  @Default('')
  src: string = ''

  createComponent(
    data: AnimationComponent,
    resourcesLoadDeferredObj: Deferred<unknown>
  ): JSX.Element {
    return (
      <AnimationVideo
        data={data}
        key={data.name}
        src={this.src}
        resourcesLoadDeferredObj={resourcesLoadDeferredObj}
      />
    )
  }
}
export type ContentTypes =
  | ContentImage
  | ContentLottie
  | ContentMarkup
  | ContentAudio
  | ContentFont
  | ContentVideo
  | ContentCSS
