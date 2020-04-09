import 'reflect-metadata';
import '../polyfills';

import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { MaterialDepsModule } from './shared/modules/material-deps.module';
import { ElevationComponent } from './elevation/elevation.component';
import { BuildWindowComponent } from './elevation/build-window/build-window.component';
import { SettingsComponent } from './elevation/settings/settings.component';
import { ItemEditorComponent } from './elevation/item-editor/item-editor.component';
import { BuildWindowSimpleComponent } from './elevation/build-window/build-window-simple/build-window-simple.component';
import { CabinetEditorComponent } from './elevation/item-editor/cabinet-editor/cabinet-editor.component';
import { PopulatorEditorComponent } from './elevation/item-editor/populator-editor/populator-editor.component';
import { CableEditorComponent } from './elevation/item-editor/cable-editor/cable-editor.component';
import { MainPanelComponent } from './elevation/item-editor/main-panel/main-panel.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    ElevationComponent,
    BuildWindowComponent,
    SettingsComponent,
    ItemEditorComponent,
    BuildWindowSimpleComponent,
    CabinetEditorComponent,
    PopulatorEditorComponent,
    CableEditorComponent,
    MainPanelComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    AppRoutingModule,
    MaterialDepsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
