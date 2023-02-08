import bind from 'bind-decorator'
import classnames from 'classnames'
import { observer } from 'mobx-react'
import React from 'react'
import { AnimationComponent } from 'schemas/component'
import { Deferred } from 'utils/promise'
import classes from './AnimationImage.module.css'
import BaseAnimationComponent from './BaseAnimationComponent'

interface AnimationImageProps {
  data: AnimationComponent
  src: string
  resourcesLoadDeferredObj: Deferred<unknown>
}

@observer
class AnimationImage extends React.Component<AnimationImageProps> {
  render() {
    // const { resourcesLoadPromise } = this.props
    return (
      <BaseAnimationComponent data={this.props.data}>
        <img
          className={classnames(classes['image'])}
          alt=""
          src={this.props.src}
          onLoad={this.onload}
          onError={this.onload}
        />
      </BaseAnimationComponent>
    )
  }

  @bind
  onload() {
    if (this.props.resourcesLoadDeferredObj.resolve) {
      this.props.resourcesLoadDeferredObj.resolve(true)
    }
  }
}

export default AnimationImage
