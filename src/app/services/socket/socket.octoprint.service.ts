import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import _ from 'lodash-es';
import { Observable, of, ReplaySubject, Subject } from 'rxjs';
import { catchError, pluck, startWith } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

import { ConfigService } from '../../config/config.service';
import { ConversionService } from '../../conversion.service';
import {
  JobStatus,
  Notification,
  NotificationType,
  PrinterEvent,
  PrinterNotification,
  PrinterState,
  PrinterStatus,
  SocketAuth,
} from '../../model';
import {
  CompanionData,
  DisplayLayerProgressData,
  OctoprintFilament,
  OctoprintPluginMessage,
  OctoprintSocketCurrent,
  OctoprintSocketEvent,
} from '../../model/octoprint';
import { NotificationService } from '../../notification/notification.service';
import { SystemService } from '../system/system.service';
import { SocketService } from './socket.service';

@Injectable()
export class OctoPrintSocketService implements SocketService {
  private fastInterval = 0;
  private socketDeadTimeout: ReturnType<typeof setTimeout>;
  private socket: WebSocketSubject<unknown>;

  private printerStatusSubject: Subject<PrinterStatus>;
  private jobStatusSubject: Subject<JobStatus>;
  private eventSubject: Subject<PrinterEvent>;
  private statusTextSubject: Subject<string>;

  private printerStatus: PrinterStatus;
  private jobStatus: JobStatus;
  private lastState: PrinterEvent;

  public constructor(
    private configService: ConfigService,
    private systemService: SystemService,
    private conversionService: ConversionService,
    private notificationService: NotificationService,
    private http: HttpClient,
  ) {
    this.printerStatusSubject = new ReplaySubject<PrinterStatus>(1);
    this.jobStatusSubject = new Subject<JobStatus>();
    this.eventSubject = new ReplaySubject<PrinterEvent>(5);
    this.statusTextSubject = new ReplaySubject<string>(1);
  }

  //==== SETUP & AUTH ====//

  public connect(): Promise<void> {
    this.initPrinterStatus();
    this.initJobStatus();
    this.lastState = PrinterEvent.UNKNOWN;

    return new Promise(resolve => {
      this.tryConnect(resolve);
    });
  }

  private initPrinterStatus(): void {
    this.printerStatus = {
      status: PrinterState.connecting,
      bed: {
        current: 0,
        set: 0,
        unit: '°C',
      },
      tool0: {
        current: 0,
        set: 0,
        unit: '°C',
      },
      fanSpeed:
        this.configService.isDisplayLayerProgressEnabled() || this.configService.isCompanionPluginEnabled() ? 0 : -1,
    } as PrinterStatus;
    this.printerStatusSubject.next(this.printerStatus);
  }

  private initJobStatus(): void {
    this.jobStatus = {
      file: null,
      fullPath: null,
      progress: 0,
      zHeight: this.configService.isDisplayLayerProgressEnabled() ? { current: 0, total: -1 } : 0,
      filamentAmount: 0,
      timePrinted: null,
      timeLeft: {
        value: '---',
        unit: null,
      },
      estimatedPrintTime: null,
      estimatedEndTime: null,
    } as JobStatus;
  }

  private tryConnect(resolve: () => void): void {
    this.systemService.getSessionKey().subscribe({
      next: (socketAuth: SocketAuth) => {
        this.http.get(this.configService.getApiURL('connection'), this.configService.getHTTPHeaders()).subscribe({
          next: () => {
            this.connectSocket();
            this.setupSocket(resolve);
            this.authenticateSocket(socketAuth);
          },
          error: (err: HttpErrorResponse) => {
            if (err.status === 403) {
              this.notificationService.setNotification({
                heading: $localize`:@@http-403-heading:HTTP Error 403 - FORBIDDEN`,
                text: $localize`:@@http-403-text:This most likely means that your API Key is invalid. Please update the API Key and restart your system.`,
                type: NotificationType.ERROR,
                time: new Date(),
                sticky: true,
              } as Notification);
            } else {
              this.notificationService.setNotification({
                heading: $localize`:@@http-unknown-heading:Unknown HTTP Error`,
                text: err.message,
                type: NotificationType.ERROR,
                time: new Date(),
                sticky: true,
              } as Notification);
            }
          },
        });
      },
      error: () => {
        setTimeout(this.tryConnect.bind(this), this.fastInterval < 6 ? 5000 : 15000, resolve);
        this.fastInterval += 1;
      },
    });
  }

  private connectSocket() {
    const url = `${this.configService.getApiURL('sockjs/websocket', false).replace(/^http/, 'ws')}`;
    if (!this.socket) {
      this.socket = webSocket(url);
    }
  }

  private authenticateSocket(socketAuth: SocketAuth) {
    const payload = {
      auth: `${socketAuth.user}:${socketAuth.session}`,
    };
    this.socket.next(payload);
  }

