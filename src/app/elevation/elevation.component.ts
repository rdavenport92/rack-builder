import { Component } from '@angular/core';
import { ElevationService } from './elevation.service';

@Component({
  selector: 'app-elevation',
  templateUrl: './elevation.component.html',
  styleUrls: ['./elevation.component.scss']
})
export class ElevationComponent {
  libExpanded = true;

  constructor(private elevationService: ElevationService) {}
}
