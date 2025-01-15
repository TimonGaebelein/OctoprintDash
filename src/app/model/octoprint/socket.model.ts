/* eslint-disable camelcase */
import { OctoprintFile } from './file.model';

export interface OctoprintSocketCurrent {
  current: {
    busyFiles: Array<string>;
    currentZ: number;
    job: OctoprintJob;
    logs: Array<string>;
    messages: Array<string>;
    offsets: OctoprintOffsets;
    progress: OctoprintProgress;
    resends: OctoprintSocketResends;
    serverTime: number;
    state: OctoprintSocketState;
    temps: OctoprintSocketTemperatures;
  };
}

export interface OctoprintSocketEvent {
  event: {
    type: string;
    payload: {
      error: string;
      reason: string;
    };
  };
}
export interface OctoprintPluginMessage {
  plugin: {
    plugin: string;
    data: unknown;
  };
}

interface OctoprintJob {
  averagePrintTime: number;
  estimatedPrintTime: number;
  filament: OctoprintFilament;
  file: OctoprintFile;
  lastPrintTime: string;
  user: string;
}
export interface OctoprintFilament {
  [key: string]: OctoprintFilamentValues;
}

interface OctoprintFilamentValues {
  length: number;
  volume: number;
}

type OctoprintOffsets = {
  [K in string as K extends string ? `tool${K}` : never]: number;
};

interface OctoprintProgress {
  completion: number;
  filepos: number;
  printTime: number;
  printTimeLeft: number;
  printTimeLeftOrigin: string;
}

interface OctoprintSocketResends {
  count: number;
  transmitted: number;
  ratio: number;
}

interface OctoprintSocketState {
  text: string;
  flags: OctoprintSocketStateFlags;
}

interface OctoprintSocketStateFlags {
  cancelling: boolean;
  closedOrError: boolean;
  error: boolean;
  finishing: boolean;
  operational: boolean;
  paused: boolean;
  pausing: boolean;
  printing: boolean;
  ready: boolean;
  resuming: boolean;
  sdReady: boolean;
}

interface OctoprintSocketTemperatures {
  [key: number]: {
    time: number;
    bed: OctoprintSocketTemperature;
    chamber: OctoprintSocketTemperature;
  } & {
    [K in string as K extends string ? `tool${K}` : never]: OctoprintSocketTemperature;
  };
}

interface OctoprintSocketTemperature {
  actual: number;
  target: number;
}
