import { Component } from '@angular/core';

import { BuildLibraryService } from './build-library.service';

@Component({
  selector: 'app-build-library',
  templateUrl: './build-library.component.html',
  styleUrls: ['./build-library.component.scss']
})
export class BuildLibraryComponent {
  devices = this.buildLibraryService.devices;
  itemTypes = this.buildLibraryService.itemTypes;
  constructor(private buildLibraryService: BuildLibraryService) {}
}