  private handlePluginMessage(pluginMessage: OctoprintPluginMessage) {
    const plugins = [
      {
        check: (plugin: string) =>
          plugin === 'DisplayLayerProgress-websocket-payload' && this.configService.isDisplayLayerProgressEnabled(),
        handler: (message: unknown) => {
          this.extractFanSpeed(message as DisplayLayerProgressData);
          this.extractLayerHeight(message as DisplayLayerProgressData);
        },
      },
      {
        check: (plugin: string) => ['action_command_prompt', 'action_command_notification'].includes(plugin),
        handler: (message: unknown) => this.handlePrinterNotification(message as PrinterNotification),
      },
      {
        check: (plugin: string) => plugin === 'octodash' && this.configService.isCompanionPluginEnabled(),
        handler: (message: unknown) => this.extractFanSpeed(message as CompanionData),
      },
    ];

    plugins.forEach(plugin => plugin.check(pluginMessage.plugin.plugin) && plugin.handler(pluginMessage.plugin.data));
  }

  private setupSocket(resolve: () => void) {
    this.socket.subscribe({
      next: message => {
        clearTimeout(this.socketDeadTimeout);
        this.socketDeadTimeout = setTimeout(() => {
          this.printerStatus.status = PrinterState.socketDead;
          this.printerStatusSubject.next(this.printerStatus);
        }, 30000);
        if (Object.hasOwnProperty.bind(message)('current')) {
          this.extractPrinterStatus(message as OctoprintSocketCurrent);
          this.extractJobStatus(message as OctoprintSocketCurrent);
        } else if (Object.hasOwnProperty.bind(message)('event')) {
          this.extractPrinterEvent(message as OctoprintSocketEvent);
        } else if (Object.hasOwnProperty.bind(message)('plugin')) {
          this.handlePluginMessage(message as OctoprintPluginMessage);
        } else if (Object.hasOwnProperty.bind(message)('reauthRequired')) {
          this.systemService.getSessionKey().subscribe(socketAuth => this.authenticateSocket(socketAuth));
        } else if (Object.hasOwnProperty.bind(message)('connected')) {
          resolve();
          this.checkPrinterConnection();
        }
      },
      error: error => {
        if (error['type'] === 'close') {
          this.printerStatus.status = PrinterState.reconnecting;
          this.printerStatusSubject.next(this.printerStatus);
          this.tryConnect(() => null);
        } else {
          console.error(error);
        }
      },
    });
  }

  private checkPrinterConnection() {
    this.http
      .get(this.configService.getApiURL('connection'), this.configService.getHTTPHeaders())
      .pipe(pluck('current'), pluck('state'))
      .subscribe((state: string) => {
        if (state === 'Closed' || state === 'Error') {
          this.eventSubject.next(PrinterEvent.CLOSED);
        }
      });
  }

  //==== Printer Status ====//

  public extractPrinterStatus(message: OctoprintSocketCurrent): void {
    if (message.current.temps[0]) {
      this.printerStatus.bed = {
        current: Math.round(message?.current?.temps[0]?.bed?.actual),
        set: Math.round(message?.current?.temps[0]?.bed?.target),
        unit: '°C',
      };
      this.printerStatus.tool0 = {
        current: Math.round(message?.current?.temps[0]?.tool0?.actual),
        set: Math.round(message?.current?.temps[0]?.tool0?.target),
        unit: '°C',
      };
    }
    this.printerStatus.status = PrinterState[message.current.state.text.toLowerCase()];

    if (this.printerStatus.status === PrinterState.printing && this.lastState !== PrinterEvent.PRINTING) {
      this.extractPrinterEvent({
        event: {
          type: 'PrintStarted',
          payload: null,
        },
      } as OctoprintSocketEvent);
    } else if (this.printerStatus.status === PrinterState.paused && this.lastState !== PrinterEvent.PAUSED) {
      this.extractPrinterEvent({
        event: {
          type: 'PrintPaused',
          payload: null,
        },
      } as OctoprintSocketEvent);
    }

    this.printerStatusSubject.next(this.printerStatus);
  }

  public extractFanSpeed(message: DisplayLayerProgressData | CompanionData): void {
    if (typeof message.fanspeed === 'object') {
      this.printerStatus.fanSpeed = Number(Math.round(message.fanspeed['1']));
    } else {
      this.printerStatus.fanSpeed =
        message.fanspeed === 'Off'
          ? 0
          : message.fanspeed === '-'
          ? 0
          : Number(message.fanspeed.replace('%', '').trim());
    }
  }

  //==== Job Status ====//

