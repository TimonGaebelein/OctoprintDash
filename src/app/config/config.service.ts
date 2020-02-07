import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import Ajv from 'ajv';
import _ from 'lodash';
import { DisplayLayerProgressAPI } from '../plugin-service/layer-progress.service';

declare global {
  interface Window {
    require: any;
    process: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private store: any | undefined;
  private validator: Ajv.ValidateFunction;

  private config: Config;
  private valid: boolean;
  private update = false;
  private initialized = false;

  private httpHeaders: object;

  constructor(private http: HttpClient) {
    const ajv = new Ajv({ allErrors: true });
    this.validator = ajv.compile(schema);
    if (window && window.process && window.process.type) {
      const Store = window.require('electron-store');
      this.store = new Store();
      this.initialize(this.store.get('config'));
    } else {
      console.warn('Detected non-electron environment. Fallback to assets/config.json. Any changes are non-persistent!');
      this.http.get(environment.config).subscribe((config: Config) => {
        this.initialize(config);
      });
    }
  }

  private initialize(config: Config): void {
    this.config = config;
    this.valid = this.validate();
    if (this.valid) {
      this.httpHeaders = {
        headers: new HttpHeaders({
          'x-api-key': this.config.octoprint.accessToken,
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          Expires: '0'
        })
      };
    }
    this.initialized = true;
  }

  public getRemoteConfig(): Config {
    return this.store.get('config');
  }

  public getCurrentConfig(): Config {
    return (_.cloneDeep(this.config));
  }

  public isEqualToCurrentConfig(changedConfig: Config): boolean {
    return _.isEqual(this.config, changedConfig);
  }

  public validate(): boolean {
    return this.validator(this.config) ? true : false;
  }

  public validateGiven(config: Config): boolean {
    return this.validator(config) ? true : false;
  }

  public getErrors(): string[] {
    const errors = [];
    this.validator.errors.forEach(error => {
      if (error.keyword === 'type') {
        errors.push(`${error.dataPath} ${error.message}`);
      } else {
        errors.push(`${error.dataPath === '' ? '.' : error.dataPath} ${error.message}`);
      }
    });
    return errors;
  }

  public saveConfig(config?: Config): string {
    if (!config) {
      config = this.config;
    }
    if (window && window.process && window.process.type) {
      this.store.set('config', config);
      const configStored = this.store.get('config');
      if (this.validateGiven(configStored)) {
        return null;
      } else {
        return ('Saved config is invalid!');
      }
    } else {
      return ('Browser version doesn\'t support saving!');
    }
  }

  public updateConfig() {
    if (window && window.process && window.process.type) {
      this.update = false;
      this.initialize(this.store.get('config'));
    }
  }

  public revertConfigForInput(config: Config) {
    config.octoprint.urlSplit = {
      url: config.octoprint.url.split(':')[1].replace('//', ''),
      port: parseInt(config.octoprint.url.split(':')[2].replace('/api/', ''), 10)
    };
    return config;
  }

  public createConfigFromInput(config: Config) {
    const configOut = _.cloneDeep(config);
    configOut.octoprint.url = `http://${configOut.octoprint.urlSplit.url}:${configOut.octoprint.urlSplit.port}/api/`;
    delete configOut.octoprint.urlSplit;
    return configOut;
  }

  public isLoaded(): boolean {
    return this.config ? true : false;
  }

  public setUpdate(): void {
    this.update = true;
  }

  public getHTTPHeaders(): object {
    return this.httpHeaders;
  }

  public getURL(path: string) {
    return this.config.octoprint.url + path;
  }

  public getAPIPollingInterval(): number {
    return this.config.octodash.pollingInterval;
  }

  public getPrinterName(): string {
    return this.config.printer.name;
  }

  public getCustomActions(): Array<CustomAction> {
    return this.config.octodash.customActions;
  }

  public getXYSpeed(): number {
    return this.config.printer.xySpeed;
  }

  public getZSpeed(): number {
    return this.config.printer.zSpeed;
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public isValid(): boolean {
    return this.valid;
  }

  public isUpdate(): boolean {
    return this.update;
  }

  public isTouchscreen(): boolean {
    return this.config.octodash.touchscreen;
  }

  public getAmbientTemperatureSensorName(): number {
    return this.config.plugins.enclosure.ambientSensorID;
  }

  public getAutomaticScreenSleep(): boolean {
    return this.config.octodash.turnScreenOffWhileSleeping;
  }

  public turnOnPSUWhenExitingSleep(): boolean {
    return this.config.octodash.turnOnPSUWhenExitingSleep;
  }

  public getFilamentThickness(): number {
    return this.config.filament.thickness;
  }

  public getFilamentDensity(): number {
    return this.config.filament.density;
  }
}

export interface Config {
  octoprint: Octoprint;
  printer: Printer;
  filament: Filament;
  plugins: Plugins;
  octodash: OctoDash;
}

interface Octoprint {
  url: string;
  accessToken: string;
  urlSplit?: {
    url: string;
    port: number;
  };
}

interface Printer {
  name: string;
  xySpeed: number;
  zSpeed: number;
}

interface Filament {
  thickness: number;
  density: number;
  feedLength: number;
  feedSpeed: number;
}

interface Plugins {
  displayLayerProgress: Plugin;
  enclosure: EnclosurePlugin;
  filamentManager: Plugin;
  preheatButton: Plugin;
  printTimeGenius: Plugin;
}

interface Plugin {
  enabled: boolean;
}

interface EnclosurePlugin extends Plugin {
  ambientSensorID: number | null;
  filament1SensorID: number | null;
  filament2SensorID: number | null;
}

interface OctoDash {
  customActions: CustomAction[];
  defaultFileSorting: string;
  pollingInterval: number;
  touchscreen: boolean;
  turnScreenOffWhileSleeping: boolean;
  turnOnPSUWhenExitingSleep: boolean;
}

interface CustomAction {
  icon: string;
  command: string;
  color: string;
  confirm: boolean;
  exit: boolean;
}

const schema = {
  definitions: {},
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'http://example.com/root.json',
  type: 'object',
  required: [
    'octoprint',
    'printer',
    'filament',
    'plugins',
    'octodash'
  ],
  properties: {
    octoprint: {
      $id: '#/properties/octoprint',
      type: 'object',
      required: [
        'accessToken',
        'url'
      ],
      properties: {
        accessToken: {
          $id: '#/properties/octoprint/properties/accessToken',
          type: 'string',
          pattern: '^(.*)$'
        },
        url: {
          $id: '#/properties/octoprint/properties/url',
          type: 'string',
          pattern: '^(.*)$'
        }
      }
    },
    printer: {
      $id: '#/properties/printer',
      type: 'object',
      required: [
        'name',
        'xySpeed',
        'zSpeed'
      ],
      properties: {
        name: {
          $id: '#/properties/printer/properties/name',
          type: 'string',
          pattern: '^(.*)$'
        },
        xySpeed: {
          $id: '#/properties/printer/properties/xySpeed',
          type: 'integer'
        },
        zSpeed: {
          $id: '#/properties/printer/properties/zSpeed',
          type: 'integer'
        }
      }
    },
    filament: {
      $id: '#/properties/filament',
      type: 'object',
      required: [
        'density',
        'thickness',
        'feedLength',
        'feedSpeed'
      ],
      properties: {
        density: {
          $id: '#/properties/filament/properties/density',
          type: 'integer'
        },
        thickness: {
          $id: '#/properties/filament/properties/thickness',
          type: 'integer'
        },
        feedLength: {
          $id: '#/properties/filament/properties/feedLength',
          type: 'integer'
        },
        feedSpeed: {
          $id: '#/properties/filament/properties/feedSpeed',
          type: 'integer'
        }
      }
    },
    plugins: {
      $id: '#/properties/plugins',
      type: 'object',
      required: [
        'displayLayerProgress',
        'enclosure',
        'filamentManager',
        'preheatButton',
        'printTimeGenius'
      ],
      properties: {
        displayLayerProgress: {
          $id: '#/properties/plugins/properties/displayLayerProgress',
          type: 'object',
          required: [
            'enabled'
          ],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/displayLayerProgress/properties/enabled',
              type: 'boolean'
            }
          }
        },
        enclosure: {
          $id: '#/properties/plugins/properties/enclosure',
          type: 'object',
          required: [
            'enabled',
            'ambientSensorID',
            'filament1SensorID',
            'filament2SensorID'
          ],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/enclosure/properties/enabled',
              type: 'boolean'
            },
            ambientSensorID: {
              $id: '#/properties/plugins/properties/enclosure/properties/ambientSensorID',
              type: ['number', 'null'],
              pattern: '^(.*)$'
            },
            filament1SensorID: {
              $id: '#/properties/plugins/properties/enclosure/properties/filament1SensorID',
              type: ['number', 'null'],
              pattern: '^(.*)$'
            },
            filament2SensorID: {
              $id: '#/properties/plugins/properties/enclosure/properties/filament2SensorID',
              type: ['number', 'null'],
              pattern: '^(.*)$'
            }
          }
        },
        filamentManager: {
          $id: '#/properties/plugins/properties/filamentManager',
          type: 'object',
          required: [
            'enabled'
          ],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/filamentManager/properties/enabled',
              type: 'boolean'
            }
          }
        },
        preheatButton: {
          $id: '#/properties/plugins/properties/preheatButton',
          type: 'object',
          required: [
            'enabled'
          ],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/preheatButton/properties/enabled',
              type: 'boolean'
            }
          }
        },
        printTimeGenius: {
          $id: '#/properties/plugins/properties/printTimeGenius',
          type: 'object',
          required: [
            'enabled'
          ],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/printTimeGenius/properties/enabled',
              type: 'boolean'
            }
          }
        }
      }
    },
    octodash: {
      $id: '#/properties/octodash',
      type: 'object',
      required: [
        'customActions',
        'defaultFileSorting',
        'pollingInterval',
        'touchscreen',
        'turnScreenOffWhileSleeping',
        'turnOnPSUWhenExitingSleep'
      ],
      properties: {
        customActions: {
          $id: '#/properties/octodash/properties/customActions',
          type: 'array',
          items: {
            $id: '#/properties/octodash/properties/customActions/items',
            type: 'object',
            required: [
              'icon',
              'command',
              'color',
              'confirm',
              'exit'
            ],
            properties: {
              icon: {
                $id: '#/properties/octodash/properties/customActions/items/properties/icon',
                type: 'string',
                pattern: '^(.*)$'
              },
              command: {
                $id: '#/properties/octodash/properties/customActions/items/properties/command',
                type: 'string',
                pattern: '^(.*)$'
              },
              color: {
                $id: '#/properties/octodash/properties/customActions/items/properties/color',
                type: 'string',
                pattern: '^(.*)$'
              },
              confirm: {
                $id: '#/properties/octodash/properties/customActions/items/properties/confirm',
                type: 'boolean'
              },
              exit: {
                $id: '#/properties/octodash/properties/customActions/items/properties/exit',
                type: 'boolean'
              }
            }
          }
        },
        defaultFileSorting: {
          $id: '#/properties/octodash/properties/defaultFileSorting',
          type: 'string',
          pattern: '^(.*)$'
        },
        pollingInterval: {
          $id: '#/properties/octodash/properties/pollingInterval',
          type: 'integer'
        },
        touchscreen: {
          $id: '#/properties/octodash/properties/touchscreen',
          type: 'boolean'
        },
        turnScreenOffWhileSleeping: {
          $id: '#/properties/octodash/properties/turnScreenOffWhileSleeping',
          type: 'boolean'
        },
        turnOnPSUWhenExitingSleep: {
          $id: '#/properties/octodash/properties/turnOnPSUWhenExitingSleep',
          type: 'boolean'
        }
      }
    }
  }
};
