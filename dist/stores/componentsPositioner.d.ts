import { PositionRectangle } from 'schemas/component';
interface Dimensions {
    width: number;
    height: number;
}
export declare class ComponentsPositioner {
    _width: number;
    _height: number;
    setDimenstions(dimensions: Dimensions): void;
    scaleValueByAxis(value: number, axis: 'x' | 'y'): number;
    scaleValues(inputValues: [number, number] | PositionRectangle): PositionRectangle | number[];
    get height(): number;
}
export declare const componentsPositioner: ComponentsPositioner;
export {};
