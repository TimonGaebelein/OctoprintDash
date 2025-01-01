import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { SocketAuth } from '../../model';

@Injectable()
export abstract class SystemService {
  abstract getLocalIpAddress(): Observable<string | null>;

  abstract getSessionKey(): Observable<SocketAuth>;

  abstract sendCommand(command: string): void;

  abstract connectPrinter(): void;
}
