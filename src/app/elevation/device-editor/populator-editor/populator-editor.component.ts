import { Component } from '@angular/core';
import { ElevationService } from '../../elevation.service';
import { map, tap } from 'rxjs/operators';
import { RUData } from '../../elevation';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-populator-editor',
  templateUrl: './populator-editor.component.html',
  styleUrls: ['./populator-editor.component.scss']
})
export class PopulatorEditorComponent {
  currentRU = this.elevationService.activeItem.pipe(map(item => item.item));
  ruLocation = this.currentRU.pipe(map((ru: RUData) => ru.location));

  selectedPopulator = this.fb.control({});

  populatorLibrary = this.elevationService.populatorLibrary;

  constructor(
    private elevationService: ElevationService,
    private fb: FormBuilder
  ) {}

  updateRU() {
    this.elevationService.updateRU(this.selectedPopulator.value);
  }
}
