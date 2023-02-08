import React from 'react'
import classes from './LoadingSpinner.module.css'
import classnames from 'classnames'

interface ILoadingSpinnerProps {
  className?: string
}

export class LoadingSpinner extends React.Component<ILoadingSpinnerProps> {
  render() {
    return (
      <div className={ classnames(classes['container'], this.props.className) }>
        <div
          className={ classnames(classes['lds-dual-ring']) }
        ></div>
      </div>
    )
  }
}
