import { PositionRectangle } from 'schemas/helpers';
interface Dimensions {
    width: number;
    height: number;
}
export interface CursorPosition {
    x: number;
    y: number;
}
export declare class ComponentsPositioner {
    private _width;
    private _height;
    normalizedMousePosition: CursorPosition;
    get height(): number;
    get width(): number;
    setDimenstions(dimensions: Dimensions): void;
    scaleValueByAxis(value: number, axis: 'x' | 'y'): number;
    scaleValues(inputValues: [number, number] | PositionRectangle): PositionRectangle | number[];
    setCursorPosition(newPosition: CursorPosition): void;
}
export {};
