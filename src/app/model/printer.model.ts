export interface PrinterStatus {
  status: PrinterState;
  bed: Temperature;
  tool0: Temperature;
  chamber: Temperature;
  fanSpeed: number;
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
