import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { ConfigService, Config } from '../config/config.service';
import { NotificationService } from '../notification/notification.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

  @Output() closeFunction = new EventEmitter<string>();
  @ViewChild('settingsMain', { static: false }) settingsMain: ElementRef;
  @ViewChild('settingsGeneral', { static: false }) settingsGeneral: ElementRef;
  @ViewChild('settingsOctoDash', { static: false }) settingsOctoDash: ElementRef;
  @ViewChild('settingsPlugins', { static: false }) settingsPlugins: ElementRef;
  @ViewChild('settingsCredits', { static: false }) settingsCredits: ElementRef;

  public fadeOutAnimation = false;
  public config: Config;
  private overwriteNoSave = false;
  private pages = [];

  public constructor(private configService: ConfigService, private notificationService: NotificationService) {
    this.config = this.configService.getCurrentConfig();
    this.config = this.configService.revertConfigForInput(this.config);
  }

  public ngOnInit(): void {
    setTimeout(() => {
      this.pages = [
        this.settingsMain.nativeElement,
        this.settingsGeneral.nativeElement,
        this.settingsOctoDash.nativeElement,
        this.settingsPlugins.nativeElement,
        this.settingsCredits.nativeElement];
    }, 400);
  }

  public hideSettings(): void {
    if (this.configService.isEqualToCurrentConfig(this.configService.createConfigFromInput(this.config)) || this.overwriteNoSave) {
      this.fadeOutAnimation = true;
      this.closeFunction.emit();
      setTimeout(() => {
        this.fadeOutAnimation = false;
      }, 800);
    } else {
      this.notificationService.setWarning('Configuration not saved!', 'You haven\'t saved your config yet, so your changes will not be applied. Click close again if you want to discard your changes!');
      this.overwriteNoSave = true;
    }
  }

  public changePage(page: number, current: number, direction: 'forward' | 'backward'): void {
    this.pages[current].classList.add('settings__content-slideout-' + direction);
    this.pages[page].classList.remove('settings__content-inactive');
    this.pages[page].classList.add('settings__content-slidein-' + direction);

    setTimeout(() => {
      this.pages[current].classList.add('settings__content-inactive');
      this.pages[current].classList.remove('settings__content-slideout-' + direction);
      this.pages[page].classList.remove('settings__content-slidein-' + direction);
    }, 470);
  }

  public updateConfig(): void {
    const config = this.configService.createConfigFromInput(this.config);
    if (!this.configService.validateGiven(config)) {
      this.notificationService.setError('Config is invalid!', this.configService.getErrors().toString());
    }
    this.configService.saveConfig(config);
    this.overwriteNoSave = true;
    this.hideSettings();
    this.configService.updateConfig();
    window.location.reload();
  }
}
