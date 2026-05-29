import { Component, inject, input, viewChild, ElementRef, AfterViewInit, OnDestroy, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import * as L from 'leaflet';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-cardio-map',
  standalone: true,
  imports: [],
  template: `
    @if (isBrowser) {
      <div #mapContainer class="w-full h-full min-h-[200px] rounded-2xl overflow-hidden relative isolate">
        @if (gpsCoordinates().length === 0) {
          <div class="absolute inset-0 z-[500] flex items-center justify-center bg-gray-50 bg-opacity-80">
            <p class="text-sm text-gray-500">Waiting for GPS signal...</p>
          </div>
        }
      </div>
    } @else {
      <div class="w-full h-full min-h-[200px] rounded-2xl flex items-center justify-center bg-gray-50">
        <p class="text-sm text-gray-400">Map unavailable</p>
      </div>
    }
  `,
  styles: [`
  `]
})
export class CardioMapComponent implements AfterViewInit, OnDestroy {
  platformId = inject(PLATFORM_ID);

  gpsCoordinates = input<{lat: number; lng: number; timestamp: number}[]>([]);
  currentPosition = input<{lat: number; lng: number} | null>(null);

  mapContainer = viewChild.required<ElementRef<HTMLDivElement>>('mapContainer');

  private map: L.Map | null = null;
  private marker: L.CircleMarker | null = null;
  private polyline: L.Polyline | null = null;

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

  async captureSnapshot(): Promise<string | null> {
    if (!this.map || !this.isBrowser || !this.polyline) return null;

    const latLngs = this.polyline.getLatLngs() as L.LatLng[];
    if (!latLngs || latLngs.length === 0) return null;

    this.map.fitBounds(this.polyline.getBounds(), { padding: [30, 30], maxZoom: 16 });

    await new Promise<void>(resolve => {
      setTimeout(resolve, 800);
    });

    const el = this.mapContainer();
    if (!el) return null;

    try {
      const canvas = await html2canvas(el.nativeElement, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f9fafb',
        scale: 2,
      });
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch {
      return null;
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
      this.map.setView([pos.lat, pos.lng], this.map.getZoom());
    }
  }
}
