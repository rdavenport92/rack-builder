import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';

import { interval, Subscription } from 'rxjs';
import { tap, map, distinctUntilChanged } from 'rxjs/operators';

import { ElevationService } from '../elevation.service';

@Component({
  selector: 'app-build-window',
  templateUrl: './build-window.component.html',
  styleUrls: ['./build-window.component.scss']
})
export class BuildWindowComponent implements OnDestroy {
  @ViewChild('threeContainer') set threeContainer(elementRef: ElementRef) {
    this.threeContainerRef = elementRef;
    this.elevationService.attachThreeToDom(elementRef.nativeElement);
  }

  threeContainerRef: ElementRef;

  threeContainerSize = interval(60).pipe(
    map(() => [
      this.threeContainerRef.nativeElement.offsetWidth,
      this.threeContainerRef.nativeElement.offsetHeight
    ]),
    distinctUntilChanged((prev, current) => {
      return prev[0] === current[0] && prev[1] === current[1];
    }),
    tap((newDims: [number, number]) => {
      this.elevationService.updateRendererSize(...newDims);
    })
  );
  threeContainerSizeSub: Subscription;

  constructor(private elevationService: ElevationService) {
    this.threeContainerSizeSub = this.threeContainerSize.subscribe();
  }

  ngOnDestroy() {
    this.threeContainerSizeSub.unsubscribe();
  }
}
