import { Injectable, NgZone } from '@angular/core';

import {
  createCabinet,
  Project,
  SAMPLE_DEVICE_LIBRARY,
  Device,
  Accessory,
  RUData,
  ActiveItem,
} from './elevation';
import { BehaviorSubject, of } from 'rxjs';
import { map, take, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ElevationService {
  currentProject = new BehaviorSubject<Project>({
    elevations: [],
    activeItems: undefined,
  });

  activeItems = this.currentProject.pipe(
    map((state) => state.activeItems),
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
                depth: 43,
              }),
            },
            {
              cabinet: createCabinet('Rack 2', 42, {
                width: 23.63,
                height: 78.5,
                depth: 43,
              }),
            },
          ],
          activeItems: [],
        }),
      0
    );
  }

  updateState(newState: Project) {
    this.zone.run(() => this.currentProject.next({ ...newState }));
  }

  async updateRU(populator: Device | Accessory, activeItem: ActiveItem) {
    const newState = await this.currentProject
      .pipe(
        map((currentState) => {
          // creating the updated RU
          const updatedRU: RUData = {
            ...(activeItem.item as RUData),
            populator,
          };

          // updating the elevations
          const elevations = currentState.elevations.map((ele) => {
            if (ele.cabinet.id === activeItem.parentId) {
              const updatedRUData = ele.cabinet.ruData.map((ru) => {
                if (ru.location === (activeItem.item as RUData).location) {
                  return updatedRU;
                }
                return ru;
              });
              return {
                ...ele,
                cabinet: { ...ele.cabinet, ruData: updatedRUData },
              };
            }
            return ele;
          });

          // updating the active item
          const withoutOldActiveItem = currentState.activeItems.filter(
            (item) => item.item.id !== activeItem.item.id
          );
          const newActiveItem = { ...activeItem, item: updatedRU };
          const updatedActiveItems = [...withoutOldActiveItem, newActiveItem];
          return {
            ...currentState,
            elevations,
            activeItems: updatedActiveItems,
          };
        }),
        take(1)
      )
      .toPromise();

    this.updateState(newState);
  }

  async unsetActive() {
    const newState: Project = await this.currentProject
      .pipe(
        map((currentState) => {
          return { ...currentState, activeItems: [] };
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
