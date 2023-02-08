import { Expose } from 'class-transformer'
import { ValidateIf } from 'class-validator'
import { Default, IsNumbersTuple } from 'utils/validationDecorators'

export type NumbersTuple = [number, number]

export const defaultCursorPositionRectangle: CursorPositionRectangle = {
  x: [0, 0],
  y: [0, 0],
}

export class CursorPositionRectangle {
  @Expose()
  @IsNumbersTuple()
  @ValidateIf((o) => {
    return o.x !== undefined
  })
  x?: NumbersTuple

  @Expose()
  @IsNumbersTuple()
  @ValidateIf((o) => {
    return o.y !== undefined
  })
  y?: NumbersTuple
}

export class PositionRectangle {
  @Expose()
  @Default(0)
  x: number = 0

  @Expose()
  @Default(0)
  y: number = 0

  @Expose()
  @Default(0)
  width: number = 0

  @Expose()
  @Default(0)
  height: number = 0
}
