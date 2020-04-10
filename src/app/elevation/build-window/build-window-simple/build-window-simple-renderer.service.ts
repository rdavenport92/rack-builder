import { Injectable, OnDestroy } from '@angular/core';
import {
  Project,
  ObjectType,
  ItemRef,
  SessionState,
  EditMode,
  ModeView
} from '../../elevation';
import { ElevationService } from '../../elevation.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { tap, filter, take, map, switchMap, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BuildWindowSimpleRendererService implements OnDestroy {
  private pixelsPerInch = 96; // probably will want to calculate this in main process to be more accurate per device

  canvas = new BehaviorSubject(undefined);
  projectState = this.elevationService.projectState.pipe(shareReplay(1));
  sessionState = this.elevationService.sessionState;

  renderProject = combineLatest([
    this.canvas,
    this.projectState,
    this.sessionState
  ]).pipe(
    filter(([canvas, update, _settings]) => !!canvas && !!update),
    tap(([canvas, update, settings]) =>
      this.renderUpdate(canvas, update, settings)
    )
  );

  constructor(private elevationService: ElevationService) {
    this.renderProject.subscribe();
    window.addEventListener('keydown', (e) => this.registerHotkeys(e));
  }

  ngOnDestroy() {
    window.removeEventListener('keydown', this.registerHotkeys);
  }

  registerHotkeys(e: KeyboardEvent) {
    switch (e.keyCode) {
      case 97: // Numpad1
        this.changeEditMode(EditMode.CAB);
        break;
      case 98: // Numpad2
        this.changeEditMode(EditMode.RU);
        break;
      case 99: // Numpad3
        this.changeEditMode(EditMode.INTEGRATE);
        break;
      case 187: // +
        this.zoom(0.01);
        break;
      case 189: // -
        this.zoom(-0.01);
        break;
      case 27: // escape
        this.unsetActive();
        break;
      default:
        break;
    }
  }

  attachCanvas(element: HTMLElement) {
    const projectElementChild = document.createElement('div');
    projectElementChild.classList.add('project-child');
    const scene = document.createElement('div');
    scene.id = 'scene';
    scene.classList.add('scene');
    element.appendChild(projectElementChild);
    projectElementChild.appendChild(scene);
    this.canvas.next(element);
  }

  private renderUpdate(
    canvas: HTMLElement,
    update: Project,
    settings: SessionState
  ) {
    if (!settings.scale && !!canvas && !!update.elevations.length) {
      // scale has not been set yet - setting temp scale to 0.01 so that we can draw
      // cabinets and get an idea for what the initial scale needs to be.
      const tempSettings = {
        ...settings,
        scale: 0.01
      };
      this.drawScene(update, tempSettings);
      // by this point, the canvas will contain accurate dimensions which will allow us to set
      // a more appropriate initial scale based on the dimensions of the entire scene
      const newScale = this.calculateScale(canvas);
      const newSessionState: SessionState = {
        ...settings,
        scale: newScale,
        editMode: {
          ...settings.editMode,
          cabView:
            update.elevations.length > 1 ? ModeView.MULTI : ModeView.SINGLE
        }
      };
      this.elevationService.updateSessionState(newSessionState);
    } else if (!!settings.scale && !!canvas && !!update) {
      this.drawScene(update, settings);
    }
  }

  private drawScene(project: Project, sessionState: SessionState) {
    const ppi = this.pixelsPerInch;
    const scale = sessionState.scale;

    const scene = document.getElementById('scene');
    scene.innerHTML = '';

    if (sessionState.editMode.ruView !== ModeView.SINGLE) {
      const cabinets = project.elevations.map((ele) => ele.cabinet);

      for (let i = 0; i < cabinets.length; i++) {
        const cabinet = cabinets[i];

        if (
          sessionState.editMode.cabView === ModeView.MULTI ||
          (sessionState.editMode.cabView === ModeView.SINGLE &&
            cabinet.id === sessionState.editMode.singleModeObject.parentId)
        ) {
          const { width, height } = cabinet.dimensions;

          // drawing cabinet
          const cabElement = document.createElement('div');
          cabElement.id = cabinet.id;
          cabElement.setAttribute('data-parentId', cabinet.id);
          cabElement.setAttribute('data-type', ObjectType.CAB);
          cabElement.classList.add('cabinet');
          cabElement.style.width = `${width * ppi * scale}px`;
          cabElement.style.height = `${height * ppi * scale}px`;
          cabElement.style.margin = `${4 * ppi * scale}px`;
          // handling mode
          if (sessionState.editMode.mode === EditMode.CAB) {
            cabElement.onclick = (event) => this.selectItem(event);
            cabElement.classList.add('active-mode');
          }
          // handling if active
          if (
            !!sessionState.activeItems.length &&
            !!sessionState.activeItems.filter(
              (item) => item.itemId === cabinet.id
            ).length
          ) {
            cabElement.classList.add('active-object');
          }

          // drawing cabinet opening

          const cabinetOpening = document.createElement('div');
          cabinetOpening.id = `${cabinet.id}-opening`;
          cabinetOpening.classList.add('cabinet-opening');
          cabinetOpening.style.width = `${19 * ppi * scale}px`;
          cabinetOpening.style.height = `${
            cabinet.ruCount * 1.75 * ppi * scale
          }px`;
          cabinetOpening.style.bottom = `${
            cabinet.openingOffset * ppi * scale
          }px`;
          cabinetOpening.style.pointerEvents = 'none';

          // drawing ru's
          let ruSpan = 0;
          for (let i = 0; i < cabinet.ruCount; i++) {
            if (ruSpan) {
              // handling rendering a devices RU span
              ruSpan += -1;
              continue;
            }
            const ru = cabinet.ruData[i];
            const ruElement = document.createElement('div');
            ruElement.id = cabinet.ruData[i].id;
            ruElement.setAttribute('data-parentid', cabinet.id);
            ruElement.setAttribute('data-type', ObjectType.RU);
            ruElement.classList.add('ru');
            // handling if populated
            if (ru.populator) {
              ruSpan = ru.populator.ruSpan - 1;
              ruElement.style.flex = `${ru.populator.ruSpan}`;
              ruElement.style.backgroundColor = `#555555`;
              ruElement.innerText = ru.populator.name;
            }
            // handling mode
            if (sessionState.editMode.mode === EditMode.RU) {
              ruElement.style.pointerEvents = 'auto';
              ruElement.onclick = (event) => this.selectItem(event);
              ruElement.classList.add('active-mode');
            } else {
              ruElement.style.pointerEvents = 'none';
            }
            // handling if active
            if (
              !!sessionState.activeItems.length &&
              !!sessionState.activeItems.filter((item) => item.itemId === ru.id)
                .length
            ) {
              ruElement.classList.add('active-object');
            }
            cabinetOpening.appendChild(ruElement);
          }

          // adding cabinet to dom
          scene.appendChild(cabElement);
          cabElement.appendChild(cabinetOpening);
        }
      }
    } else {
      // draw our device/accessory
      const ru = project.elevations
        .filter(
          (ele) =>
            ele.cabinet.id === sessionState.editMode.singleModeObject.parentId
        )[0]
        .cabinet.ruData.filter(
          (ru) => ru.id === sessionState.editMode.singleModeObject.itemId
        )[0];
      const ruHeight = ru.populator ? ru.populator.ruSpan * 1.75 : 1.75;
      const ruContainer = document.createElement('div');
      ruContainer.id = ru.id;
      ruContainer.setAttribute(
        'data-parentid',
        sessionState.editMode.singleModeObject.parentId
      );
      ruContainer.style.height = `${ruHeight * ppi * scale}px`;
      ruContainer.style.width = `${19 * ppi * scale}px`;
      ruContainer.style.backgroundColor = '#ffffff';
      ruContainer.classList.add('cabinet');
      ruContainer.innerHTML = ru.populator ? ru.populator.name : '';
      ruContainer.setAttribute('data-type', ObjectType.RU);

      // handling mode
      if (sessionState.editMode.mode === EditMode.RU) {
        ruContainer.style.pointerEvents = 'auto';
        ruContainer.onclick = (event) => this.selectItem(event);
        ruContainer.classList.add('active-mode');
      } else {
        ruContainer.style.pointerEvents = 'none';
      }
      // handling if active
      if (
        !!sessionState.activeItems.length &&
        !!sessionState.activeItems.filter((item) => item.itemId === ru.id)
          .length
      ) {
        ruContainer.classList.add('active-object');
      }
      scene.appendChild(ruContainer);
    }
  }

  private async selectItem(event: MouseEvent) {
    const append = event.ctrlKey;
    const id = (event.target as any).id;
    const parentId = (event.target as any).dataset.parentid;
    const type = (event.target as any).dataset.type;
    const newState = await this.elevationService.sessionState
      .pipe(
        map((currentState) => {
          if (
            !!currentState.activeItems.filter((item) => item.itemId === id)
              .length
          ) {
            // unset active object if is active already
            const activeItems = currentState.activeItems.filter(
              (item) => item.itemId !== id
            );
            return { ...currentState, activeItems };
          } else {
            const activeItem: ItemRef = { itemId: id, parentId, type };
            const activeItems = append
              ? [...currentState.activeItems, activeItem]
              : [activeItem];
            return { ...currentState, activeItems };
          }
        }),
        take(1)
      )
      .toPromise();
    this.elevationService.updateSessionState(newState);
  }

  // adjustments to session state

  private calculateScale(canvas: HTMLElement): number {
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    const sceneWidth = document.getElementById('scene').clientWidth;
    const sceneHeight = document.getElementById('scene').clientHeight;
    if (sceneWidth > sceneHeight) {
      // need to scale to fit width
      return (canvasWidth / (sceneWidth * this.pixelsPerInch)) * 0.95;
    } else {
      // need to scale to fit height
      return (canvasHeight / (sceneHeight * this.pixelsPerInch)) * 0.95;
    }
  }

  async changeEditMode(newEditMode: EditMode) {
    function handleEditModeUpdate(
      currentSessionState: SessionState,
      project: Project
    ) {
      const currentEditMode = currentSessionState.editMode.mode;
      let newSessionState: SessionState | undefined;
      if (
        newEditMode === EditMode.CAB &&
        currentSessionState.editMode.ruView !== ModeView.SINGLE
      ) {
        if (currentEditMode !== EditMode.CAB) {
          // toggle to cab mode from another mode
          newSessionState = {
            ...currentSessionState,
            editMode: {
              ...currentSessionState.editMode,
              mode: newEditMode
            }
          };
        } else {
          // toggle between single and multi cab mode
          if (
            currentSessionState.editMode.cabView === ModeView.SINGLE &&
            project.elevations.length > 1
          ) {
            // toggle to multi mode (only if multiple elevations exist in project)
            const cabView = ModeView.MULTI;
            newSessionState = {
              ...currentSessionState,
              editMode: {
                ...currentSessionState.editMode,
                singleModeObject: undefined,
                cabView
              }
            };
          } else if (
            // toggle to single mode (only if single item is currently selected)
            currentSessionState.editMode.cabView === ModeView.MULTI &&
            currentSessionState.activeItems.length === 1
          ) {
            const singleModeObject = currentSessionState.activeItems[0];
            const cabView = ModeView.SINGLE;
            newSessionState = {
              ...currentSessionState,
              editMode: {
                ...currentSessionState.editMode,
                singleModeObject,
                cabView
              }
            };
          }
        }
      } else if (newEditMode === EditMode.RU) {
        if (currentEditMode !== EditMode.RU) {
          newSessionState = {
            ...currentSessionState,
            editMode: {
              ...currentSessionState.editMode,
              mode: newEditMode
            }
          };
        } else {
          if (
            currentSessionState.editMode.ruView === ModeView.MULTI &&
            currentSessionState.activeItems.length === 1 &&
            !!currentSessionState.activeItems.filter(
              (item) => item.type === ObjectType.RU
            ).length
          ) {
            const singleModeObject = currentSessionState.activeItems[0];
            const ruView = ModeView.SINGLE;
            newSessionState = {
              ...currentSessionState,
              editMode: {
                ...currentSessionState.editMode,
                singleModeObject,
                ruView
              }
            };
          } else if (currentSessionState.editMode.ruView === ModeView.SINGLE) {
            // setting singleModeObjectId back to cabinet id if cabView is still set to single
            const singleModeObject: ItemRef =
              currentSessionState.editMode.cabView === ModeView.SINGLE
                ? {
                    type: ObjectType.CAB,
                    parentId:
                      currentSessionState.editMode.singleModeObject.parentId,
                    itemId: project.elevations.filter(
                      (ele) =>
                        ele.cabinet.id ===
                        currentSessionState.editMode.singleModeObject.parentId
                    )[0].cabinet.id
                  }
                : undefined;

            newSessionState = {
              ...currentSessionState,
              editMode: {
                ...currentSessionState.editMode,
                singleModeObject,
                ruView: ModeView.MULTI
              }
            };
          }
          // handle toggling multi and edit
        }
      } else if (
        newEditMode === EditMode.INTEGRATE &&
        currentEditMode !== EditMode.INTEGRATE
      ) {
        newSessionState = {
          ...currentSessionState,
          editMode: {
            ...currentSessionState.editMode,
            mode: newEditMode
          }
        };
      }

      return newSessionState;
    }

    const newSettings: SessionState | undefined = await this.sessionState
      .pipe(
        switchMap((currentSettings) =>
          this.projectState.pipe(
            map((project) => handleEditModeUpdate(currentSettings, project))
          )
        ),
        take(1)
      )
      .toPromise();

    if (newSettings) {
      this.elevationService.updateSessionState(newSettings);
    }
  }

  async zoom(amount: number) {
    const newSettings = await this.sessionState
      .pipe(
        map((currentSettings) => {
          let scale =
            Math.round(currentSettings.scale * 100 + amount * 100) / 100;
          scale = scale > 0.01 ? scale : 0.01;
          return {
            ...currentSettings,
            scale
          };
        }),
        take(1)
      )
      .toPromise();
    this.sessionState.next(newSettings);
  }

  unsetActive() {
    this.elevationService.unsetActive();
  }
}
