import { v4 } from 'uuid';

export interface Elevation {
  cabinet: Cabinet;
}

export interface Cabinet {
  id: string;
  ruCount: number;
  dimensions: RackDimensions;
  railDepth: number;
  openingOffset: number; // to calculate how far up from bottom of rack the opening begins
}

export interface RackDimensions {
  width: number;
  height: number;
  depth: number;
}

export function createCabinet(
  ruCount: number,
  dimensions: RackDimensions,
  railDepth: number = 0,
  openingOffset: number | undefined = undefined
): Cabinet {
  if (openingOffset === undefined) {
    // centering the cabinet opening
    openingOffset = (dimensions.height - ruCount * 1.75) / 2;
  }
  return {
    id: v4(),
    ruCount,
    dimensions,
    railDepth,
    openingOffset
  };
}
