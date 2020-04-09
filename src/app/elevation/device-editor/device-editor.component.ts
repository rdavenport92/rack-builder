import { Component } from '@angular/core';
import { ElevationService } from '../elevation.service';

@Component({
  selector: 'app-device-editor',
  templateUrl: './device-editor.component.html',
  styleUrls: ['./device-editor.component.scss']
})
export class DeviceEditorComponent {
  activeItem = this.elevationService.activeItem;

  constructor(private elevationService: ElevationService) {}
}
