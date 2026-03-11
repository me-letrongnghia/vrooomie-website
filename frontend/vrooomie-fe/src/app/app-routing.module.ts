import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserDetailInfoComponent } from './components/user-detail-info/user-detail-info.component';
import { CarDetailComponent } from './components/car-detail/car-detail.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentCancelComponent } from './components/payment-cancel/payment-cancel.component';
import { CarManagementComponent } from './components/car-management/car-management.component';
import { MyCarsComponent } from './components/my-cars/my-cars.component';
import { MyTripsComponent } from './components/my-trips/my-trips.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'about-us', component: AboutUsComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'user-profile', component: UserDetailInfoComponent },
  { path: 'my-cars', component: MyCarsComponent },
  { path: 'my-trips', component: MyTripsComponent },
  { path: 'car/:id', component: CarDetailComponent },
  { path: 'car-management/:id', component: CarManagementComponent },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'payment/success', component: PaymentSuccessComponent },
  { path: 'payment/cancel', component: PaymentCancelComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
