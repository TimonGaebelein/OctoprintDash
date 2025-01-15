import { Component, EventEmitter, Output } from '@angular/core';
import { take } from 'rxjs/operators';

import { PrinterStatus } from '../../model';
import { PrinterService } from '../../services/printer/printer.service';
import { SocketService } from '../../services/socket/socket.service';

@Component({
  selector: 'app-filament-choose-tool',
  templateUrl: './choose-tool.component.html',
  styleUrls: ['./choose-tool.component.scss', '../filament.component.scss'],
})
export class ChooseToolComponent {
  public toolCount = 1;

  @Output() toolChange = new EventEmitter<number>();

  public constructor(private printerService: PrinterService, private socketService: SocketService) {
    this.socketService
      .getPrinterStatusSubscribable()
      .pipe(take(1))
      .subscribe((printerStatus: PrinterStatus): void => {
        this.toolCount = printerStatus.tools.length;
      });
  }

  public setTool(tool: number): void {
    setTimeout(() => {
      this.toolChange.emit(tool);
    }, 150);
  }

  //function to return list of numbers from 0 to n-1
  numSequence(n: number): Array<number> {
    return Array(n);
  }
}
