import axios from 'axios'
import bind from 'bind-decorator'
import classnames from 'classnames'
import jss from 'jss'
import preset from 'jss-preset-default'
import { action, computed, observable } from 'mobx'
import { observer } from 'mobx-react'
import React from 'react'
import { AnimationComponent } from 'schemas/component'
import { StoresContext } from 'stores/contextStores'
import { Deferred } from 'utils/promise'
import { safeHtml } from 'utils/validation'
import classes from './AnimationMarkup.module.css'
import BaseAnimationComponent from './BaseAnimationComponent'

jss.setup(preset())

interface AnimationMarkupProps {
  data: AnimationComponent
  src: string
  resourcesLoadDeferredObj: Deferred<unknown>
}

@observer
class AnimationMarkup extends React.Component<AnimationMarkupProps> {
  @observable
  markup: string = ''

  static contextType = StoresContext

  render() {
    // const { resourcesLoadPromise } = this.props
    const jssifyStyles = (styles: { [key: string]: string }) => {
      const jssStyles: { [key: string]: string } = {}
      for (const key in styles) {
        const jssKey = `& ${key}`
        jssStyles[jssKey] = styles[key]
      }
      return {
        container: jssStyles,
      }
    }
    const jssifiedStyles = jssifyStyles(this.props.data.style)
    const classesFromYaml = jss.createStyleSheet(jssifiedStyles).attach()
    let content: JSX.Element | null = null
    const innerContent: JSX.Element = (
      <div
        {...safeHtml(this.markup)}
        className={classnames(
          classesFromYaml.classes.container,
          classes['inner-container'],
          {
            [classes['inner-container-scrollable']]: this.props.data
              .overflowScroll,
          }
        )}
        style={{
          fontSize: this.fontSize,
        }}
      ></div>
    )
    content = (
      <div
        className={classnames({
          [classes['outer-container-scrollable']]: this.props.data
            .overflowScroll,
        })}
      >
        {innerContent}
      </div>
    )
    return (
      <BaseAnimationComponent data={this.props.data}>
        {content}
      </BaseAnimationComponent>
    )
  }

  async componentDidMount() {
    const html = await axios
      .get(this.props.src)
      .then((response: any) => response.data)
      .then((result: any) => {
        return result
      })
      .finally(() => {
        if (this.props.resourcesLoadDeferredObj.resolve) {
          this.props.resourcesLoadDeferredObj.resolve(true)
        }
      })
    if (html) {
      this.setMarkup(html)
    }
  }

  @bind
  @action
  setMarkup(markup: string) {
    this.markup = markup
  }

  @computed
  get scaledFontSize() {
    const DEFAULT = 18 // px
    return DEFAULT / this.context.componentsPositioner.height
  }

  get fontSize() {
    const DEFAULT_FONT_SIZE = parseFloat(
      window
        .getComputedStyle(document.documentElement, null)
        .getPropertyValue('font-size')
    )
    return this.props.data.fluidFont ? undefined : DEFAULT_FONT_SIZE
  }
}

export default AnimationMarkup
