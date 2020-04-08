import { Injectable } from '@angular/core';
import { Elevation, Cabinet } from '../../elevation';
import { ElevationService } from '../../elevation.service';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { tap, filter, take, map } from 'rxjs/operators';

interface RendererSettings {
  scale: number;
}

const initialSettings: RendererSettings = {
  scale: 0
};

@Injectable({
  providedIn: 'root'
})
export class BuildWindowSimpleRendererService {
  private pixelsPerInch = 96; // probably will want to calculate this in main process to be more accurate per device

  canvas = new BehaviorSubject(undefined);
  projectState = this.elevationService.currentProject;
  rendererSettings = new BehaviorSubject(initialSettings);

  renderProject = combineLatest([
    this.canvas,
    this.projectState,
    this.rendererSettings
  ]).pipe(
    filter(([canvas, update, _settings]) => !!canvas && !!update),
    tap(([canvas, update, settings]) =>
      this.renderUpdate(canvas, update, settings)
    )
  );

  constructor(private elevationService: ElevationService) {
    this.renderProject.subscribe();
    console.log(window);
  }

  attachCanvas(element: HTMLElement) {
    const projectElementChild = document.createElement('div');
    projectElementChild.classList.add('project-child');
    const scene = document.createElement('div');
    scene.id = 'scene';
    scene.style.display = 'flex';
    scene.style.alignItems = 'flex-end';
    element.appendChild(projectElementChild);
    projectElementChild.appendChild(scene);
    this.canvas.next(element);
  }

  private renderUpdate(
    canvas: HTMLElement,
    update: Elevation[],
    settings: RendererSettings
  ) {
    if (!settings.scale && !!canvas && !!update.length) {
      // scale has not been set yet - setting temp scale to 0.01 so that we can draw
      // cabinets and get an idea for what the initial scale needs to be.
      const tempSettings = { ...settings, scale: 0.01 };
      this.drawCabinets(
        canvas,
        update.map(el => el.cabinet),
        tempSettings
      );
      // by this point, the canvas will contain accurate dimensions which will allow us to set
      // a more appropriate initial scale based on the dimensions of the entire scene
      const newScale = this.calculateScale(canvas);
      this.rendererSettings.next({ ...settings, scale: newScale });
    } else if (!!settings.scale && !!canvas && !!update) {
      this.drawCabinets(
        canvas,
        update.map(el => el.cabinet),
        settings
      );
    }
  }

  private drawCabinets(
    canvas: HTMLElement,
    cabinets: Cabinet[],
    settings: RendererSettings
  ) {
    for (let i = 0; i < cabinets.length; i++) {
      const cabinet = cabinets[i];
      let cabElement = document.getElementById(`${cabinet.id}`);
      let deviceOpening = document.getElementById(`${cabinet.id}-opening`);
      if (!cabElement) {
        // creating cabinet
        cabElement = document.createElement('div');
        cabElement.id = cabinet.id;
        //cabElement.style.border = '1px solid #FFFFFF';
        cabElement.style.backgroundColor = '#000000';
        cabElement.style.position = 'relative';
        cabElement.style.display = 'flex';
        cabElement.style.justifyContent = 'center';
        cabElement.style.alignItems = 'flex-end';
        // creating device opening
        deviceOpening = document.createElement('div');
        deviceOpening.id = `${cabinet.id}-opening`;
        deviceOpening.style.border = '1px solid #FFFFFF';
        deviceOpening.style.position = 'absolute';
        deviceOpening.style.flex = '1';
        deviceOpening.style.display = 'flex';
        deviceOpening.style.flexDirection = 'column';
        // creating ru locations
        for (let i = cabinet.ruCount - 1; i >= 0; i--) {
          const ru = document.createElement('div');
          ru.id = `${cabinet.id}-ru-${i + 1}`;
          ru.classList.add('ru');
          ru.style.flex = '1';
          ru.style.border = '.5px solid white';
          ru.onclick = event => this.selectItem(event);
          deviceOpening.appendChild(ru);
        }
        // appending all divs
        const scene = document.getElementById('scene');
        scene.appendChild(cabElement);
        cabElement.appendChild(deviceOpening);
      }
      // updating cabinet
      cabElement.style.width = `${cabinet.dimensions.width *
        this.pixelsPerInch *
        settings.scale}px`;
      cabElement.style.height = `${cabinet.dimensions.height *
        this.pixelsPerInch *
        settings.scale}px`;
      cabElement.style.margin = '4px';
      // updating device opening
      deviceOpening.style.width = `${19 *
        this.pixelsPerInch *
        settings.scale}px`;
      deviceOpening.style.height = `${cabinet.ruCount *
        1.75 *
        this.pixelsPerInch *
        settings.scale}px`;
      deviceOpening.style.bottom = `${cabinet.openingOffset *
        this.pixelsPerInch *
        settings.scale}px`;
    }
  }

  private selectItem(event: MouseEvent) {
    this.elevationService.activeItemId.next((event.target as any).id);
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

  async zoom(amount: number) {
    const newSettings = await this.rendererSettings
      .pipe(
        map(currentSettings => {
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
    this.rendererSettings.next(newSettings);
  }
}
