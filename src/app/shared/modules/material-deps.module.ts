import { NgModule } from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

const materialDeps = [
  MatTabsModule,
  MatSelectModule,
  MatInputModule,
  MatDividerModule,
  MatSidenavModule,
  MatButtonModule,
  MatIconModule,
  MatCardModule
];

@NgModule({
  imports: materialDeps,
  exports: materialDeps
})
export class MaterialDepsModule {}
