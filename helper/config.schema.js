const configSchema = {
  definitions: {},
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: 'http://example.com/root.json',
  type: 'object',
  required: ['octoprint', 'printer', 'filament', 'plugins', 'octodash'],
  properties: {
    octoprint: {
      $id: '#/properties/octoprint',
      type: 'object',
      required: ['accessToken', 'url'],
      properties: {
        accessToken: {
          $id: '#/properties/octoprint/properties/accessToken',
          type: 'string',
          pattern: '^(.*)$',
        },
        url: {
          $id: '#/properties/octoprint/properties/url',
          type: 'string',
          pattern: '^(.*)$',
        },
      },
    },
    printer: {
      $id: '#/properties/printer',
      type: 'object',
      required: ['name', 'xySpeed', 'zSpeed', 'disableExtruderGCode', 'zBabystepGCode', 'defaultTemperatureFanSpeed'],
      properties: {
        name: {
          $id: '#/properties/printer/properties/name',
          type: 'string',
          pattern: '^(.*)$',
        },
        xySpeed: {
          $id: '#/properties/printer/properties/xySpeed',
          type: 'integer',
        },
        zSpeed: {
          $id: '#/properties/printer/properties/zSpeed',
          type: 'integer',
        },
        disableExtruderGCode: {
          $id: '#/properties/printer/properties/disableExtruderGCode',
          type: 'string',
          pattern: '^(.*)$',
        },
        zBabystepGCode: {
          $id: '#/properties/printer/properties/zBabystepGCode',
          type: 'string',
          pattern: '^(.*)$',
        },
        defaultTemperatureFanSpeed: {
          $id: '#/properties/printer/properties/defaultTemperatureFanSpeed',
          type: 'object',
          required: ['hotend', 'heatbed', 'fan'],
          properties: {
            hotend: {
              $id: '#/properties/printer/properties/defaultTemperatureFanSpeed/hotend',
              type: 'integer',
            },
            heatbed: {
              $id: '#/properties/printer/properties/defaultTemperatureFanSpeed/heatbed',
              type: 'integer',
            },
            fan: {
              $id: '#/properties/printer/properties/defaultTemperatureFanSpeed/fan',
              type: 'integer',
            },
          },
        },
      },
    },
    filament: {
      $id: '#/properties/filament',
      type: 'object',
      required: ['density', 'thickness', 'feedLength', 'feedSpeed', 'feedSpeedSlow', 'purgeDistance', 'useM600'],
      properties: {
        density: {
          $id: '#/properties/filament/properties/density',
          type: 'number',
        },
        thickness: {
          $id: '#/properties/filament/properties/thickness',
          type: 'number',
        },
        feedLength: {
          $id: '#/properties/filament/properties/feedLength',
          type: 'integer',
        },
        feedSpeed: {
          $id: '#/properties/filament/properties/feedSpeed',
          type: 'number',
        },
        feedSpeedSlow: {
          $id: '#/properties/filament/properties/feedSpeedSlow',
          type: 'number',
        },
        purgeDistance: {
          $id: '#/properties/filament/properties/purgeDistance',
          type: 'integer',
        },
        useM600: {
          $id: '#/properties/filament/properties/useM600',
          type: 'boolean',
        },
      },
    },
    plugins: {
      $id: '#/properties/plugins',
      type: 'object',
      required: [
        'displayLayerProgress',
        'enclosure',
        'filamentManager',
        'spoolManager',
        'preheatButton',
        'printTimeGenius',
        'psuControl',
        'ophom',
        'tpLinkSmartPlug',
        'tasmota',
        'tasmotaMqtt',
        'wemo',
      ],
      properties: {
        displayLayerProgress: {
          $id: '#/properties/plugins/properties/displayLayerProgress',
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/displayLayerProgress/properties/enabled',
              type: 'boolean',
            },
          },
        },
        enclosure: {
          $id: '#/properties/plugins/properties/enclosure',
          type: 'object',
          required: ['enabled', 'ambientSensorID', 'filament1SensorID', 'filament2SensorID'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/enclosure/properties/enabled',
              type: 'boolean',
            },
            ambientSensorID: {
              $id: '#/properties/plugins/properties/enclosure/properties/ambientSensorID',
              type: ['number', 'null'],
            },
            filament1SensorID: {
              $id: '#/properties/plugins/properties/enclosure/properties/filament1SensorID',
              type: ['number', 'null'],
            },
            filament2SensorID: {
              $id: '#/properties/plugins/properties/enclosure/properties/filament2SensorID',
              type: ['number', 'null'],
            },
          },
        },
        filamentManager: {
          $id: '#/properties/plugins/properties/filamentManager',
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/filamentManager/properties/enabled',
              type: 'boolean',
            },
          },
        },
        spoolManager: {
          $id: '#/properties/plugins/properties/spoolManager',
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/spoolManager/properties/enabled',
              type: 'boolean',
            },
          },
        },
        preheatButton: {
          $id: '#/properties/plugins/properties/preheatButton',
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/preheatButton/properties/enabled',
              type: 'boolean',
            },
          },
        },
        printTimeGenius: {
          $id: '#/properties/plugins/properties/printTimeGenius',
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/printTimeGenius/properties/enabled',
              type: 'boolean',
            },
          },
        },
        psuControl: {
          $id: '#/properties/plugins/properties/psuControl',
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/psuControl/properties/enabled',
              type: 'boolean',
            },
          },
        },
        ophom: {
          $id: '#/properties/plugins/properties/ophom',
          type: 'object',
          required: ['enabled'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/ophom/properties/enabled',
              type: 'boolean',
            },
          },
        },
        tpLinkSmartPlug: {
          $id: '#/properties/plugins/properties/tpLinkSmartPlug',
          type: 'object',
          required: ['enabled', 'smartPlugIP'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/tpLinkSmartPlug/properties/enabled',
              type: 'boolean',
            },
            smartPlugIP: {
              $id: '#/properties/plugins/properties/tpLinkSmartPlug/properties/smartPlugIP',
              type: 'string',
            },
          },
        },
        tasmota: {
          $id: '#/properties/plugins/properties/tasmota',
          type: 'object',
          required: ['enabled', 'ip', 'index'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/tasmota/properties/enabled',
              type: 'boolean',
            },
            ip: {
              $id: '#/properties/plugins/properties/tasmota/properties/ip',
              type: 'string',
            },
            index: {
              $id: '#/properties/plugins/properties/tasmota/properties/index',
              type: ['number', 'null'],
            },
          },
        },
        tasmotaMqtt: {
          $id: '#/properties/plugins/properties/tasmotaMqtt',
          type: 'object',
          required: ['enabled', 'topic', 'relayNumber'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/tasmotaMqtt/properties/enabled',
              type: 'boolean',
            },
            topic: {
              $id: '#/properties/plugins/properties/tasmotaMqtt/properties/topic',
              type: 'string',
            },
            relayNumber: {
              $id: '#/properties/plugins/properties/tasmotaMqtt/properties/relayNumber',
              type: ['number', 'null'],
            },
          },
        },
        wemo: {
          $id: '#/properties/plugins/properties/wemo',
          type: 'object',
          required: ['enabled', 'ip'],
          properties: {
            enabled: {
              $id: '#/properties/plugins/properties/ip/properties/enabled',
              type: 'boolean',
            },
            ip: {
              $id: '#/properties/plugins/properties/wemo/properties/ip',
              type: 'string',
            },
            port: {
              $id: '#/properties/plugins/properties/wemo/properties/port',
              type: 'number',
            },
          },
        },
      },
    },
    octodash: {
      $id: '#/properties/octodash',
      type: 'object',
      required: [
        'customActions',
        'fileSorting',
        'invertAxisControl',
        'pollingInterval',
        'touchscreen',
        'turnScreenOffWhileSleeping',
        'turnOnPrinterWhenExitingSleep',
        'preferPreviewWhilePrinting',
        'previewProgressCircle',
        'screenSleepCommand',
        'screenWakeupCommand',
        'showExtruderControl',
        'showNotificationCenterIcon',
      ],
      properties: {
        customActions: {
          $id: '#/properties/octodash/properties/customActions',
          type: 'array',
          items: {
            $id: '#/properties/octodash/properties/customActions/items',
            type: 'object',
            required: ['icon', 'command', 'color', 'confirm', 'exit'],
            properties: {
              icon: {
                $id: '#/properties/octodash/properties/customActions/items/properties/icon',
                type: 'string',
                pattern: '^(.*)$',
              },
              command: {
                $id: '#/properties/octodash/properties/customActions/items/properties/command',
                type: 'string',
                pattern: '^(.*)$',
              },
              color: {
                $id: '#/properties/octodash/properties/customActions/items/properties/color',
                type: 'string',
                pattern: '^(.*)$',
              },
              confirm: {
                $id: '#/properties/octodash/properties/customActions/items/properties/confirm',
                type: 'boolean',
              },
              exit: {
                $id: '#/properties/octodash/properties/customActions/items/properties/exit',
                type: 'boolean',
              },
            },
          },
        },
        fileSorting: {
          $id: '#/properties/octodash/properties/fileSorting',
          type: 'object',
          required: ['attribute', 'order'],
          properties: {
            attribute: {
              $id: '#/properties/octodash/properties/fileSorting/properties/attribute',
              type: 'string',
              pattern: '^(name|date|size)$',
            },
            order: {
              $id: '#/properties/octodash/properties/fileSorting/properties/order',
              type: 'string',
              pattern: '^(asc|dsc)$',
            },
          },
        },
        invertAxisControl: {
          $id: '#/properties/octodash/properties/invertAxisControl',
          type: 'object',
          required: ['x', 'y', 'z'],
          properties: {
            x: {
              $id: '#/properties/octodash/properties/invertAxisControl/properties/x',
              type: 'boolean',
            },
            y: {
              $id: '#/properties/octodash/properties/invertAxisControl/properties/y',
              type: 'boolean',
            },
            z: {
              $id: '#/properties/octodash/properties/invertAxisControl/properties/z',
              type: 'boolean',
            },
          },
        },
        pollingInterval: {
          $id: '#/properties/octodash/properties/pollingInterval',
          type: 'integer',
        },
        touchscreen: {
          $id: '#/properties/octodash/properties/touchscreen',
          type: 'boolean',
        },
        turnScreenOffWhileSleeping: {
          $id: '#/properties/octodash/properties/turnScreenOffWhileSleeping',
          type: 'boolean',
        },
        turnOnPrinterWhenExitingSleep: {
          $id: '#/properties/octodash/properties/turnOnPrinterWhenExitingSleep',
          type: 'boolean',
        },
        preferPreviewWhilePrinting: {
          $id: '#/properties/octodash/properties/preferPreviewWhilePrinting',
          type: 'boolean',
        },
        previewProgressCircle: {
          $id: '#/properties/octodash/properties/previewProgressCircle',
          type: 'boolean',
        },
        screenSleepCommand: {
          $id: '#/properties/octodash/properties/screenSleepCommand',
          type: 'string',
          pattern: '^(.*)$',
        },
        screenWakeupCommand: {
          $id: '#/properties/octodash/properties/screenWakeupCommand',
          type: 'string',
          pattern: '^(.*)$',
        },
        showExtruderControl: {
          $id: '#/properties/octodash/properties/showExtruderControl',
          type: 'boolean',
        },
        showNotificationCenterIcon: {
          $id: '#/properties/octodash/properties/showNotificationCenterIcon',
          type: 'boolean',
        },
      },
    },
  },
};

module.exports = configSchema;
