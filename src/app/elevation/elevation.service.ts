import { Injectable } from '@angular/core';

import { ThreeService } from '../core/services/three/three.service';
import { Elevation, createCabinet } from './elevation';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ElevationService {
  currentProject = new BehaviorSubject<Elevation[]>([]);

  activeItemId = new BehaviorSubject<string>('');

  activeItem = combineLatest([this.activeItemId, this.currentProject]).pipe(
    filter(([id, project]) => !!id && !!project.length),
    map(([id, project]) => id)
  );

  constructor(private threeService: ThreeService) {
    setTimeout(
      () =>
        this.currentProject.next([
          {
            cabinet: createCabinet(42, {
              width: 23.63,
              height: 78.5,
              depth: 43
            })
          },
          {
            cabinet: createCabinet(24, {
              width: 23.63,
              height: 45.6,
              depth: 33.5
            })
          }
        ]),
      0
    );
  }

  attachThreeToDom(element: HTMLElement) {
    this.threeService.attachThreeToDom(element);
  }

  updateRendererSize(width: number, height: number) {
    this.threeService.updateRendererSize(width, height);
  }
}
