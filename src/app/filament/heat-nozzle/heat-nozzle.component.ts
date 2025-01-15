import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';

import { ConfigService } from '../../config/config.service';
import { FilamentSpool, PrinterStatus } from '../../model';
import { PrinterService } from '../../services/printer/printer.service';
import { SocketService } from '../../services/socket/socket.service';

@Component({
  selector: 'app-filament-heat-nozzle',
  templateUrl: './heat-nozzle.component.html',
  styleUrls: ['./heat-nozzle.component.scss', '../filament.component.scss'],
})
export class HeatNozzleComponent implements OnInit, OnDestroy {
  @Input() selectedSpool: FilamentSpool;
  @Input() currentSpool: FilamentSpool;
  @Input() selectedTool: number;

  @Output() increasePage = new EventEmitter<void>();

  public hotendTarget: number;
  public hotendTemperature: number;
  public automaticHeatingStartSeconds: number;
  public isHeating: boolean;
  public isComplete: boolean;

  private startHeatingTimeout: ReturnType<typeof setTimeout>;
  private checkNozzleTemperatureTimeout: ReturnType<typeof setTimeout>;
  private subscriptions: Subscription = new Subscription();

  constructor(
    private printerService: PrinterService,
    private socketService: SocketService,
    private configService: ConfigService,
  ) {}

  ngOnInit(): void {
    this.isHeating = false;
    this.isComplete = false;
    this.automaticHeatingStartSeconds = 6;
    this.automaticHeatingStartTimer();
    this.hotendTarget = this.currentSpool
      ? this.configService.getDefaultHotendTemperature() + this.currentSpool.temperatureOffset
      : this.configService.getDefaultHotendTemperature();

    this.subscriptions.add(
      this.socketService.getPrinterStatusSubscribable().subscribe((printerStatus: PrinterStatus): void => {
        this.hotendTemperature = printerStatus.tools[this.selectedTool].current;
      }),
    );
  }

  ngOnDestroy(): void {
    this.clearTimeouts();
    this.subscriptions.unsubscribe();
  }

  public changeHotendTarget(value: number): void {
    this.hotendTarget = this.hotendTarget + value;
    if (this.hotendTarget < 0) {
      this.hotendTarget = 0;
    }
    if (this.hotendTarget > 999) {
      this.hotendTarget = 999;
    }
    if (!this.isHeating) {
      this.automaticHeatingStartSeconds = 5;
    } else {
      this.setNozzleTemperature();
    }
  }

  private automaticHeatingStartTimer(): void {
    this.automaticHeatingStartSeconds--;
    if (this.automaticHeatingStartSeconds === 0) {
      this.setNozzleTemperature();
    } else {
      this.startHeatingTimeout = setTimeout(this.automaticHeatingStartTimer.bind(this), 1000);
    }
  }

  public setNozzleTemperature(): void {
    this.isHeating = true;
    this.clearTimeouts();
    this.printerService.setTemperatureHotend(this.hotendTarget, this.selectedTool);
    this.checkNozzleTemperatureTimeout = setTimeout(this.checkTemperature.bind(this), 1500);
  }

  private checkTemperature(): void {
    if (this.hotendTemperature >= this.hotendTarget) {
      if (!this.isComplete) {
        this.increasePage.emit();
        this.isComplete = true;
      }
    } else {
      this.checkNozzleTemperatureTimeout = setTimeout(this.checkTemperature.bind(this), 1500);
    }
  }

  private clearTimeouts() {
    clearTimeout(this.startHeatingTimeout);
    clearTimeout(this.checkNozzleTemperatureTimeout);
  }

  public getSpoolTemperatureOffsetString(spool: FilamentSpool): string {
    return `${spool.temperatureOffset === 0 ? '±' : spool.temperatureOffset > 0 ? '+' : '-'}${Math.abs(
      spool.temperatureOffset,
    )}`;
  }
}
