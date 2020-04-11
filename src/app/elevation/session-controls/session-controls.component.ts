import { Component } from '@angular/core';
import { EditMode, Orientation } from '../elevation';
import { map } from 'rxjs/operators';
import { RendererService } from '../build-window/build-window-simple/build-window-simple-renderer.service';

@Component({
  selector: 'app-session-controls',
  templateUrl: './session-controls.component.html',
  styleUrls: ['./session-controls.component.scss']
})
export class SessionControlsComponent {
  constructor(private renderer: RendererService) {}

  projectLoaded = this.renderer.projectState.pipe(
    map((project) => !!project.elevations.length)
  );

  sessionState = this.renderer.sessionState;

  editMode = this.sessionState.pipe(
    map((sessionState) => sessionState.editMode.mode)
  );

  cabView = this.sessionState.pipe(
    map((sessionState) => sessionState.editMode.cabView)
  );

  ruView = this.sessionState.pipe(
    map((sessionState) => sessionState.editMode.ruView)
  );

  zoomValue = this.sessionState.pipe(
    map((sessionState) => sessionState.scale * 100)
  );

  orientation = this.sessionState.pipe(
    map((sessionState) => sessionState.orientation)
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

  updateOrientation(orientation: Orientation) {
    this.renderer.updateOrientation(orientation);
  }
}
