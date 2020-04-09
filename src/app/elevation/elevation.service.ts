import { Injectable, NgZone } from '@angular/core';

import { ThreeService } from '../core/services/three/three.service';
import {
  Elevation,
  createCabinet,
  Project,
  ObjectType,
  SAMPLE_DEVICE_LIBRARY,
  Device,
  Accessory,
  RUData
} from './elevation';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
import { filter, map, tap, take, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ElevationService {
  currentProject = new BehaviorSubject<Project>({
    elevations: [],
    activeItem: undefined
  });

  activeItem = this.currentProject.pipe(
    map(state => state.activeItem),
    shareReplay(1)
  );

  populatorLibrary = of(SAMPLE_DEVICE_LIBRARY);

  constructor(private zone: NgZone) {
    setTimeout(
      () =>
        this.currentProject.next({
          elevations: [
            {
              cabinet: createCabinet('Rack 1', 42, {
                width: 23.63,
                height: 78.5,
                depth: 43
              })
            },
            {
              cabinet: createCabinet('Rack 2', 42, {
                width: 23.63,
                height: 78.5,
                depth: 43
              })
            }
          ],
          activeItem: undefined
        }),
      0
    );
  }

  updateState(newState: Project) {
    this.zone.run(() => this.currentProject.next({ ...newState }));
  }

  async updateRU(populator: Device | Accessory) {
    const newState = await this.currentProject
      .pipe(
        map(currentState => {
          const updatedRU: RUData = {
            ...(currentState.activeItem.item as RUData),
            populator
          };
          const elevations = currentState.elevations.map(ele => {
            if (ele.cabinet.id === currentState.activeItem.parentId) {
              const updatedRUData = ele.cabinet.ruData.map(ru => {
                if (
                  ru.location ===
                  (currentState.activeItem.item as RUData).location
                ) {
                  return updatedRU;
                }
                return ru;
              });
              return {
                ...ele,
                cabinet: { ...ele.cabinet, ruData: updatedRUData }
              };
            }
            return ele;
          });
          return {
            ...currentState,
            elevations,
            activeItem: { ...currentState.activeItem, item: updatedRU }
          };
        }),
        take(1)
      )
      .toPromise();

    this.updateState(newState);
  }

  async unsetActive() {
    const newState = await this.currentProject
      .pipe(
        map(currentState => {
          return { ...currentState, activeItem: undefined };
        }),
        take(1)
      )
      .toPromise();

    this.updateState(newState);
  }

  // attachThreeToDom(element: HTMLElement) {
  //   this.threeService.attachThreeToDom(element);
  // }

  // updateRendererSize(width: number, height: number) {
  //   this.threeService.updateRendererSize(width, height);
  // }
}
