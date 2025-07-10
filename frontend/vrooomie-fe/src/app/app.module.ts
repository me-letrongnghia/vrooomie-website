import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CarListComponent } from './components/car-list/car-list.component';
import { PromotionListComponent } from './components/promotion-list/promotion-list.component';
import { AboutUsComponent } from './components/about-us/about-us.component';
import { MyTripComponent } from './components/my-trip/my-trip.component';
import { HeroSectionComponent } from './components/hero-section/hero-section.component';
import { LocationSectionComponent } from './components/location-section/location-section.component';
import { HomeComponent } from './components/home/home.component';
import { BecomeCarOwnerComponent } from './components/become-car-owner/become-car-owner.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { UserDetailInfoComponent } from './components/user-detail-info/user-detail-info.component';
import { LoaderComponent } from './shared/loader/loader.component';

@NgModule({
  declarations: [
    AppComponent,
    CarListComponent,
    PromotionListComponent,
    AboutUsComponent,
    MyTripComponent,
    HeroSectionComponent,
    LocationSectionComponent,
    HomeComponent,
    BecomeCarOwnerComponent,
    LoginComponent,
    RegisterComponent,
    UserDetailInfoComponent,
    LoaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule
  ],
  providers: [
    provideClientHydration(withEventReplay())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
