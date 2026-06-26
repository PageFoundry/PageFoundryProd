import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient } from "@angular/common/http";
import { SocialAuditAppComponent } from "./app.component";

bootstrapApplication(SocialAuditAppComponent, {
  providers: [provideHttpClient()],
}).catch((err) => console.error(err));
