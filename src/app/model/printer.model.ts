export interface PrinterStatus {
  status: PrinterState;
  bed: Temperature;
  fanSpeed: number;
  tools: Temperature[];
}

interface Temperature {
  current: number;
  set: number;
  unit: string;
}

export enum PrinterState {
  operational,
  pausing,
  paused,
  printing,
  cancelling,
  closed,
  connecting,
  reconnecting,
  socketDead,
}
