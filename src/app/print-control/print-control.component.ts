import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { ConfigService } from '../config/config.service';
import { PrinterState, PrinterStatus } from '../model';
import { JobService } from '../services/job/job.service';
import { PrinterService } from '../services/printer/printer.service';
import { SocketService } from '../services/socket/socket.service';

@Component({
  selector: 'app-print-control',
  templateUrl: './print-control.component.html',
  styleUrls: ['./print-control.component.scss'],
})
export class PrintControlComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();

  public showControls = false;
  public controlView = ControlView;
  public view = ControlView.MAIN;
  private showedPauseScreen = false;

  public temperatureHotends: number[];
  public temperatureHeatbed: number;
  public fanSpeed: number;
  public feedrate: number;
  public zOffset: number;

  public constructor(
    private jobService: JobService,
    private printerService: PrinterService,
    private configService: ConfigService,
    private socketService: SocketService,
    private router: Router,
  ) {
    this.temperatureHotends = [0];
    this.temperatureHeatbed = 0;
    this.fanSpeed = 0;
    this.feedrate = 100;
    this.zOffset = 0;
  }

  public ngOnInit(): void {
    this.subscriptions.add(
      this.socketService.getPrinterStatusSubscribable().subscribe((printerStatus: PrinterStatus) => {
        if (printerStatus.status === PrinterState.paused) {
          if (!this.showedPauseScreen) {
            this.view = ControlView.PAUSE;
            this.showControls = true;
            this.showedPauseScreen = true;
          }
        } else {
          if (this.showedPauseScreen && this.showControls) {
            this.showControls = false;
          }
          this.showedPauseScreen = false;
        }
      }),
    );
  }

  public ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  public isClickOnPreview(event: MouseEvent): boolean {
    const previewSwitchMin = window.innerWidth * 0.04;
    const previewSwitchMax = window.innerWidth * 0.28;

    return (
      previewSwitchMin < event.clientX &&
      event.clientX < previewSwitchMax &&
      previewSwitchMin < event.clientY &&
      event.clientY < previewSwitchMax
    );
  }

  public cancel(event: MouseEvent): void {
    if (this.showControls) {
      this.stopPropagation(event);
      this.view = ControlView.CANCEL;
    }
  }

  public pause(event: MouseEvent): void {
    if (this.showControls) {
      this.stopPropagation(event);
      this.jobService.pauseJob();
      this.view = ControlView.PAUSE;
    }
  }

  public adjust(event: MouseEvent): void {
    if (this.showControls) {
      if (this.view === ControlView.BABYSTEP) {
        this.printerService.saveToEPROM();
      }
      this.view = ControlView.ADJUST;
      this.stopPropagation(event);
    }
  }

  public babystep(event: MouseEvent): void {
    if (this.showControls) {
      this.view = ControlView.BABYSTEP;
      this.stopPropagation(event);
    }
  }

  public stopPropagation(event: MouseEvent): void {
    if (this.showControls) {
      event.stopPropagation();
    }
  }

  public showControlOverlay(event?: MouseEvent): void {
    if (!this.isClickOnPreview(event) && !this.showControls) {
      this.stopPropagation(event);
      this.loadData();
      this.view = ControlView.MAIN;
      this.showControls = true;
    } else {
      document.getElementById('jobTogglePreview').click();
    }
  }

  public hideControlOverlay(event: MouseEvent): void {
    this.stopPropagation(event);
    this.showControls = false;
  }

  public cancelPrint(event: MouseEvent): void {
    if (this.showControls && this.view === ControlView.CANCEL) {
      this.jobService.cancelJob();
      this.hideControlOverlay(event);
    }
  }

  public resume(event: MouseEvent): void {
    if (this.showControls && this.view === ControlView.PAUSE) {
      this.jobService.resumeJob();
      this.hideControlOverlay(event);
    }
  }

  public restart(event: MouseEvent): void {
    if (this.showControls && this.view === ControlView.PAUSE) {
      this.jobService.restartJob();
      this.hideControlOverlay(event);
    }
  }

  public changeFilament(event: MouseEvent): void {
    this.router.navigate(['/filament']);
    this.stopPropagation(event);
  }

  public backToControlScreen(event: MouseEvent): void {
    if (this.showControls) {
      this.view = ControlView.MAIN;
      this.stopPropagation(event);
    }
  }

  private loadData(): void {
    this.socketService
      .getPrinterStatusSubscribable()
      .pipe(take(1))
      .subscribe((status: PrinterStatus): void => {
        this.temperatureHotends = status.tools.map(t => t.set);
        this.temperatureHeatbed = status.bed.set;
        this.fanSpeed = status.fanSpeed;
      });
  }

  public changeTemperatureHotend(value: number, tool = 0): void {
    if (this.showControls) {
      this.temperatureHotends[tool] += value;
      if (this.temperatureHotends[tool] < 0) {
        this.temperatureHotends[tool] = 0;
      }
      if (this.temperatureHotends[tool] > 999) {
        this.temperatureHotends[tool] = 999;
      }
    }
  }

  public changeTemperatureHeatbed(value: number): void {
    if (this.showControls) {
      this.temperatureHeatbed += value;
      if (this.temperatureHeatbed < 0) {
        this.temperatureHeatbed = 0;
      }
      if (this.temperatureHeatbed > 999) {
        this.temperatureHeatbed = 999;
      }
    }
  }

  public changeFeedrate(value: number): void {
    if (this.showControls) {
      this.feedrate += value;
      if (this.feedrate < 50) {
        this.feedrate = 50;
      }
      if (this.feedrate > 200) {
        this.feedrate = 200;
      }
    }
  }

  public changeFanSpeed(value: number): void {
    if (this.showControls) {
      this.fanSpeed += value;
      if (this.fanSpeed < 0) {
        this.fanSpeed = 0;
      }
      if (this.fanSpeed > 100) {
        this.fanSpeed = 100;
      }
    }
  }

  public setAdjustParameters(event: MouseEvent): void {
    if (this.showControls) {
      for (const i of this.temperatureHotends) {
        this.printerService.setTemperatureHotend(this.temperatureHotends[i], i);
      }
      this.printerService.setTemperatureBed(this.temperatureHeatbed);
      this.printerService.setFeedrate(this.feedrate);
      this.printerService.setFanSpeed(this.fanSpeed);
      this.hideControlOverlay(event);
    }
  }

  public getZOffset(): string {
    return Math.abs(this.zOffset).toFixed(2);
  }

  public babystepZ(value: number): void {
    // gotta love JS for that one.
    this.zOffset = Math.round((this.zOffset + value) * 100) / 100;
    this.printerService.executeGCode(`${this.configService.getZBabystepGCode()}${value}`);
  }
}

enum ControlView {
  MAIN,
  CANCEL,
  PAUSE,
  ADJUST,
  BABYSTEP,
}
