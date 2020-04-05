import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PageNotFoundComponent } from './shared/components';
import { ElevationComponent } from './elevation/elevation.component';
import { CablingComponent } from './cabling/cabling.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'elevation',
    pathMatch: 'full'
  },
  {
    path: 'elevation',
    component: ElevationComponent
  },
  {
    path: 'cabling',
    component: CablingComponent
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule {}
