import {
  Component,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { BuildWindowSimpleRendererService } from './build-window-simple-renderer.service';

@Component({
  selector: 'app-build-window-simple',
  templateUrl: './build-window-simple.component.html',
  styleUrls: ['./build-window-simple.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BuildWindowSimpleComponent {
  @ViewChild('project') set projectElement(elementRef: ElementRef) {
    this.renderer.attachCanvas(elementRef.nativeElement);
  }

  constructor(private renderer: BuildWindowSimpleRendererService) {}
}
