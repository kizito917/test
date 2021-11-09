import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { AppRoutingModule } from "./app-routing.module";

import { AppComponent } from "./app.component";
import {
  AuthGuard,
  AuthService,
  SocketService,
  EventSocketService,
  AgoraRtcStreamHandlerService,
} from "./shared";
import { SharedModule } from "./shared/shared.module";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { ToastrModule } from "ngx-toastr";

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    SharedModule.forRoot(),
    NgbModule,
    ToastrModule.forRoot(),
  ],
  providers: [
    AuthGuard,
    AuthService,
    SocketService,
    EventSocketService,
    AgoraRtcStreamHandlerService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
