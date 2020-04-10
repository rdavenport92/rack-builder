import { Component, Input } from '@angular/core';
import { ElevationService } from '../../elevation.service';
import { map, tap, filter } from 'rxjs/operators';
import { RUData, ItemRef } from '../../elevation';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-populator-editor',
  templateUrl: './populator-editor.component.html',
  styleUrls: ['./populator-editor.component.scss']
})
export class PopulatorEditorComponent {
  @Input() activeItemRef: ItemRef | undefined;

  currentRU: Observable<
    RUData | undefined
  > = this.elevationService.currentProject.pipe(
    map((project) => {
      if (this.activeItemRef) {
        return project.elevations
          .filter((ele) => ele.cabinet.id === this.activeItemRef.parentId)[0]
          .cabinet.ruData.filter(
            (ru) => ru.id === this.activeItemRef.itemId
          )[0];
      }
    }),
    filter((ru) => !!ru)
  );

  ruLocation = this.currentRU.pipe(map((ru) => ru.location));

  selectedPopulator = this.fb.control({});

  populatorLibrary = this.elevationService.populatorLibrary;

  constructor(
    private elevationService: ElevationService,
    private fb: FormBuilder
  ) {}

  updateRU() {
    this.elevationService.updateRU(
      this.selectedPopulator.value,
      this.activeItemRef
    );
  }
}
