import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-config-setup-plugins',
  templateUrl: './plugins.component.html',
  styleUrls: ['./plugins.component.scss', '../setup.component.scss'],
})
export class PluginsComponent {
  @Input() displayLayerProgressPlugin: boolean;
  @Input() enclosurePlugin: boolean;
  @Input() filamentManagerPlugin: boolean;
  @Input() spoolManagerPlugin: boolean;
  @Input() preheatButtonPlugin: boolean;
  @Input() printTimeGeniusPlugin: boolean;
  @Input() psuControlPlugin: boolean;
  @Input() ophomPlugin: boolean;
  @Input() tpLinkSmartPlugPlugin: boolean;
  @Input() tasmotaPlugin: boolean;
  @Input() tasmotaMqttPlugin: boolean;
  @Input() wemoPlugin: boolean;

  @Output() displayLayerProgressPluginChange = new EventEmitter<boolean>();
  @Output() enclosurePluginChange = new EventEmitter<boolean>();
  @Output() filamentManagerPluginChange = new EventEmitter<boolean>();
  @Output() spoolManagerPluginChange = new EventEmitter<boolean>();
  @Output() preheatButtonPluginChange = new EventEmitter<boolean>();
  @Output() printTimeGeniusPluginChange = new EventEmitter<boolean>();
  @Output() psuControlPluginChange = new EventEmitter<boolean>();
  @Output() ophomPluginChange = new EventEmitter<boolean>();
  @Output() tpLinkSmartPlugPluginChange = new EventEmitter<boolean>();
  @Output() tasmotaPluginChange = new EventEmitter<boolean>();
  @Output() tasmotaMqttPluginChange = new EventEmitter<boolean>();
  @Output() wemoPluginChange = new EventEmitter<boolean>();
}
