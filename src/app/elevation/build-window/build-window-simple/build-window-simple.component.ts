import {
  Component,
  ViewChild,
  ElementRef,
  ViewEncapsulation
} from '@angular/core';
import { RendererService } from './build-window-simple-renderer.service';

@Component({
  selector: 'app-build-window-simple',
  templateUrl: './build-window-simple.component.html',
  styleUrls: ['./build-window-simple.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class BuildWindowSimpleComponent {
  @ViewChild('project') set projectElement(elementRef: ElementRef | undefined) {
    if (!!elementRef) {
      this.renderer.init(elementRef.nativeElement.id);
    }
  }

  constructor(private renderer: RendererService) {}
}
