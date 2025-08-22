import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { MyTripComponent } from './components/my-trip/my-trip.component';
import { BecomeCarOwnerComponent } from './components/become-car-owner/become-car-owner.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserDetailInfoComponent } from './components/user-detail-info/user-detail-info.component';
import { CarDetailComponent } from './components/car-detail/car-detail.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'become-car-owner', component: BecomeCarOwnerComponent},
  { path: 'my-trips', component: MyTripComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'user-profile', component: UserDetailInfoComponent },
  { path: 'car/:id', component: CarDetailComponent },
  { path: 'auth/callback', component: AuthCallbackComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
