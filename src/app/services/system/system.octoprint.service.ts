/* eslint-disable camelcase */
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ConfigService } from '../../config/config.service';
import { NotificationType, SocketAuth, TestAddress } from '../../model';
import { ConnectCommand, OctoprintLogin } from '../../model/octoprint';
import { NotificationService } from '../../notification/notification.service';
import { SystemService } from './system.service';

@Injectable()
export class SystemOctoprintService implements SystemService {
  constructor(
    private configService: ConfigService,
    private notificationService: NotificationService,
    private http: HttpClient,
  ) {}

  public getSessionKey(): Observable<SocketAuth> {
    return this.http
      .post<OctoprintLogin>(
        this.configService.getApiURL('login'),
        { passive: true },
        this.configService.getHTTPHeaders(),
      )
      .pipe(
        map(octoprintLogin => {
          return {
            user: octoprintLogin.name,
            session: octoprintLogin.session,
          } as SocketAuth;
        }),
      );
  }

  public sendCommand(command: string): void {
    this.http
      .post(this.configService.getApiURL(`system/commands/core/${command}`), null, this.configService.getHTTPHeaders())
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-execute:Can't execute ${command} command!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
          });
          return of(error);
        }),
      )
      .subscribe();
  }

  public connectPrinter(): void {
    const payload: ConnectCommand = {
      command: 'connect',
      save: false,
    };

    this.http
      .post(this.configService.getApiURL('connection'), payload, this.configService.getHTTPHeaders())
      .pipe(
        catchError(error => {
          this.notificationService.setNotification({
            heading: $localize`:@@error-connect:Can't connect to printer!`,
            text: error.message,
            type: NotificationType.ERROR,
            time: new Date(),
            sticky: true,
          });
          return of(error);
        }),
      )
      .subscribe();
  }

  public getLocalIpAddress() {
    const payload = {
      command: 'address',
    };

    return this.http
      .post<TestAddress>(this.configService.getApiURL('util/test'), payload, this.configService.getHTTPHeaders())
      .pipe(map(result => (result?.is_lan_address && result?.address ? result.address : null)));
  }
}
