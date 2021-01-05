import { Observable } from 'rxjs';

export interface FilamentManagementPlugin {
  getSpools(): Observable<Array<FilamentSpool>>;
  getCurrentSpool(): Observable<FilamentSpool>;
  setSpool(spool: FilamentSpool): Observable<void>;
}

export interface FilamentSpoolList {
  spools: Array<FilamentSpool>;
}

export interface FilamentSpool {
  id: number;
  name: string;
  displayName: string;
  color: string;
  material: string;
  temperatureOffset: number;
  used: number;
  weight: number;
  vendor: string;
  diameter: number;
  density: number;
}
