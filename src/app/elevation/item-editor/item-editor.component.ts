import { Component } from '@angular/core';
import { ElevationService } from '../elevation.service';

@Component({
  selector: 'app-item-editor',
  templateUrl: './item-editor.component.html',
  styleUrls: ['./item-editor.component.scss'],
})
export class ItemEditorComponent {
  activeItems = this.elevationService.activeItems;

  constructor(private elevationService: ElevationService) {}
}
