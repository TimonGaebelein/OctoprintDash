export interface WemoCommand {
  command: 'turnOn' | 'turnOff';
  ip: string;
}
