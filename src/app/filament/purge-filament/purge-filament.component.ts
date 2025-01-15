import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

import { ConfigService } from '../../config/config.service';
import { PrinterService } from '../../services/printer/printer.service';

@Component({
  selector: 'app-filament-purge-filament',
  templateUrl: './purge-filament.component.html',
  styleUrls: ['./purge-filament.component.scss', '../filament.component.scss'],
})
export class PurgeFilamentComponent implements OnInit {
  @Input() selectedTool: number;

  @Output() purgeDone = new EventEmitter<void>();

  public purgeAmount: number;

  constructor(private configService: ConfigService, private printerService: PrinterService) {}

  ngOnInit(): void {
    this.purgeAmount = this.configService.useM600() ? 0 : this.configService.getPurgeDistance();
    if (this.purgeAmount === 0) {
      this.purgeDone.emit();
    } else {
      this.purgeFilament(this.purgeAmount);
    }
  }

  public increasePurgeAmount(length: number): void {
    this.purgeAmount += length;
    this.purgeFilament(length);
  }

  public purgeFilament(length: number): void {
    this.printerService.extrude(length, this.configService.getFeedSpeedSlow(), this.selectedTool);
  }
}
