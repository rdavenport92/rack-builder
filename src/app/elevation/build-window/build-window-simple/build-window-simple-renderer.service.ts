import { Injectable, OnDestroy } from '@angular/core';
import {
  Project,
  ObjectType,
  ItemRef,
  SessionState,
  EditMode,
  ModeView,
  Cabinet,
  RUData
} from '../../elevation';
import { ElevationService } from '../../elevation.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { tap, filter, take, map, switchMap, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class RendererService implements OnDestroy {
  private pixelsPerInch = 96; // probably will want to calculate this in main process to be more accurate per device

  private canvasId: string | undefined;

  canvasReady = new BehaviorSubject(false);
  projectState = this.elevationService.projectState;
  sessionState = this.elevationService.sessionState;

  rendererUpdateTrigger = combineLatest([
    this.canvasReady,
    this.projectState,
    this.sessionState
  ])
    .pipe(
      filter(
        ([canvasReady, projectState, _settings]) =>
          // only rendering updates if the canvas is attached and the project is loaded
          !!canvasReady && !!projectState
      ),
      tap(([_canvasReady, projectState, settings]) =>
        this.renderUpdate(projectState, settings)
      )
    )
    .subscribe();

  constructor(private elevationService: ElevationService) {
    window.addEventListener('keydown', (e) => this.registerHotkeys(e));
  }

  ngOnDestroy() {
    this.rendererUpdateTrigger.unsubscribe();
    window.removeEventListener('keydown', this.registerHotkeys);
  }

  async registerHotkeys(e: KeyboardEvent) {
    let sessionState: SessionState | undefined;
    switch (e.keyCode) {
      case 97: // Numpad1
        sessionState = await this.changeEditMode(EditMode.CAB);
        if (sessionState) {
          this.bringSceneIntoFrame(sessionState);
        }
        break;
      case 98: // Numpad2
        sessionState = await this.changeEditMode(EditMode.RU);
        if (sessionState) {
          this.bringSceneIntoFrame(sessionState);
        }
        break;
      case 99: // Numpad3
        sessionState = await this.changeEditMode(EditMode.INTEGRATE);
        if (sessionState) {
          this.bringSceneIntoFrame(sessionState);
        }
        break;
      case 110: // . on keypad
        sessionState = await this.elevationService.sessionState
          .pipe(take(1))
          .toPromise();
        this.bringSceneIntoFrame(sessionState);
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

  init(canvasId: string) {
    // create the scene
    this.canvasId = canvasId;
    const canvas = document.getElementById(this.canvasId);
    const projectElementChild = document.createElement('div');
    projectElementChild.classList.add('project-child');
    const scene = document.createElement('div');
    scene.id = 'scene';
    scene.classList.add('scene');
    canvas.appendChild(projectElementChild);
    projectElementChild.appendChild(scene);

    // notify renderer that canvas is ready
    this.canvasReady.next(true);
  }

  private renderUpdate(update: Project, sessionState: SessionState) {
    const scene = document.getElementById('scene');
    if (!sessionState.scale && !!update.elevations.length) {
      // project scale initializes at 0 so that we can bring into frame on init
      const initSessionState = { ...sessionState, scale: 0.01 };
      this.drawScene(scene, update, initSessionState);
      this.bringSceneIntoFrame(initSessionState);
    } else if (!!sessionState.scale && !!update) {
      // need to begin each draw with a clean slate
      scene.innerHTML = '';
      this.drawScene(scene, update, sessionState);
    }
  }

  bringSceneIntoFrame(sessionState: SessionState) {
    const newScale = this.calculateScale(sessionState.scale);
    const newSessionState: SessionState = {
      ...sessionState,
      scale: newScale
    };
    this.elevationService.updateSessionState(newSessionState);
  }

  private calculateScale(prevScale: number): number {
    const ppi = this.pixelsPerInch;
    const canvas = document.getElementById(this.canvasId);
    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    const sceneWidth = document.getElementById('scene').clientWidth;
    const sceneHeight = document.getElementById('scene').clientHeight;

    const trueSceneHeight = sceneHeight / ppi / prevScale;
    const trueSceneWidth = sceneWidth / ppi / prevScale;
    const unscaledSceneWidth = trueSceneWidth * ppi;
    const unscaledSceneHeight = trueSceneHeight * ppi;

    const widthDiff = canvasWidth - unscaledSceneWidth;
    const heightDiff = canvasHeight - unscaledSceneHeight;

    if (trueSceneWidth > trueSceneHeight && widthDiff < heightDiff) {
      return +((canvasWidth / unscaledSceneWidth) * 0.95).toFixed(2);
    } else {
      return +((canvasHeight / unscaledSceneHeight) * 0.95).toFixed(2);
    }
  }

  private drawScene(
    scene: HTMLElement,
    project: Project,
    sessionState: SessionState
  ) {
    if (sessionState.editMode.ruView !== ModeView.SINGLE) {
      // draw cabinets if not in ruView single view mode
      if (sessionState.editMode.cabView === ModeView.MULTI) {
        // loop through and draw all cabinets
        const cabinets = project.elevations.map((ele) => ele.cabinet);
        for (let i = 0; i < cabinets.length; i++) {
          const cabinet = cabinets[i];
          this.drawCabinet(cabinet, scene, sessionState);
        }
      } else {
        // only drawing the singleMode cabinet
        const cabinetId =
          // will always draw single cabinet if only 1 cabinet in project
          project.elevations.length === 1
            ? project.elevations[0].cabinet.id
            : // if toggling from multi mode - referencing the selected rack
              sessionState.editMode.singleModeObject.parentId;
        const cabinet = project.elevations.filter(
          (ele) => ele.cabinet.id === cabinetId
        )[0].cabinet;
        this.drawCabinet(cabinet, scene, sessionState);
      }
    } else {
      // drawing a single RU container for single view mode
      const ru = project.elevations
        .filter(
          (ele) =>
            ele.cabinet.id === sessionState.editMode.singleModeObject.parentId
        )[0]
        .cabinet.ruData.filter(
          (ru) => ru.id === sessionState.editMode.singleModeObject.itemId
        )[0];
      this.drawSingleRUContainer(ru, scene, sessionState);
    }
  }

  private drawCabinet(
    cabinet: Cabinet,
    scene: HTMLElement,
    sessionState: SessionState
  ) {
    const ppi = this.pixelsPerInch;
    const scale = sessionState.scale;
    const { width, height } = cabinet.dimensions;
    // drawing cabinet
    const cabElement = document.createElement('div');
    cabElement.id = cabinet.id;
    cabElement.setAttribute('data-parentid', cabinet.id);
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
      !!sessionState.activeItems.filter((item) => item.itemId === cabinet.id)
        .length
    ) {
      cabElement.classList.add('active-object');
    }

    // drawing cabinet opening
    const cabinetOpening = document.createElement('div');
    cabinetOpening.id = `${cabinet.id}-opening`;
    cabinetOpening.classList.add('cabinet-opening');
    cabinetOpening.style.width = `${19 * ppi * scale}px`;
    cabinetOpening.style.height = `${cabinet.ruCount * 1.75 * ppi * scale}px`;
    cabinetOpening.style.bottom = `${cabinet.openingOffset * ppi * scale}px`;
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
      ruSpan = !!ru.populator ? ru.populator.ruSpan - 1 : ruSpan;
      this.drawRU(ru, cabinet.id, cabinetOpening, sessionState);
    }
    // adding cabinet elements to dom
    scene.appendChild(cabElement);
    cabElement.appendChild(cabinetOpening);
  }

  private drawSingleRUContainer(
    ru: RUData,
    scene: HTMLElement,
    sessionState: SessionState
  ) {
    const ppi = this.pixelsPerInch;
    const scale = sessionState.scale;
    const parentId = sessionState.editMode.singleModeObject.parentId;
    const ruHeight = ru.populator ? ru.populator.ruSpan * 1.75 : 1.75;

    const ruContainer = document.createElement('div');
    ruContainer.style.height = `${ruHeight * ppi * scale}px`;
    ruContainer.style.width = `${19 * ppi * scale}px`;
    ruContainer.classList.add('ru-single-container');
    this.drawRU(ru, parentId, ruContainer, sessionState);

    scene.appendChild(ruContainer);
  }

  private drawRU(
    ru: RUData,
    parentId: string,
    ruContainerElement: HTMLElement,
    sessionState: SessionState
  ) {
    const ruElement = document.createElement('div');
    ruElement.id = ru.id;
    ruElement.setAttribute('data-parentid', parentId);
    ruElement.setAttribute('data-type', ObjectType.RU);
    ruElement.classList.add('ru');
    // handling if populated
    if (ru.populator) {
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
      !!sessionState.activeItems.filter((item) => item.itemId === ru.id).length
    ) {
      ruElement.classList.add('active-object');
    }
    ruContainerElement.appendChild(ruElement);
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
            // if multiple activeItems exist, need to ensure that they belong to the same parent
            currentSessionState.activeItems.reduce(
              (uniqueParents, activeItem) =>
                // if discovering a unique parentId
                uniqueParents.filter(
                  (item) => item.parentId === activeItem.parentId
                ).length > 0
                  ? uniqueParents
                  : [...uniqueParents, activeItem],
              []
            ).length === 1
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

    const newSessionState: SessionState | undefined = await this.sessionState
      .pipe(
        switchMap((currentSessionState) =>
          this.projectState.pipe(
            map((project) => handleEditModeUpdate(currentSessionState, project))
          )
        ),
        take(1)
      )
      .toPromise();

    if (newSessionState) {
      this.elevationService.updateSessionState(newSessionState);
      return newSessionState;
    }
  }

  async zoom(amount: number) {
    const newSessionState = await this.sessionState
      .pipe(
        map((currentSessionState) => {
          let scale =
            Math.round(currentSessionState.scale * 100 + amount * 100) / 100;
          scale = scale > 0.01 ? scale : 0.01;
          return {
            ...currentSessionState,
            scale
          };
        }),
        take(1)
      )
      .toPromise();
    this.elevationService.updateSessionState(newSessionState);
  }

  unsetActive() {
    this.elevationService.unsetActive();
  }
}
