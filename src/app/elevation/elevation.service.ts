import { Injectable, NgZone } from '@angular/core';

import {
  createCabinet,
  Project,
  SAMPLE_DEVICE_LIBRARY,
  Device,
  Accessory,
  RUData,
  ItemRef,
  SessionState,
  EditMode,
  ModeView
} from './elevation';
import { BehaviorSubject, of } from 'rxjs';
import { map, take, shareReplay } from 'rxjs/operators';

const initialSessionState: SessionState = {
  scale: 0,
  editMode: {
    mode: EditMode.CAB,
    cabView: ModeView.MULTI,
    ruView: ModeView.MULTI,
    singleModeObject: undefined
  },
  activeItems: []
};

@Injectable({
  providedIn: 'root'
})
export class ElevationService {
  // projectState maintains state of the build
  projectState = new BehaviorSubject<Project>({
    elevations: []
  });

  // sessionState maintains state of the session environment
  sessionState = new BehaviorSubject(initialSessionState);
  activeItems = this.sessionState.pipe(
    map((state) => state.activeItems),
    shareReplay(1)
  );

  populatorLibrary = of(SAMPLE_DEVICE_LIBRARY);

  constructor(private zone: NgZone) {
    setTimeout(
      () =>
        this.projectState.next({
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
          ]
        }),
      0
    );
  }

  updateProjectState(newState: Project) {
    this.zone.run(() => this.projectState.next({ ...newState }));
  }

  updateSessionState(newState: SessionState) {
    this.zone.run(() => this.sessionState.next(newState));
  }

  async updateRU(populator: Device | Accessory, activeItem: ItemRef) {
    const newState = await this.projectState
      .pipe(
        map((currentState) => {
          // creating the updated RU
          const currentRU = currentState.elevations
            .filter((ele) => ele.cabinet.id === activeItem.parentId)[0]
            .cabinet.ruData.filter((ru) => ru.id === activeItem.itemId)[0];
          const updatedRU: RUData = {
            ...currentRU,
            populator
          };

          // updating the elevations
          const elevations = currentState.elevations.map((ele) => {
            if (ele.cabinet.id === activeItem.parentId) {
              const updatedRUData = ele.cabinet.ruData.map((ru) => {
                if (ru.location === currentRU.location) {
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
            elevations
          };
        }),
        take(1)
      )
      .toPromise();

    this.updateProjectState(newState);
  }

  async unsetActive() {
    const newSessionState: SessionState = await this.sessionState
      .pipe(
        map((currentState) => {
          return { ...currentState, activeItems: [] };
        }),
        take(1)
      )
      .toPromise();

    this.updateSessionState(newSessionState);
  }

  // attachThreeToDom(element: HTMLElement) {
  //   this.threeService.attachThreeToDom(element);
  // }

  // updateRendererSize(width: number, height: number) {
  //   this.threeService.updateRendererSize(width, height);
  // }
}
