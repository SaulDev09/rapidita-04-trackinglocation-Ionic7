import { Component, OnInit, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'

import { Collection, Feature, Overlay, Map, View } from 'ol';
import { toLonLat, transform, fromLonLat } from 'ol/proj';
import { Icon, Style } from 'ol/style';
import { Point } from 'ol/geom';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';

import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import firebase from 'firebase/compat/app';
import { Geolocation } from '@capacitor/geolocation';

@Component({
  selector: 'app-map',
  templateUrl: './map.page.html',
  styleUrls: ['./map.page.scss'],
})
export class MapPage implements OnInit {
  public taxiDriverId = 'ahvGax84PojhmIpc4Ado';
  public lat: any;
  public lon: any;
  wait: any;

  //    Map Init
  public map!: Map;
  public tileLayer: any;
  public markerSource = new VectorSource();

  public markerStyle = new Style({
    image: new Icon({
      anchorXUnits: 'fraction',
      anchorYUnits: 'pixels',
      color: '#ffcd46',
      src: 'https://icons.iconarchive.com/icons/paomedia/small-n-flat/48/map-marker-icon.png',
    }),
  });
  public taxiDrivers: TaxiDriver[] = [];
  public siguiendoNombre: string = '';

  view = new View({
    center: fromLonLat([-77.11718009815769, -12.061078697609702]),
    zoom: 13,
  })

  public taxiDriverFollowed: AngularFirestoreDocument<any> | null = null;
  //    Map End

  constructor(
    private readonly afs: AngularFirestore,
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.tileLayer = new TileLayer({
      source: new OSM(),
    });

    this.map = new Map({
      target: 'ol-map',
      view: this.view,
      layers: [
        this.tileLayer, new VectorLayer({
          source: this.markerSource,
          style: this.markerStyle,
        }),
      ],
    });

    this.syncMarker(-77.11718009815769, -12.061078697609702, this.taxiDriverId);
  }

  private getPointFromLongLat(lon: number, lat: number) {
    return transform([lon, lat], 'EPSG:4326', 'EPSG:3857')
  }

  private syncMarker(lon: number, lat: number, id: string) {
    // console.log('id:', id, 'lon:', lon, 'lat:', lat);
    var featureToUpdate = this.markerSource.getFeatureById(id);
    if (featureToUpdate) {
      featureToUpdate.setGeometry(new Point(this.getPointFromLongLat(lon, lat)));
    } else {
      var iconFeature = new Feature({
        geometry: new Point(transform([lon, lat], 'EPSG:4326', 'EPSG:3857'))
      });
      iconFeature.setId(id);
      this.markerSource.addFeature(iconFeature);
    }
  }

  //Tracking
  track() {
    this.inicializarTaxista();

    this.wait = Geolocation.watchPosition({}, (position, err) => {
      this.ngZone.run(() => {
        if (!position) { return; }
        this.lat = position.coords.latitude;
        this.lon = position.coords.longitude;
        this.syncMarker(this.lon, this.lat, this.taxiDriverId);

        this.taxiDriverFollowed?.update({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });

        this.map.setView(
          new View({
            center: fromLonLat([this.lon, this.lat]),
            zoom: 18,
          })
        )

      })
    })
  }

  stopTracking() {
    Geolocation.clearWatch({ id: this.wait });
    this.taxiDriverFollowed = null;
  }

  // Firebase
  inicializarTaxista() {
    this.taxiDriverFollowed = this.afs.doc(`/users/${this.taxiDriverId}`);
  }
}

interface TaxiDriver {
  id: string;
  name: string;
  password: string;
  lat: number;
  lon: number;
}
