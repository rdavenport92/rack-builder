import { v4 } from 'uuid';

export interface Project {
  elevations: Elevation[];
  activeItems: ActiveItem[];
}

export interface ActiveItem {
  type: string;
  parentId: string;
  item: Cabinet | RUData;
}

export interface Elevation {
  cabinet: Cabinet;
}

export interface Cabinet {
  id: string;
  name: string;
  ruCount: number;
  dimensions: RackDimensions;
  railDepth: number;
  openingOffset: number; // to calculate how far up from bottom of rack the opening begins
  ruData: RUData[];
}

export interface RackDimensions {
  width: number;
  height: number;
  depth: number;
}

export interface RUData {
  id: string;
  location: string;
  populator: Device | Accessory;
}

export interface Populator {
  id: string;
  name: string;
  location: 'front' | 'rear';
  partNumber?: string;
  ruSpan: number;
}

export enum DeviceType {
  SWITCH = 'switch',
  ROUTER = 'router',
  FIREWALL = 'firewall',
}

export interface Device extends Populator {
  type: DeviceType;
  portGroups: PortGroup[];
}

export interface PortGroup {
  face: 'front' | 'rear';
  ports: Port[];
  dimensions: {
    // used to help with physical layout on switch
    top: number;
    left: number;
    height: number;
    width: number;
  };
}

export enum PortType {
  ETH = 'ethernet',
  SFP = 'sfp',
  QSFP = 'qsfp',
}

export interface Port {
  id: string;
  purpose: 'data' | 'power';
  type: PortType;
}

export enum AccessoryType {
  BLANK = 'blank',
  BRUSH = 'brush',
  DRING = 'dring',
}

export interface Accessory extends Populator {
  type: AccessoryType;
}

export enum ObjectType {
  CAB = 'cabinet',
  RU = 'ru',
}

export function createCabinet(
  name: string,
  ruCount: number,
  dimensions: RackDimensions,
  railDepth?: number | undefined,
  openingOffset?: number | undefined
): Cabinet {
  railDepth = railDepth || 0;
  openingOffset = openingOffset || (dimensions.height - ruCount * 1.75) / 2;

  const id = v4();

  // creating RUs
  const ruData: RUData[] = [];
  for (let i = 0; i < ruCount; i++) {
    ruData.push({
      id: `${id}-ru-${i + 1}`,
      location: `${i + 1}`,
      populator: undefined,
    });
  }
  return {
    name,
    id,
    ruCount,
    dimensions,
    railDepth,
    openingOffset,
    ruData,
  };
}

export const SAMPLE_SWITCH: Device = {
  id: v4(),
  name: 'My Sample Switch 1U',
  type: DeviceType.SWITCH,
  portGroups: [],
  location: 'front',
  ruSpan: 1,
};

export const SAMPLE_SWITCH2: Device = {
  id: v4(),
  name: 'My Sample Switch 2U',
  type: DeviceType.SWITCH,
  portGroups: [],
  location: 'front',
  ruSpan: 2,
};

export const SAMPLE_SWITCH3: Device = {
  id: v4(),
  name: 'My Sample Switch 6U',
  type: DeviceType.SWITCH,
  portGroups: [],
  location: 'front',
  ruSpan: 6,
};

export const SAMPLE_DEVICE_LIBRARY: Device[] = [
  SAMPLE_SWITCH,
  SAMPLE_SWITCH2,
  SAMPLE_SWITCH3,
];
