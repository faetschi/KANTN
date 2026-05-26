import { Component, inject, input, output, viewChild, ElementRef, signal, AfterViewInit, OnDestroy, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import * as L from 'leaflet';

@Component({
  selector: 'app-cardio-map',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div class="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
        <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
          <h3 class="font-bold text-gray-900">Route Map</h3>
          <button (click)="closeMap.emit()" class="text-gray-400 hover:text-gray-600 transition-colors">
            <mat-icon>close</mat-icon>
          </button>
        </div>
        @if (isBrowser) {
          <div #mapContainer class="h-[60vh] min-h-[300px] w-full relative">
            @if (gpsCoordinates().length === 0) {
              <div class="absolute inset-0 z-[500] flex items-center justify-center bg-gray-50 bg-opacity-80 pointer-events-none">
                <p class="text-sm text-gray-500">Waiting for GPS signal...</p>
              </div>
            }
            <button
              type="button"
              (click)="toggleFollow()"
              class="map-follow-btn"
              [title]="followEnabled() ? 'Disable auto-follow' : 'Enable auto-follow'"
            >
              <mat-icon class="text-base">{{ followEnabled() ? 'my_location' : 'location_disabled' }}</mat-icon>
            </button>
          </div>
        } @else {
          <div class="h-[60vh] min-h-[300px] w-full flex items-center justify-center bg-gray-50">
            <p class="text-sm text-gray-400">Map unavailable</p>
          </div>
        }
        <div class="px-4 py-2 text-xs text-gray-400 text-center border-t border-gray-100 shrink-0">
          Route shown on OpenStreetMap (CartoDB). Data stays local.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .map-follow-btn {
      position: absolute;
      bottom: 24px;
      right: 16px;
      z-index: 1000;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: white;
      border: 2px solid rgba(0,0,0,0.15);
      box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #374151;
      transition: background 0.15s;
    }
    .map-follow-btn:hover {
      background: #f3f4f6;
    }
    .map-follow-btn .mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      line-height: 18px;
    }
  `]
})
export class CardioMapComponent implements AfterViewInit, OnDestroy {
  platformId = inject(PLATFORM_ID);

  gpsCoordinates = input<{lat: number; lng: number; timestamp: number}[]>([]);
  currentPosition = input<{lat: number; lng: number} | null>(null);
  closeMap = output<void>();

  mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  private map: L.Map | null = null;
  private marker: L.CircleMarker | null = null;
  private polyline: L.Polyline | null = null;
  followEnabled = signal(true);

  isBrowser = isPlatformBrowser(this.platformId);

  constructor() {
    effect(() => {
      const coords = this.gpsCoordinates();
      const pos = this.currentPosition();
      if (!this.isBrowser || !this.map) return;
      this.updateRoute(coords, pos);
    });
  }

  ngAfterViewInit() {
    if (!this.isBrowser) return;
    this.initMap();
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  private initMap() {
    const el = this.mapContainer();
    if (!el) return;

    const startPos = this.currentPosition() ?? { lat: 51.505, lng: -0.09 };

    this.map = L.map(el.nativeElement, {
      center: [startPos.lat, startPos.lng],
      zoom: 15,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
    }).addTo(this.map);

    this.marker = L.circleMarker([startPos.lat, startPos.lng], {
      radius: 8,
      fillColor: '#3b82f6',
      color: '#fff',
      weight: 3,
      opacity: 1,
      fillOpacity: 0.8,
    }).addTo(this.map);

    this.polyline = L.polyline([], {
      color: '#3b82f6',
      weight: 4,
      opacity: 0.7,
    }).addTo(this.map);

    const coords = this.gpsCoordinates();
    if (coords.length > 0) {
      this.updateRoute(coords, this.currentPosition());
    }
  }

  private updateRoute(
    coords: {lat: number; lng: number; timestamp: number}[],
    pos: {lat: number; lng: number} | null,
  ) {
    if (!this.map || !this.marker || !this.polyline) return;
    if (coords.length === 0) return;

    const latLngs = coords.map(c => [c.lat, c.lng] as [number, number]);
    this.polyline.setLatLngs(latLngs);

    if (pos) {
      this.marker.setLatLng([pos.lat, pos.lng]);
    }

    if (this.followEnabled() && pos) {
      this.map.setView([pos.lat, pos.lng], this.map.getZoom());
    }
  }

  toggleFollow() {
    this.followEnabled.update(v => !v);
    if (this.followEnabled() && this.currentPosition()) {
      const pos = this.currentPosition()!;
      this.map?.setView([pos.lat, pos.lng], this.map?.getZoom() || 15);
    }
  }
}
