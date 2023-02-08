import { bind } from 'bind-decorator'
import { action, observable } from 'mobx'
import { PositionRectangle } from 'schemas/helpers'
interface Dimensions {
  width: number
  height: number
}

export interface CursorPosition {
  x: number
  y: number
}

export class ComponentsPositioner {
  private _width: number = 0
  private _height: number = 0

  @observable
  normalizedMousePosition: CursorPosition = { x: 0, y: 0 }

  get height() {
    return this._height
  }

  get width() {
    return this._width
  }

  setDimenstions(dimensions: Dimensions) {
    const { width, height } = dimensions
    if (width && height) {
      this._width = width
      this._height = height
    }
  }

  scaleValueByAxis(value: number, axis: 'x' | 'y') {
    const SCALE_PERCENTAGE = 100
    if (axis === 'x') {
      return (value / this._width) * SCALE_PERCENTAGE
    }
    return (value / this._height) * SCALE_PERCENTAGE
  }

  scaleValues(inputValues: [number, number] | PositionRectangle) {
    if (Array.isArray(inputValues)) {
      return [
        this.scaleValueByAxis(inputValues[0], 'x'),
        this.scaleValueByAxis(inputValues[1], 'y'),
      ]
    }
    const scaledPositionRectangle: PositionRectangle = {
      x: this.scaleValueByAxis(inputValues.x, 'x'),
      y: this.scaleValueByAxis(inputValues.y, 'y'),
      width: this.scaleValueByAxis(inputValues.width, 'x'),
      height: this.scaleValueByAxis(inputValues.height, 'y'),
    }
    return scaledPositionRectangle
  }

  @bind
  @action
  setCursorPosition(newPosition: CursorPosition) {
    this.normalizedMousePosition = newPosition
  }
}
