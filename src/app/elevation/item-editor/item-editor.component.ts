import { Component } from '@angular/core';
import { ElevationService } from '../elevation.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-item-editor',
  templateUrl: './item-editor.component.html',
  styleUrls: ['./item-editor.component.scss']
})
export class ItemEditorComponent {
  activeItems = this.elevationService.sessionState.pipe(
    map((sessionState) => sessionState.activeItems)
  );

  constructor(private elevationService: ElevationService) {}
}
