import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { FilamentSpool } from '../../model';

@Injectable()
export abstract class FilamentPluginService {
  abstract getSpools(): Observable<Array<FilamentSpool>>;

  abstract getCurrentSpools(): Observable<FilamentSpool[]>;

  abstract getCurrentSpool(tool: number): Observable<FilamentSpool>;

  abstract setSpool(spool: FilamentSpool, tool: number): Observable<void>;
}
