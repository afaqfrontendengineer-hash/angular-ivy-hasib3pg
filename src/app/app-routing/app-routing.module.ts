import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { WhatsappComponent } from '../whatsapp/whatsapp.component';
import { GetInspectionComponent } from '../get-inspection/get-inspection.component';
import { ViolationMapperComponent } from '../violation-mapper/violation-mapper.component';
import { AuthGuard } from '../guards/auth.guard';
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'whatsapp', component: WhatsappComponent },
  {
    path: 'violation-mapper',
    component: ViolationMapperComponent,
    canActivate: [AuthGuard],
  },
  { path: 'get-inspection', component: GetInspectionComponent },
  { path: '**', redirectTo: 'login' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
  providers: [],
})
export class AppRoutingModule {}
