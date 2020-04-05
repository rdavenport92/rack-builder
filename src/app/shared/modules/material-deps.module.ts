import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';

const materialDeps = [MatToolbarModule, MatTabsModule];

@NgModule({
  imports: materialDeps,
  exports: materialDeps
})
export class MaterialDepsModule {}
