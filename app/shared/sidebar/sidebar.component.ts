import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ImgFallbackDirective } from '../directives/img-fallback.directive';
import { LEAGUES, leagueLogo } from '../../core/utils/leagues';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, ImgFallbackDirective],
  templateUrl: './sidebar.component.html',
})
export class SidebarComponent {
  readonly leagues = LEAGUES;
  readonly logo = leagueLogo;
}
