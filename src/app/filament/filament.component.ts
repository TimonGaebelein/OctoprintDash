import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AnimationItem } from 'lottie-web';
import { AnimationOptions } from 'ngx-lottie';
import { take } from 'rxjs/operators';

import { ConfigService } from '../config/config.service';
import { FilamentSpool, PrinterStatus } from '../model';
import { FilamentService } from '../services/filament/filament.service';
import { PrinterService } from '../services/printer/printer.service';
import { SocketService } from '../services/socket/socket.service';

@Component({
  selector: 'app-filament',
  templateUrl: './filament.component.html',
  styleUrls: ['./filament.component.scss'],
  providers: [FilamentService],
})
export class FilamentComponent implements OnInit, OnDestroy {
  private totalPages = 6;
  private hotendPreviousTemperature = [0];

  public page: number;
  public showCheckmark = false;
  public selectedTool = 0;
  public selectedSpool: FilamentSpool;
  public checkmarkOptions: AnimationOptions = {
    path: 'assets/animations/checkmark.json',
    loop: false,
  };

  public constructor(
    private router: Router,
    private configService: ConfigService,
    private printerService: PrinterService,
    private socketService: SocketService,
    private filament: FilamentService,
  ) {
    this.socketService
      .getPrinterStatusSubscribable()
      .pipe(take(1))
      .subscribe((printerStatus: PrinterStatus): void => {
        this.hotendPreviousTemperature = printerStatus.tools.map(t => t.set);
      });
  }

  public ngOnInit(): void {
    let offset = 0;
    if (!this.configService.isFilamentManagerUsed()) {
      offset += 1;
    }
    if (this.hotendPreviousTemperature.length === 1) {
      offset += 1;
    }
    this.setPage(offset);
  }

  public ngOnDestroy(): void {
    this.printerService.setTemperatureHotend(this.hotendPreviousTemperature[this.selectedTool], this.selectedTool);
  }

  public increasePage(returnToMainScreen = false): void {
    if (this.page === this.totalPages || returnToMainScreen) {
      this.router.navigate(['/main-screen']);
    } else if (this.page === 0 && !this.configService.isFilamentManagerUsed()) {
      // Skip spool selection page if no filament manager is used
      this.setPage(2);
    } else if (this.page < this.totalPages) {
      this.setPage(this.page + 1);
    }
  }

  public decreasePage(): void {
    if (this.page === 0) {
      this.router.navigate(['/main-screen']);
    } else if (this.page === 1) {
      if (this.hotendPreviousTemperature.length > 1) {
        this.setPage(0);
      } else {
        this.router.navigate(['/main-screen']);
      }
    } else if (this.page === 2) {
      if (this.configService.isFilamentManagerUsed()) {
        this.setPage(1);
      } else if (this.hotendPreviousTemperature.length > 1) {
        this.setPage(0);
      } else {
        this.router.navigate(['/main-screen']);
      }
    } else if (this.page === 3 || this.page === 4) {
      this.setPage(2);
    } else if (this.page === 5 || this.page === 6) {
      this.setPage(4);
    }
  }

  private setPage(page: number): void {
    setTimeout((): void => {
      const progressBar = document.getElementById('progressBar');
      if (progressBar) {
        document.getElementById('progressBar').style.width = this.page * (20 / this.totalPages) + 'vw';
      }
    }, 200);
    this.page = page;
  }

  public setTool(tool: number): void {
    this.selectedTool = tool;
    this.increasePage();
  }

  public setSpool(spoolInformation: { spool: FilamentSpool; skipChange: boolean }): void {
    this.selectedSpool = spoolInformation.spool;
    if (spoolInformation.skipChange) {
      this.setSpoolSelection();
    } else {
      this.increasePage();
    }
  }

  public setSpoolSelection(): void {
    if (this.selectedSpool) {
      this.filament
        .setSpool(this.selectedSpool, this.selectedTool)
        .then((): void => {
          this.showCheckmark = true;
          setTimeout(this.increasePage.bind(this), 1350, true);
        })
        .catch(() => this.increasePage(true));
    } else {
      this.increasePage(true);
    }
  }

  public get currentSpool(): FilamentSpool {
    return this.filament.getCurrentSpool(this.selectedTool);
  }

  public setAnimationSpeed(animation: AnimationItem): void {
    animation.setSpeed(0.55);
  }
}
