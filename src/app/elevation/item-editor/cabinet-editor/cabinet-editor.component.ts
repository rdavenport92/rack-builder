import { Component } from '@angular/core';
import { RendererService } from '../../build-window/build-window-simple/build-window-simple-renderer.service';

@Component({
  selector: 'app-cabinet-editor',
  templateUrl: './cabinet-editor.component.html',
  styleUrls: ['./cabinet-editor.component.css']
})
export class CabinetEditorComponent {
  sessionState = this.renderer.sessionState;

  constructor(private renderer: RendererService) {}
}
