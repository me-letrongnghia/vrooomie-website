import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CarListComponent } from './components/car-list/car-list.component';
import { PromotionListComponent } from './components/promotion-list/promotion-list.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { LocationSectionComponent } from './components/location-section/location-section.component';
import { HomeComponent } from './components/home/home.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UserDetailInfoComponent } from './components/user-detail-info/user-detail-info.component';
import { LoaderComponent } from './shared/loader/loader.component';
import { CarDetailComponent } from './components/car-detail/car-detail.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { DeliveryAddressModalComponent } from './components/delivery-address-modal/delivery-address-modal.component';
import { AuthCallbackComponent } from './components/auth-callback/auth-callback.component';
import { PaymentSuccessComponent } from './components/payment-success/payment-success.component';
import { PaymentCancelComponent } from './components/payment-cancel/payment-cancel.component';
import { CarManagementComponent } from './components/car-management/car-management.component';
import { MyCarsComponent } from './components/my-cars/my-cars.component';
import { MyTripsComponent } from './components/my-trips/my-trips.component';

@NgModule({
  declarations: [
    AppComponent,
    CarListComponent,
    PromotionListComponent,
    AboutUsComponent,
    HeroSectionComponent,
    LocationSectionComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    UserDetailInfoComponent,
    LoaderComponent,
    CarDetailComponent,
    DeliveryAddressModalComponent,
    AuthCallbackComponent,
    PaymentSuccessComponent,
    PaymentCancelComponent,
    CarManagementComponent,
    MyCarsComponent,
    MyTripsComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [
    provideClientHydration(withEventReplay()),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