  public extractJobStatus(message: OctoprintSocketCurrent): void {
    const file = message?.current?.job?.file?.display?.replace('.gcode', '').replace('.ufp', '');
    if (this.jobStatus.file !== file) {
      this.initJobStatus();
    }

    this.jobStatus.file = file;
    this.jobStatus.fullPath = '/' + message?.current?.job?.file?.origin + '/' + message?.current?.job?.file?.path;
    this.jobStatus.progress = Math.round(message?.current?.progress?.completion);
    this.jobStatus.timePrinted = {
      value: this.conversionService.convertSecondsToHours(message.current.progress.printTime),
      unit: $localize`:@@unit-h-1:h`,
    };

    if (message.current.job.filament) {
      this.jobStatus.filamentAmount = this.getTotalFilamentWeight(message.current.job.filament);
    }

    if (message.current.progress.printTimeLeft) {
      this.jobStatus.timeLeft = {
        value: this.conversionService.convertSecondsToHours(message.current.progress.printTimeLeft),
        unit: $localize`:@@unit-h-2:h`,
      };
      this.jobStatus.estimatedEndTime = this.calculateEndTime(message.current.progress.printTimeLeft);
    }

    if (message.current.job.estimatedPrintTime) {
      this.jobStatus.estimatedPrintTime = {
        value: this.conversionService.convertSecondsToHours(message.current.job.estimatedPrintTime),
        unit: $localize`:@@unit-h-3:h`,
      };
    }

    if (!this.configService.isDisplayLayerProgressEnabled() && message.current.currentZ) {
      this.jobStatus.zHeight = message.current.currentZ;
    }

    this.jobStatusSubject.next(this.jobStatus);
  }

  private getTotalFilamentWeight(filament: OctoprintFilament) {
    let filamentLength = 0;
    _.forEach(filament, (tool): void => {
      filamentLength += tool?.length;
    });
    return this.conversionService.convertFilamentLengthToWeight(filamentLength);
  }

  private calculateEndTime(printTimeLeft: number) {
    const date = new Date();
    date.setSeconds(date.getSeconds() + printTimeLeft);
    return `${('0' + date.getHours()).slice(-2)}:${('0' + date.getMinutes()).slice(-2)}`;
  }

  public extractLayerHeight(message: DisplayLayerProgressData): void {
    this.jobStatus.zHeight = {
      current: message.currentLayer === '-' ? 0 : Number(message.currentLayer),
      total: message.totalLayer === '-' ? 0 : Number(message.totalLayer),
    };
  }

  //==== Event ====//

  public extractPrinterEvent(state: OctoprintSocketEvent): void {
    let newState: PrinterEvent;

    switch (state.event.type) {
      case 'PrintStarted':
      case 'PrintResumed':
        newState = PrinterEvent.PRINTING;
        break;
      case 'PrintPaused':
        newState = PrinterEvent.PAUSED;
        break;
      case 'PrintFailed':
      case 'PrintDone':
      case 'PrintCancelled':
        newState = PrinterEvent.IDLE;
        break;
      case 'Connected':
        newState = PrinterEvent.CONNECTED;
        break;
      case 'Disconnected':
        newState = PrinterEvent.CLOSED;
        break;
      case 'Error':
        newState = PrinterEvent.CLOSED;
        if (state.event.payload) {
          this.notificationService.setNotification({
            heading: $localize`:@@printer-error:Printer error`,
            text: state.event.payload.error,
            type: NotificationType.ERROR,
            time: new Date(),
            sticky: true,
          } as Notification);
        }
        break;
      default:
        break;
    }

    if (newState !== undefined) {
      this.lastState = newState;
      this.eventSubject.next(newState);
    }
  }

  //==== Notifications ====//

  private handlePrinterNotification(notification: PrinterNotification) {
    if (Object.keys(notification).length > 0) {
      if (notification.action === 'close') {
        this.notificationService.closeNotification();
      } else if (notification.choices?.length > 0) {
        this.notificationService.setNotification({
          heading: $localize`:@@action-required:Action required`,
          text: notification.text ?? notification.message,
          type: NotificationType.PROMPT,
          time: new Date(),
          choices: notification.choices,
          callback: this.callbackFunction.bind(this),
          sticky: true,
        } as Notification);
      } else if (notification.text || notification.message) {
        console.log(notification.text ?? notification.message);
        this.statusTextSubject.next(notification.text ?? notification.message);
      }
    }
  }

  private callbackFunction(index: number) {
    this.http
      .post(
        this.configService.getApiURL('plugin/action_command_prompt'),
        { command: 'select', choice: index },
        this.configService.getHTTPHeaders(),
      )
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-answer-prompt:Can't answer prompt!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(null);
        }),
      )
      .subscribe();
  }

  //==== Subscribables ====//

  public getPrinterStatusSubscribable(): Observable<PrinterStatus> {
    return this.printerStatusSubject.pipe(startWith(this.printerStatus));
  }

  public getJobStatusSubscribable(): Observable<JobStatus> {
    return this.jobStatusSubject.pipe(startWith(this.jobStatus));
  }

  public getEventSubscribable(): Observable<PrinterEvent> {
    return this.eventSubject;
  }

  public getPrinterStatusText(): Observable<string> {
    return this.statusTextSubject;
  }
}
