import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ConfigService } from '../../config/config.service';
import { NotificationType, PSUState, TemperatureReading } from '../../model';
import {
  EnclosureColorBody,
  EnclosureOutputBody,
  EnclosurePluginAPI,
  EnclosurePWMBody,
  OphomPlugStatus,
  PSUControlCommand,
  TasmotaCommand,
  TasmotaMqttCommand,
  TPLinkCommand,
  WemoCommand,
} from '../../model/octoprint';
import { NotificationService } from '../../notification/notification.service';
import { EnclosureService } from './enclosure.service';

@Injectable()
export class EnclosureOctoprintService implements EnclosureService {
  public constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
    private http: HttpClient,
  ) {}
  private currentPSUState = PSUState.ON;

  getEnclosureTemperature(): Observable<TemperatureReading> {
    return this.http
      .get(
        this.configService.getApiURL(
          'plugin/enclosure/inputs/' + this.configService.getAmbientTemperatureSensorName(),
          false,
        ),
        this.configService.getHTTPHeaders(),
      )
      .pipe(
        map((data: EnclosurePluginAPI) => {
          return {
            temperature: data.temp_sensor_temp,
            humidity: data.temp_sensor_humidity,
            unit: data.use_fahrenheit ? '°F' : '°C',
          } as TemperatureReading;
        }),
      );
  }

  public setLEDColor(identifier: number, red: number, green: number, blue: number): void {
    const colorBody: EnclosureColorBody = {
      red,
      green,
      blue,
    };
    this.http
      .patch(
        this.configService.getApiURL('plugin/enclosure/neopixel/' + identifier, false),
        colorBody,
        this.configService.getHTTPHeaders(),
      )
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-set-color:Can't set LED color!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  public setOutput(identifier: number, status: boolean): void {
    console.log(identifier, status);

    const outputBody: EnclosureOutputBody = {
      status,
    };
    this.http
      .patch(
        this.configService.getApiURL('plugin/enclosure/outputs/' + identifier, false),
        outputBody,
        this.configService.getHTTPHeaders(),
      )
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-set-output:Can't set output!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  public setOutputPWM(identifier: number, dutyCycle: number): void {
    console.log(identifier, dutyCycle);

    const pwmBody: EnclosurePWMBody = {
      /* eslint-disable camelcase */
      duty_cycle: dutyCycle,
    };
    this.http
      .patch(
        this.configService.getApiURL('plugin/enclosure/pwm/' + identifier, false),
        pwmBody,
        this.configService.getHTTPHeaders(),
      )
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-set-output:Can't set output!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  public runEnclosureShell(identifier: number): void {
    this.http
      .post(
        this.configService.getApiURL('plugin/enclosure/shell/' + identifier, false),
        this.configService.getHTTPHeaders(),
      )
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-run-enclosure-shell:Can't run enclosure shell!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  public setPSUState(state: PSUState): void {
    if (this.configService.usePSUControl()) {
      this.setPSUStatePSUControl(state);
    } else if (this.configService.useOphomControl()) {
      this.setPSUStateOphomControl(state);
    } else if (this.configService.useTpLinkSmartPlug()) {
      this.setPSUStateTPLink(state);
    } else if (this.configService.useTasmota()) {
      this.setPSUStateTasmota(state);
    } else if (this.configService.useTasmotaMqtt()) {
      this.setPSUStateTasmotaMqtt(state);
    } else if (this.configService.useWemo()) {
      this.setPSUStateWemo(state);
    } else {
      this.notificationService.setNotification({
        heading: $localize`:@@error-psu-state:Can't change PSU State!`,
        text: $localize`:@@error-psu-provider:No provider for PSU Control is configured.`,
        type: NotificationType.WARN,
        time: new Date(),
      });
    }
    this.currentPSUState = state;
  }

  private setPSUStatePSUControl(state: PSUState) {
    const psuControlPayload: PSUControlCommand = {
      command: state === PSUState.ON ? 'turnPSUOn' : 'turnPSUOff',
    };

    this.http
      .post(this.configService.getApiURL('plugin/psucontrol'), psuControlPayload, this.configService.getHTTPHeaders())
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-send-psu-gcode:Can't send GCode!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  private setPSUStateOphomControl(state: PSUState) {
    this.http
      .get(this.configService.getApiURL('plugin/ophom?action=checkplugstatus'), this.configService.getHTTPHeaders())
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-send-ophom-gcode:Can't update Ophom Plug!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
        map((data: OphomPlugStatus) => {
          if (data.reponse == 1) {
            if (state == PSUState.OFF) {
              this.toggleOphom();
            }
          } else {
            if (state == PSUState.ON) {
              this.toggleOphom();
            }
          }
        }),
      )
      .subscribe();
  }

  private toggleOphom() {
    this.http
      .get(this.configService.getApiURL('plugin/ophom?action=toggle'), this.configService.getHTTPHeaders())
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-send-psu-gcode:Can't send GCode!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  private setPSUStateTPLink(state: PSUState) {
    const tpLinkPayload: TPLinkCommand = {
      command: state === PSUState.ON ? 'turnOn' : 'turnOff',
      ip: this.configService.getSmartPlugIP(),
    };

    this.http
      .post(this.configService.getApiURL('plugin/tplinksmartplug'), tpLinkPayload, this.configService.getHTTPHeaders())
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-send-smartplug-gcode:Can't send GCode!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  private setPSUStateTasmota(state: PSUState) {
    const tasmotaPayload: TasmotaCommand = {
      command: state === PSUState.ON ? 'turnOn' : 'turnOff',
      ip: this.configService.getTasmotaIP(),
      idx: this.configService.getTasmotaIndex(),
    };

    this.http
      .post(this.configService.getApiURL('plugin/tasmota'), tasmotaPayload, this.configService.getHTTPHeaders())
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-send-tasmota-plug:Can't update Tasmota!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  private setPSUStateTasmotaMqtt(state: PSUState) {
    const tasmotaMqttPayload: TasmotaMqttCommand = {
      command: state === PSUState.ON ? 'turnOn' : 'turnOff',
      topic: this.configService.getTasmotaMqttTopic(),
      relayN: this.configService.getTasmotaMqttRelayNumber(),
    };

    this.http
      .post(
        this.configService.getApiURL('plugin/tasmota_mqtt'),
        tasmotaMqttPayload,
        this.configService.getHTTPHeaders(),
      )
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-send-tasmota-plug-mqtt:Can't update Tasmota MQTT!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  private setPSUStateWemo(state: PSUState) {
    const wemoPayload: WemoCommand = {
      command: state === PSUState.ON ? 'turnOn' : 'turnOff',
      ip: this.configService.getWemoIP(),
    };

    this.http
      .post(this.configService.getApiURL('plugin/wemoswitch'), wemoPayload, this.configService.getHTTPHeaders())
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-send-wemo-plug:Can't update Wemo!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  togglePSU(): void {
    this.currentPSUState === PSUState.ON ? this.setPSUState(PSUState.OFF) : this.setPSUState(PSUState.ON);
  }
}
