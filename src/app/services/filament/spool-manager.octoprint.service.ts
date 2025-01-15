import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfigService } from '../../config/config.service';
import { FilamentSpool } from '../../model';
import { SpoolManagerSelectionPut, SpoolManagerSpool, SpoolManagerSpoolList } from '../../model/octoprint';
import { FilamentPluginService } from './filament-plugin.service';

@Injectable()
export class SpoolManagerOctoprintService implements FilamentPluginService {
  public constructor(private configService: ConfigService, private http: HttpClient) {}

  public getSpools(): Observable<Array<FilamentSpool>> {
    return this.callSpoolManagerAPI('hideInactiveSpools', 0, 3000, 'lastUse', 'desc').pipe(
      map((spools: SpoolManagerSpoolList): Array<FilamentSpool> => {
        return spools.allSpools.map((spool: SpoolManagerSpool): FilamentSpool => {
          return this.convertFilamentManagerSpool(spool);
        });
      }),
    );
  }

  public getCurrentSpools(): Observable<Array<FilamentSpool>> {
    return this.callSpoolManagerAPI('hideInactiveSpools', 0, 3000, 'lastUse', 'desc').pipe(
      map((spools: SpoolManagerSpoolList): FilamentSpool[] => {
        if (spools.selectedSpools.length > 0) {
          return spools.selectedSpools.map(s => this.convertFilamentManagerSpool(s));
        } else {
          return null;
        }
      }),
    );
  }

  public getCurrentSpool(tool: number): Observable<FilamentSpool> {
    return this.callSpoolManagerAPI('hideInactiveSpools', 0, 3000, 'lastUse', 'desc').pipe(
      map((spools: SpoolManagerSpoolList): FilamentSpool => {
        if (spools.selectedSpools.length > 0) {
          return this.convertFilamentManagerSpool(spools.selectedSpools[tool]);
        } else {
          return null;
        }
      }),
    );
  }

  private callSpoolManagerAPI(
    filterName: string,
    from: number,
    to: number,
    sortColumn: string,
    sortOrder: string,
  ): Observable<SpoolManagerSpoolList> {
    return this.http.get<SpoolManagerSpoolList>(
      this.configService.getApiURL('plugin/SpoolManager/loadSpoolsByQuery', false),
      {
        ...this.configService.getHTTPHeaders(),
        params: {
          filterName,
          from,
          to,
          sortColumn,
          sortOrder,
        },
      },
    );
  }

  private convertFilamentManagerSpool(spool: SpoolManagerSpool): FilamentSpool {
    return {
      color: spool.color ?? '#f5f6fa',
      density: spool.density,
      diameter: spool.diameter,
      displayName: `${spool.vendor} - ${spool.displayName}`,
      id: spool.databaseId,
      material: spool.material,
      name: spool.displayName,
      temperatureOffset: spool.offsetTemperature ?? 0,
      used: Number(spool.usedWeight),
      vendor: spool.vendor,
      weight: spool.totalWeight,
    };
  }

  public setSpool(spool: FilamentSpool, tool: number): Observable<void> {
    const setSpoolBody: SpoolManagerSelectionPut = {
      databaseId: spool.id,
      toolIndex: tool,
    };

    return this.http.put<void>(
      this.configService.getApiURL('plugin/SpoolManager/selectSpool', false),
      setSpoolBody,
      this.configService.getHTTPHeaders(),
    );
  }
}
