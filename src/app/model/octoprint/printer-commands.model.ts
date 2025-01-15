export interface JogCommand {
  command: 'jog';
  x: number;
  y: number;
  z: number;
  speed: number;
}

export interface ExtrudeCommand {
  command: 'extrude';
  amount: number;
  speed: number;
}

export interface GCodeCommand {
  commands: string[];
}

export interface FeedrateCommand {
  command: string;
  factor: number;
}

export interface TemperatureHotendCommand {
  command: string;
  targets: {
    [K in string as K extends string ? `tool${K}` : never]: number;
  };
}

export interface TemperatureHeatbedCommand {
  command: string;
  target: number;
}

export interface DisconnectCommand {
  command: string;
}
