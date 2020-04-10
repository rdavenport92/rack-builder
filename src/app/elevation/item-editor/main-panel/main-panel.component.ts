import { Component, OnInit } from '@angular/core';
import { ElevationService } from '../../elevation.service';
import { BuildWindowSimpleRendererService } from '../../build-window/build-window-simple/build-window-simple-renderer.service';

@Component({
  selector: 'app-main-panel',
  templateUrl: './main-panel.component.html',
  styleUrls: ['./main-panel.component.css'],
})
export class MainPanelComponent implements OnInit {
  sessionState = this.renderer.sessionState;

  constructor(private renderer: BuildWindowSimpleRendererService) {}

  ngOnInit(): void {}
}
