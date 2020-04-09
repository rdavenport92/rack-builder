import { Component, Input } from '@angular/core';
import { ElevationService } from '../../elevation.service';
import { map, tap, filter } from 'rxjs/operators';
import { RUData, ActiveItem } from '../../elevation';
import { FormBuilder } from '@angular/forms';

@Component({
  selector: 'app-populator-editor',
  templateUrl: './populator-editor.component.html',
  styleUrls: ['./populator-editor.component.scss'],
})
export class PopulatorEditorComponent {
  @Input() set _activeItem(item: ActiveItem | undefined) {
    if (item) {
      this.activeItem = item;
      this.currentRU = item.item as RUData;
      this.ruLocation = this.currentRU.location;
    }
  }

  activeItem: ActiveItem | undefined;
  currentRU: RUData | undefined;
  ruLocation: string | undefined;

  selectedPopulator = this.fb.control({});

  populatorLibrary = this.elevationService.populatorLibrary;

  constructor(
    private elevationService: ElevationService,
    private fb: FormBuilder
  ) {}

  updateRU() {
    this.elevationService.updateRU(
      this.selectedPopulator.value,
      this.activeItem
    );
  }
}
