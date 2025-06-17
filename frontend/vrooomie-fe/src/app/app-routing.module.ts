import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { MyTripComponent } from './components/my-trip/my-trip.component';
import { BecomeCarOwnerComponent } from './components/become-car-owner/become-car-owner.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'become-car-owner', component: BecomeCarOwnerComponent},
  { path: 'my-trips', component: MyTripComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
