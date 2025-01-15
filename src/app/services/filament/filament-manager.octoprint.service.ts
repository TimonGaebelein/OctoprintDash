import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ConfigService } from '../../config/config.service';
import { FilamentSpool } from '../../model';
import {
  FilamentManagerSelectionPatch,
  FilamentManagerSelections,
  FilamentManagerSpool,
  FilamentManagerSpoolList,
} from '../../model/octoprint';
import { FilamentPluginService } from './filament-plugin.service';

const colorRegexp = /\((.*)\)$/g;

@Injectable()
export class FilamentManagerOctoprintService implements FilamentPluginService {
  public constructor(private configService: ConfigService, private http: HttpClient) {}

  public getSpools(): Observable<Array<FilamentSpool>> {
    return this.http
      .get(this.configService.getApiURL('plugin/filamentmanager/spools', false), this.configService.getHTTPHeaders())
      .pipe(
        map((spools: FilamentManagerSpoolList): Array<FilamentSpool> => {
          return spools.spools.map((spool: FilamentManagerSpool): FilamentSpool => {
            return this.convertFilamentManagerSpool(spool);
          });
        }),
      );
  }

  public getCurrentSpools(): Observable<Array<FilamentSpool>> {
    return this.http
      .get(
        this.configService.getApiURL('plugin/filamentmanager/selections', false),
        this.configService.getHTTPHeaders(),
      )
      .pipe(
        map((selection: FilamentManagerSelections): Array<FilamentSpool> => {
          if (selection.selections.length > 0) {
            return selection.selections.map((sel): FilamentSpool => this.convertFilamentManagerSpool(sel.spool));
          } else {
            return null;
          }
        }),
      );
  }

  public getCurrentSpool(tool: number): Observable<FilamentSpool> {
    return this.http
      .get(
        this.configService.getApiURL('plugin/filamentmanager/selections', false),
        this.configService.getHTTPHeaders(),
      )
      .pipe(
        map((selection: FilamentManagerSelections): FilamentSpool => {
          if (selection.selections.length > 0) {
            return this.convertFilamentManagerSpool(selection.selections[tool].spool);
          } else {
            return null;
          }
        }),
      );
  }

  private convertFilamentManagerSpool(spool: FilamentManagerSpool): FilamentSpool {
    colorRegexp.lastIndex = 0;
    const match = colorRegexp.exec(spool.name);
    return {
      color: match ? match[1] : '#f5f6fa',
      density: spool.profile.density,
      diameter: spool.profile.diameter,
      displayName: match
        ? `${spool.profile.vendor} - ${spool.name.replace(match[0], '')}`
        : `${spool.profile.vendor} - ${spool.name}`,
      id: spool.id,
      material: spool.profile.material,
      name: spool.name,
      temperatureOffset: spool.temp_offset,
      used: spool.used,
      vendor: spool.profile.vendor,
      weight: spool.weight,
    };
  }

  public setSpool(spool: FilamentSpool, tool: number): Observable<void> {
    const setSpoolBody: FilamentManagerSelectionPatch = {
      selection: {
        tool,
        spool: {
          id: spool.id,
        },
      },
    };

    return this.http.patch<void>(
      this.configService.getApiURL('plugin/filamentmanager/selections/0', false),
      setSpoolBody,
      this.configService.getHTTPHeaders(),
    );
  }
}
