import { Injectable } from '@angular/core';
import { Observable, Observer } from 'rxjs';
import { shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private observable: Observable<Notification | 'close'>;
  private observer: Observer<Notification | 'close'>;
  private hideNotifications = false;
  private bootGrace = true;

  public constructor() {
    this.observable = new Observable((observer: Observer<Notification | 'close'>): void => {
      this.observer = observer;
      setTimeout((): void => {
        this.bootGrace = false;
      }, 30000);
    }).pipe(shareReplay(1));
  }

  public enableNotifications(): void {
    console.clear();
    this.hideNotifications = false;
    this.observer.next('close');
  }

  public disableNotifications(): void {
    console.clear();
    this.hideNotifications = true;
    this.observer.next('close');
  }

  public closeNotification(): void {
    this.observer.next('close');
  }

  public setError(heading: string, text: string): Promise<void> {
    return new Promise(resolve => {
      if ((!this.hideNotifications && !this.bootGrace) || (this.bootGrace && !text.endsWith('0 Unknown Error'))) {
        if (this.observer) {
          this.observer.next({ heading, text, type: 'error', closed: resolve });
        } else {
          setTimeout(() => {
            this.setError(heading, text);
          }, 1000);
        }
      }
    });
  }

  public setWarning(heading: string, text: string): Promise<void> {
    return new Promise(resolve => {
      if (!this.hideNotifications) {
        if (this.observer) {
          this.observer.next({ heading, text, type: 'warn', closed: resolve });
        } else {
          setTimeout(() => {
            this.setWarning(heading, text);
          }, 1000);
        }
      }
    });
  }

  public setNotification(heading: string, text: string): Promise<void> {
    return new Promise(resolve => {
      if (this.observer) {
        this.observer.next({ heading, text, type: 'notification', closed: resolve });
      } else {
        setTimeout(() => {
          this.setNotification(heading, text);
        }, 1000);
      }
    });
  }

  public getObservable(): Observable<Notification | 'close'> {
    return this.observable;
  }

  public getBootGrace(): boolean {
    return this.bootGrace;
  }
}

export interface Notification {
  heading: string;
  text: string;
  type: string;
  closed: () => void;
}
