import { HttpHeaders } from '@angular/common/http';
import { Injectable, NgZone } from '@angular/core';
import _ from 'lodash-es';

import { ElectronService } from '../electron.service';
import { NotificationType } from '../model';
import { NotificationService } from '../notification/notification.service';
import { Config, CustomAction, HttpHeader, URLSplit } from './config.model';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: Config;
  private valid: boolean;
  private errors: string[];
  private update = false;
  private initialized = false;

  private httpHeaders: HttpHeader;

  public constructor(
    private notificationService: NotificationService,
    private electronService: ElectronService,
    private zone: NgZone,
  ) {
    this.electronService.on('configRead', (_, config: Config) => this.initialize(config));
    this.electronService.on('configSaved', (_, config: Config) => this.initialize(config));
    this.electronService.on('configError', (_, error: string) => {
      this.notificationService.setNotification({
        heading: error,
        text: $localize`:@@error-restart:Please restart your system. If the issue persists open an issue on GitHub.`,
        type: NotificationType.ERROR,
        time: new Date(),
        sticky: true,
      });
    });

    this.electronService.on('configPass', () => {
      this.zone.run(() => {
        this.valid = true;
        this.generateHttpHeaders();
        this.initialized = true;
      });
    });
    this.electronService.on('configFail', (_, errors) => {
      this.zone.run(() => {
        this.valid = false;
        this.errors = errors;
        console.error(errors);
        this.initialized = true;
      });
    });

    this.electronService.send('readConfig');
  }

  private initialize(config: Config): void {
    this.config = config;
    this.electronService.send('checkConfig', config);
  }

  public generateHttpHeaders(): void {
    this.httpHeaders = {
      headers: new HttpHeaders({
        'x-api-key': this.config.octoprint.accessToken,
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
        Expires: '0',
      }),
    };
  }

  public getCurrentConfig(): Config {
    return _.cloneDeep(this.config);
  }

  public isEqualToCurrentConfig(changedConfig: Config): boolean {
    return _.isEqual(this.config, changedConfig);
  }

  public getErrors(): string[] {
    return this.errors;
  }

  public saveConfig(config: Config): void {
    this.electronService.send('saveConfig', config);
  }

  public splitOctoprintURL(octoprintURL: string): URLSplit {
    const host = octoprintURL.split(':')[1].replace('//', '');
    const port = parseInt(octoprintURL.split(':')[2], 10);

    return {
      host,
      port: isNaN(port) ? null : port,
    };
  }

  public mergeOctoprintURL(urlSplit: URLSplit): string {
    if (urlSplit.port !== null || !isNaN(urlSplit.port)) {
      return `http://${urlSplit.host}:${urlSplit.port}/`;
    } else {
      return `http://${urlSplit.host}/`;
    }
  }

  public createConfigFromInput(config: Config): Config {
    const configOut = _.cloneDeep(config);
    configOut.octoprint.url = this.mergeOctoprintURL(config.octoprint.urlSplit);
    delete configOut.octoprint.urlSplit;
    return configOut;
  }

  public isLoaded(): boolean {
    return this.config ? true : false;
  }

  public setUpdate(): void {
    this.update = true;
  }

  public getHTTPHeaders(): HttpHeader {
    return this.httpHeaders;
  }

  public getApiURL(path: string, includeApi = true): string {
    if (includeApi) return `${this.config.octoprint.url}api/${path}`;
    else return `${this.config.octoprint.url}${path}`;
  }

  public getAPIPollingInterval(): number {
    return this.config.octodash.pollingInterval;
  }

  public getPrinterName(): string {
    return this.config.printer.name;
  }

  public getCustomActions(): CustomAction[] {
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

  public getAutomaticPrinterPowerOn(): boolean {
    return this.config.octodash.turnOnPrinterWhenExitingSleep;
  }

  public usePSUControl(): boolean {
    return this.config.plugins.psuControl.enabled;
  }

  public useOphomControl(): boolean {
    return this.config.plugins.ophom.enabled;
  }

  public useTpLinkSmartPlug(): boolean {
    return this.config.plugins.tpLinkSmartPlug.enabled;
  }

  public getSmartPlugIP(): string {
    return this.config.plugins.tpLinkSmartPlug.smartPlugIP;
  }

  public useTasmota(): boolean {
    return this.config.plugins.tasmota.enabled;
  }

  public getTasmotaIP(): string {
    return this.config.plugins.tasmota.ip;
  }

  public getTasmotaIndex(): number {
    return this.config.plugins.tasmota.index;
  }

  public useTasmotaMqtt(): boolean {
    return this.config.plugins.tasmotaMqtt.enabled;
  }

  public getTasmotaMqttTopic(): string {
    return this.config.plugins.tasmotaMqtt.topic;
  }

  public getTasmotaMqttRelayNumber(): number {
    return this.config.plugins.tasmotaMqtt.relayNumber;
  }

  public useWemo(): boolean {
    return this.config.plugins.wemo.enabled;
  }

  public getWemoIP(): string {
    return `${this.config.plugins.wemo.ip}:${this.config.plugins.wemo.port}`;
  }

  public getFilamentThickness(): number {
    return this.config.filament.thickness;
  }

  public getFilamentDensity(): number {
    return this.config.filament.density;
  }

  public getDefaultSortingAttribute(): 'name' | 'date' | 'size' {
    return this.config.octodash.fileSorting.attribute;
  }

  public getDefaultSortingOrder(): 'asc' | 'dsc' {
    return this.config.octodash.fileSorting.order;
  }

  public getDefaultHotendTemperature(): number {
    return this.config.printer.defaultTemperatureFanSpeed.hotend;
  }

  public getDefaultHeatbedTemperature(): number {
    return this.config.printer.defaultTemperatureFanSpeed.heatbed;
  }

  public getDefaultFanSpeed(): number {
    return this.config.printer.defaultTemperatureFanSpeed.fan;
  }

  public isDisplayLayerProgressEnabled(): boolean {
    return this.config.plugins.displayLayerProgress.enabled;
  }

  public isPreheatPluginEnabled(): boolean {
    return this.config.plugins.preheatButton.enabled;
  }

  public isFilamentManagerUsed(): boolean {
    return this.config.plugins.filamentManager.enabled || this.config.plugins.spoolManager.enabled;
  }

  public isSpoolManagerPluginEnabled(): boolean {
    return this.config.plugins.spoolManager.enabled;
  }

  public getFeedLength(): number {
    return this.config.filament.feedLength;
  }

  public getFeedSpeed(): number {
    return this.config.filament.feedSpeed;
  }

  public getFeedSpeedSlow(): number {
    return this.config.filament.feedSpeedSlow;
  }

  public getPurgeDistance(): number {
    return this.config.filament.purgeDistance;
  }

  public useM600(): boolean {
    return this.config.filament.useM600;
  }

  public showThumbnailByDefault(): boolean {
    return this.config.octodash.preferPreviewWhilePrinting;
  }

  public getAccessKey(): string {
    return this.config.octoprint.accessToken;
  }

  public getDisableExtruderGCode(): string {
    return this.config.printer.disableExtruderGCode;
  }

  public getZBabystepGCode(): string {
    return this.config.printer.zBabystepGCode;
  }

  public getPreviewProgressCircle(): boolean {
    return this.config.octodash.previewProgressCircle;
  }

  public getScreenSleepCommand(): string {
    return this.config.octodash.screenSleepCommand;
  }

  public getScreenWakeupCommand(): string {
    return this.config.octodash.screenWakeupCommand;
  }

  public getShowExtruderControl(): boolean {
    return this.config.octodash.showExtruderControl;
  }

  public isXAxisInverted(): boolean {
    return this.config.octodash.invertAxisControl.x;
  }

  public isYAxisInverted(): boolean {
    return this.config.octodash.invertAxisControl.y;
  }

  public isZAxisInverted(): boolean {
    return this.config.octodash.invertAxisControl.z;
  }

  public setSortingAttribute(attribute: 'name' | 'date' | 'size'): void {
    this.config.octodash.fileSorting.attribute = attribute;
    this.saveConfig(this.config);
  }

  public setSortingOrder(order: 'asc' | 'dsc'): void {
    this.config.octodash.fileSorting.order = order;
    this.saveConfig(this.config);
  }

  public showNotificationCenterIcon(): boolean {
    return this.config.octodash.showNotificationCenterIcon;
  }
}
