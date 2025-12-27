import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet-draw';
import { GeoJSONData, PolygonFeature } from '../../types/polygon';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';
import './EditorMapComponent.css';

// Fix para ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface EditorMapComponentProps {
  geoJsonData: GeoJSONData | null;
  onPolygonDrawn: (coordinates: number[][][]) => void;
  isDrawingMode: boolean;
  drawingType: 'card' | 'quadra' | null;
  isEditMode?: boolean;
  onPolygonClick?: (feature: PolygonFeature) => void;
}


function DrawController({
  onPolygonDrawn,
  isDrawingMode,
  drawingType,
}: {
  onPolygonDrawn: (coordinates: number[][][]) => void;
  isDrawingMode: boolean;
  drawingType: 'card' | 'quadra' | null;
}) {
  const map = useMap();
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const drawnLayerRef = useRef<L.FeatureGroup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Cria o feature group para armazenar os desenhos
    if (!drawnLayerRef.current) {
      drawnLayerRef.current = new L.FeatureGroup();
      map.addLayer(drawnLayerRef.current);
    }

    // Remove o controle de desenho anterior se existir
    if (drawControlRef.current) {
      map.removeControl(drawControlRef.current);
      drawControlRef.current = null;
    }

    // Se estiver em modo de desenho, adiciona o controle
    if (isDrawingMode && drawingType) {
      const drawControl = new L.Control.Draw({
        edit: {
          featureGroup: drawnLayerRef.current,
          remove: true,
        },
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
          },
          rectangle: false,
          circle: false,
          marker: false,
          circlemarker: false,
          polyline: false,
        },
      });

      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Event listener para quando um polígono é desenhado
      const handleDrawCreated = (e: any) => {
        const layer = e.layer;
        drawnLayerRef.current?.addLayer(layer);

        // Extrai as coordenadas do polígono
        const geoJson = layer.toGeoJSON();
        if (geoJson.type === 'Feature' && geoJson.geometry.type === 'Polygon') {
          const coordinates = geoJson.geometry.coordinates;
          onPolygonDrawn(coordinates);
        }
      };

      map.on('draw:created' as any, handleDrawCreated);

      // Cleanup
      return () => {
        map.off('draw:created' as any, handleDrawCreated);
        if (drawControlRef.current) {
          map.removeControl(drawControlRef.current);
          drawControlRef.current = null;
        }
      };
    }

    return () => {
      if (drawControlRef.current) {
        map.removeControl(drawControlRef.current);
        drawControlRef.current = null;
      }
    };
  }, [map, isDrawingMode, drawingType, onPolygonDrawn]);

  // Limpa os desenhos quando sair do modo de desenho
  useEffect(() => {
    if (!isDrawingMode && drawnLayerRef.current) {
      drawnLayerRef.current.clearLayers();
    }
  }, [isDrawingMode]);

  return null;
}

export default function EditorMapComponent({
  geoJsonData,
  onPolygonDrawn,
  isDrawingMode,
  drawingType,
  isEditMode = false,
  onPolygonClick,
}: EditorMapComponentProps) {
  const geoJsonRef = useRef<L.GeoJSON>(null);

  const style = (feature: any) => {
    return {
      fillColor: '#9ca3af',
      color: '#6b7280',
      weight: isEditMode ? 3 : 2,
      opacity: 1,
      fillOpacity: 0.5,
      dashArray: isEditMode ? '5, 5' : undefined,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (isEditMode && onPolygonClick) {
      layer.on({
        click: () => {
          const polygonFeature: PolygonFeature = {
            type: 'Feature',
            properties: feature.properties,
            geometry: feature.geometry,
          };
          onPolygonClick(polygonFeature);
        },
        mouseover: (e: L.LeafletMouseEvent) => {
          const layer = e.target as L.Path;
          layer.setStyle({
            weight: 4,
            fillOpacity: 0.7,
          });
        },
        mouseout: (e: L.LeafletMouseEvent) => {
          if (geoJsonRef.current) {
            geoJsonRef.current.resetStyle(e.target as L.Path);
          }
        },
      });
    }
  };

  return (
    <MapContainer
      center={[-8.44, -40.77]}
      zoom={15}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {geoJsonData && (
        <GeoJSON
          ref={geoJsonRef}
          data={geoJsonData}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
      <DrawController
        onPolygonDrawn={onPolygonDrawn}
        isDrawingMode={isDrawingMode}
        drawingType={drawingType}
      />
    </MapContainer>
  );
}

