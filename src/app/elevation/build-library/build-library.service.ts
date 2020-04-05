import { Injectable } from '@angular/core';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BuildLibraryService {
  devices = of([{}]);

  itemTypes = [
    { label: 'Cabinets', type: 'cabinet' },
    { label: 'Switches', type: 'switch' },
    { label: 'Routers', type: 'router' },
    { label: 'Firewalls', type: 'firewall' },
    { label: 'Accessories', type: 'accessory' }
  ];

  constructor() {}
}
