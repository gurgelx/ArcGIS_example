import { AfterViewInit, Component, ElementRef, ViewChild } from '@angular/core';
import config from '@arcgis/core/config.js';
import { Polygon } from '@arcgis/core/geometry';
import Graphic from '@arcgis/core/Graphic';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Map from '@arcgis/core/Map';
import MapView from '@arcgis/core/views/MapView';
import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel';



@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit {

  private graphicsLayer: GraphicsLayer;
  private boundaryLayer: GraphicsLayer;
  private view: MapView;
  private sketchViewModel: SketchViewModel;

  @ViewChild('mapView', { static: false }) mapElementRef?: ElementRef;
  constructor() { }

  ngAfterViewInit(): void {
    this.init();
  }

  ngOnInit(): void {
    config.assetsPath = 'assets/';
  }


  init(): void {
    this.graphicsLayer = new GraphicsLayer();
    this.boundaryLayer = new GraphicsLayer();
    const map = new Map({
      basemap: "streets-night-vector",
      layers: [this.graphicsLayer, this.boundaryLayer]
    });

    this.view = new MapView({
      container: this.mapElementRef.nativeElement,
      map: map,
      zoom: 12,
      center: [-117.1708, 34.0574]
    });

    this.setUpGraphicClickHandler();

    this.view.when(() => {
      this.iniMapView();
    });
  }

  iniMapView() {

    this.sketchViewModel = new SketchViewModel({
      view: this.view,
      layer: this.graphicsLayer,
      updateOnGraphicClick: false,
      defaultUpdateOptions: {
        toggleToolOnClick: false
      }
    });

    this.addGraphics();
    this.sketchViewModel.on(["update", "undo", "redo"] as any, this.onGraphicUpdate);
  }

  onGraphicUpdate = (event) => {

    if (event.toolEventInfo && (event.toolEventInfo.type === "move-stop" || event.toolEventInfo.type === "reshape-stop")) {
      this.sketchViewModel.complete();
    }
  }

  createGeometry(vertices) {
    return new Polygon({
      rings: vertices,
      spatialReference: this.view.spatialReference
    });
  }

  createSymbol(color, style, width, outlineColor) {
    return {
      type: "simple-fill",
      style: style,
      color: color,
      outline: {
        color: outlineColor,
        width: width
      }
    };
  }

  addGraphics() {
    const vertices = [
      [-13040270.324055556, 4040357.7882640623],
      [-13038653.725694647, 4040689.513023534],
      [-13038063.204863824, 4038017.2028549737],
      [-13040097.818223165, 4037990.629044359],
      [-13040270.324055556, 4040357.7882640623]
    ];

    const polygon = this.createGeometry(vertices);
    const validSymbol = this.createSymbol([0, 170, 255, 0.8], "solid", 2, [
      255,
      255,
      255
    ]);
    const newDevelopmentGraphic = new Graphic({
      geometry: polygon,
      symbol: validSymbol,
      attributes: {
        newDevelopment: "new store"
      }
    });

    const boundaryVertices = [
      [-13048353.166569024, 4041363.935436187],
      [-13036929.861699322, 4041363.935436187],
      [-13036929.861699322, 4030232.5692555667],
      [-13048353.166569024, 4030232.5692555667],
      [-13048353.166569024, 4041363.935436187]
    ];

    const boundaryPolygon = this.createGeometry(boundaryVertices);
    const boundarySymbol = this.createSymbol([255, 255, 255, 0], "solid", 2, [
      255,
      255,
      255
    ]);
    const boundaryGraphic = new Graphic({
      geometry: boundaryPolygon,
      symbol: boundarySymbol
    });
    this.graphicsLayer.addMany([newDevelopmentGraphic]);
    this.boundaryLayer.add(boundaryGraphic);
  }

  setUpGraphicClickHandler() {
    this.view.on("click", (event) => {
      if (this.sketchViewModel.state === "active") {
        return;
      }
      this.view.hitTest(event).then((response) => {
        const results = response.results;
        results.forEach((result) => {
          if (
            result.graphic.layer === this.sketchViewModel.layer &&
            result.graphic.attributes &&
            result.graphic.attributes.newDevelopment
          ) {
            this.sketchViewModel.update([result.graphic], { tool: "reshape" });
          }
        });
      });
    });
  }
}
