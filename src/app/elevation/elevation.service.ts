import { Injectable } from '@angular/core';

import { ThreeService } from '../core/services/three/three.service';

@Injectable({
  providedIn: 'root'
})
export class ElevationService {
  constructor(private threeService: ThreeService) {}

  attachThreeToDom(element: HTMLElement) {
    this.threeService.attachThreeToDom(element);
  }

  updateRendererSize(width: number, height: number) {
    this.threeService.updateRendererSize(width, height);
  }
}
