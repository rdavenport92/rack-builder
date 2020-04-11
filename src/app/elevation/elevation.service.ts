import { Injectable, NgZone } from '@angular/core';

import {
  Project,
  SAMPLE_DEVICE_LIBRARY,
  Device,
  Accessory,
  RUData,
  ItemRef,
  SessionState,
  EditMode,
  ModeView,
  SAMPLE_PROJECT,
  Orientation
} from './elevation';
import { BehaviorSubject, of } from 'rxjs';
import { map, take, shareReplay, filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ElevationService {
  // projectState maintains state of the build
  private projectStateSubject = new BehaviorSubject<Project | undefined>(
    undefined
  );
  projectState = this.projectStateSubject.pipe(
    filter((projectState) => !!projectState)
  );

  // sessionState maintains state of the session environment
  private sessionStateSubject = new BehaviorSubject<SessionState | undefined>(
    undefined
  );
  sessionState = this.sessionStateSubject.pipe(
    filter((sessionState) => !!sessionState)
  );

  populatorLibrary = of(SAMPLE_DEVICE_LIBRARY);

  constructor(private zone: NgZone) {
    setTimeout(() => this.loadProject(SAMPLE_PROJECT), 0);
  }

  loadProject(project: Project) {
    const initialSessionState: SessionState = {
      scale: 0,
      editMode: {
        mode: EditMode.CAB,
        cabView: ModeView.MULTI,
        ruView: ModeView.MULTI,
        singleModeObject: undefined
      },
      orientation: Orientation.FRONT,
      activeItems: []
    };

    if (project.elevations.length < 2) {
      const sessionStateSingleRackModeOnly = {
        ...initialSessionState,
        editMode: { ...initialSessionState.editMode, cabView: ModeView.SINGLE }
      };
      this.updateSessionState(sessionStateSingleRackModeOnly);
    } else {
      this.updateSessionState(initialSessionState);
    }

    this.updateProjectState(project);
  }

  updateProjectState(newState: Project) {
    this.zone.run(() => this.projectStateSubject.next({ ...newState }));
  }

  updateSessionState(newState: SessionState) {
    this.zone.run(() => this.sessionStateSubject.next(newState));
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
