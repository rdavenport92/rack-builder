import {
  Component,
  ViewChild,
  ElementRef,
  OnDestroy,
  Input
} from '@angular/core';

import { interval, Subscription } from 'rxjs';
import { tap, map, distinctUntilChanged, filter } from 'rxjs/operators';

import { ElevationService } from '../elevation.service';
import { Elevation } from '../elevation';
import {
  BuildWindowSimpleRendererService,
  EditMode
} from './build-window-simple/build-window-simple-renderer.service';

@Component({
  selector: 'app-build-window',
  templateUrl: './build-window.component.html',
  styleUrls: ['./build-window.component.scss']
})
export class BuildWindowComponent implements OnDestroy {
  // @ViewChild('threeContainer') set threeContainer(
  //   elementRef: ElementRef | undefined
  // ) {
  //   if (elementRef) {
  //     this.threeContainerRef = elementRef;
  //     this.elevationService.attachThreeToDom(elementRef.nativeElement);
  //   }
  // }

  // threeContainerRef: ElementRef | undefined;

  // threeContainerSize = interval(60).pipe(
  //   map(() => {
  //     if (this.threeContainerRef) {
  //       return [
  //         this.threeContainerRef.nativeElement.offsetWidth,
  //         this.threeContainerRef.nativeElement.offsetHeight
  //       ];
  //     }
  //   }),
  //   filter(elementRef => !!elementRef),
  //   distinctUntilChanged((prev, current) => {
  //     return prev[0] === current[0] && prev[1] === current[1];
  //   }),
  //   tap((newDims: [number, number]) => {
  //     this.elevationService.updateRendererSize(...newDims);
  //   })
  // );
  // threeContainerSizeSub: Subscription;

  constructor(
    private elevationService: ElevationService,
    private renderer: BuildWindowSimpleRendererService
  ) {
    //this.threeContainerSizeSub = this.threeContainerSize.subscribe();
  }

  ngOnDestroy() {
    //this.threeContainerSizeSub.unsubscribe();
  }

  projectLoaded = this.renderer.projectState.pipe(
    map(project => !!project.elevations.length)
  );

  editMode = this.renderer.rendererSettings.pipe(
    map(settings => settings.editMode.mode)
  );

  cabMode = this.renderer.rendererSettings.pipe(
    map(settings => settings.editMode.cabMode)
  );

  zoomValue = this.renderer.rendererSettings.pipe(
    map(settings => settings.scale * 100)
  );

  // settings methods

  changeEditMode(editMode: EditMode) {
    this.renderer.changeEditMode(editMode);
  }

  zoomIn() {
    this.renderer.zoom(0.04);
  }

  zoomOut() {
    this.renderer.zoom(-0.04);
  }
}
