import { Injectable, OnDestroy } from '@angular/core';
import { Project, ObjectType } from '../../elevation';
import { ElevationService } from '../../elevation.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { tap, filter, take, map, switchMap, shareReplay } from 'rxjs/operators';

export enum EditMode {
  CAB = 'cabinet',
  DEVICE = 'device',
  INTEGRATE = 'integrate',
}

enum CabMode {
  SINGLE = 'single',
  MULTI = 'multi',
}

interface RendererSettings {
  scale: number;
  editMode: {
    mode: EditMode;
    cabMode: CabMode;
  };
}

const initialSettings: RendererSettings = {
  scale: 0,
  editMode: {
    mode: EditMode.CAB,
    cabMode: CabMode.MULTI,
  },
};

@Injectable({
  providedIn: 'root',
})
export class BuildWindowSimpleRendererService implements OnDestroy {
  private pixelsPerInch = 96; // probably will want to calculate this in main process to be more accurate per device

  canvas = new BehaviorSubject(undefined);
  projectState = this.elevationService.currentProject.pipe(shareReplay(1));
  rendererSettings = new BehaviorSubject(initialSettings);

  renderProject = combineLatest([
    this.canvas,
    this.projectState,
    this.rendererSettings,
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
        this.changeEditMode(EditMode.DEVICE);
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
    settings: RendererSettings
  ) {
    if (!settings.scale && !!canvas && !!update.elevations.length) {
      // scale has not been set yet - setting temp scale to 0.01 so that we can draw
      // cabinets and get an idea for what the initial scale needs to be.
      const tempSettings = {
        ...settings,
        scale: 0.01,
      };
      this.drawCabinets(update, tempSettings);
      // by this point, the canvas will contain accurate dimensions which will allow us to set
      // a more appropriate initial scale based on the dimensions of the entire scene
      const newScale = this.calculateScale(canvas);
      this.rendererSettings.next({
        ...settings,
        scale: newScale,
        editMode: {
          ...settings.editMode,
          cabMode:
            update.elevations.length > 1 ? CabMode.MULTI : CabMode.SINGLE,
        },
      });
    } else if (!!settings.scale && !!canvas && !!update) {
      this.drawCabinets(update, settings);
    }
  }

  private drawCabinets(project: Project, settings: RendererSettings) {
    const ppi = this.pixelsPerInch;
    const scale = settings.scale;

    const scene = document.getElementById('scene');

    const cabinets = project.elevations.map((ele) => ele.cabinet);

    for (let i = 0; i < cabinets.length; i++) {
      const cabinet = cabinets[i];

      // clean slate
      let cabElement = document.getElementById(`${cabinet.id}`);
      if (cabElement) {
        scene.removeChild(cabElement);
      }

      if (
        settings.editMode.cabMode === CabMode.MULTI ||
        (settings.editMode.cabMode === CabMode.SINGLE &&
          !!project.activeItems.length &&
          !!project.activeItems.filter((item) => item.parentId === cabinet.id)
            .length) ||
        project.elevations.length === 1
      ) {
        const { width, height } = cabinet.dimensions;

        // drawing cabinet
        cabElement = document.createElement('div');
        cabElement.id = cabinet.id;
        cabElement.setAttribute('data-type', ObjectType.CAB);
        cabElement.classList.add('cabinet');
        cabElement.style.width = `${width * ppi * scale}px`;
        cabElement.style.height = `${height * ppi * scale}px`;
        cabElement.style.margin = `${4 * ppi * scale}px`;
        // handling mode
        if (settings.editMode.mode === EditMode.CAB) {
          cabElement.onclick = (event) => this.selectItem(event);
          cabElement.classList.add('active-mode');
        }
        // handling if active
        if (
          !!project.activeItems.length &&
          !!project.activeItems.filter((item) => item.item.id === cabinet.id)
            .length
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
          if (settings.editMode.mode === EditMode.DEVICE) {
            ruElement.style.pointerEvents = 'auto';
            ruElement.onclick = (event) => this.selectItem(event);
            ruElement.classList.add('active-mode');
          } else {
            ruElement.style.pointerEvents = 'none';
          }
          // handling if active
          if (
            !!project.activeItems.length &&
            !!project.activeItems.filter((item) => item.item.id === ru.id)
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
  }

  private async selectItem(event: MouseEvent) {
    const append = event.ctrlKey;
    // TODO: need to check if ctrl pressed
    // if so, continue to add to array
    // if not, need to overwrite the array
    const id = (event.target as any).id;
    const type = (event.target as any).dataset.type;
    const item = { id, type };
    const newState = await this.elevationService.currentProject
      .pipe(
        map((currentState) => {
          if (
            !!currentState.activeItems.filter((item) => item.item.id === id)
              .length
          ) {
            // unset active object if is active already
            const activeItems = currentState.activeItems.filter(
              (item) => item.item.id !== id
            );
            return { ...currentState, activeItems };
          } else {
            const activeItem = this.getActiveItem(item, currentState);
            const activeItems = append
              ? [...currentState.activeItems, activeItem]
              : [activeItem];
            return { ...currentState, activeItems };
          }
        }),
        take(1)
      )
      .toPromise();
    this.elevationService.updateState(newState);
  }

  getActiveItem(item: { id: string; type: string }, project: Project) {
    switch (item.type) {
      case ObjectType.CAB:
        const cabinet = project.elevations.filter(
          (ele) => ele.cabinet.id === item.id
        )[0].cabinet;
        return { type: item.type, item: cabinet, parentId: cabinet.id };
      case ObjectType.RU:
        const parentRack = project.elevations.filter((ele) =>
          item.id.startsWith(ele.cabinet.id)
        )[0].cabinet;
        const selectedRU = parentRack.ruData.filter(
          (ru) => ru.id === item.id
        )[0];
        return { type: item.type, item: selectedRU, parentId: parentRack.id };
      default:
        break;
    }
  }

  // adjustments to settings

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
      currentSettings: RendererSettings,
      project: Project
    ) {
      const currentEditMode = currentSettings.editMode.mode;
      let newSettings: RendererSettings | undefined;
      if (newEditMode === EditMode.CAB) {
        if (currentEditMode !== EditMode.CAB) {
          // if going to multi, need to re-populate elevations
          newSettings = {
            ...currentSettings,
            editMode: {
              ...currentSettings.editMode,
              mode: newEditMode,
            },
          };
        } else {
          if (
            currentSettings.editMode.cabMode === CabMode.SINGLE &&
            project.elevations.length > 1
          ) {
            const cabMode = CabMode.MULTI;
            newSettings = {
              ...currentSettings,
              editMode: {
                ...currentSettings.editMode,
                cabMode,
              },
            };
          } else if (
            currentSettings.editMode.cabMode === CabMode.MULTI &&
            project.activeItems.filter((item) => item.type === ObjectType.CAB)
              .length === 1
          ) {
            const cabMode = CabMode.SINGLE;
            newSettings = {
              ...currentSettings,
              editMode: {
                ...currentSettings.editMode,
                cabMode,
              },
            };
          }
        }
      } else if (
        newEditMode === EditMode.DEVICE &&
        currentEditMode !== EditMode.DEVICE
      ) {
        newSettings = {
          ...currentSettings,
          editMode: {
            ...currentSettings.editMode,
            mode: newEditMode,
          },
        };
      } else if (
        newEditMode === EditMode.INTEGRATE &&
        currentEditMode !== EditMode.INTEGRATE
      ) {
        newSettings = {
          ...currentSettings,
          editMode: {
            ...currentSettings.editMode,
            mode: newEditMode,
          },
        };
      }

      return newSettings;
    }

    const newSettings:
      | RendererSettings
      | undefined = await this.rendererSettings
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
      this.rendererSettings.next(newSettings);
    }
  }

  async zoom(amount: number) {
    const newSettings = await this.rendererSettings
      .pipe(
        map((currentSettings) => {
          let scale =
            Math.round(currentSettings.scale * 100 + amount * 100) / 100;
          scale = scale > 0.01 ? scale : 0.01;
          return {
            ...currentSettings,
            scale,
          };
        }),
        take(1)
      )
      .toPromise();
    this.rendererSettings.next(newSettings);
  }

  unsetActive() {
    this.elevationService.unsetActive();
  }
}
