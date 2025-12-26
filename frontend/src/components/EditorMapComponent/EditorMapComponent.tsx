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
  selectedQuadraIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  isSelectionMode?: boolean;
  unavailableQuadraIds?: Set<string>;
}

// Componente interno para gerenciar o desenho
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
  selectedQuadraIds = new Set(),
  onSelectionChange,
  isSelectionMode = false,
  unavailableQuadraIds = new Set(),
}: EditorMapComponentProps) {
  const geoJsonRef = useRef<L.GeoJSON>(null);
  const selectedQuadraIdsRef = useRef<Set<string>>(selectedQuadraIds);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const unavailableQuadraIdsRef = useRef<Set<string>>(unavailableQuadraIds);
  const isEditModeRef = useRef<boolean>(isEditMode);

  // Keep refs updated
  useEffect(() => {
    selectedQuadraIdsRef.current = selectedQuadraIds;
  }, [selectedQuadraIds]);

  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
  }, [onSelectionChange]);

  useEffect(() => {
    unavailableQuadraIdsRef.current = unavailableQuadraIds;
  }, [unavailableQuadraIds]);

  useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  // Update styles when selection changes
  useEffect(() => {
    if (!geoJsonData || !geoJsonRef.current) return;

    // Use a small delay to ensure layers are rendered
    const timeoutId = setTimeout(() => {
      geoJsonRef.current?.eachLayer((layer) => {
        if (layer instanceof L.Path) {
          const feature = (layer as any).feature;
          if (feature) {
            const featureId = feature.properties?.id ?? '';
            const isSelected = selectedQuadraIds.has(featureId);
            const isCard = featureId.startsWith('card-');
            const isUnavailable = unavailableQuadraIds.has(featureId);
            
            if (!isCard) {
              const newStyle = {
                fillColor: isUnavailable 
                  ? '#ef4444' // Red for unavailable
                  : isSelected 
                    ? '#3b82f6' 
                    : '#9ca3af',
                color: isUnavailable 
                  ? '#dc2626' // Darker red for unavailable
                  : isSelected 
                    ? '#2563eb' 
                    : '#6b7280',
                weight: isSelected ? 4 : isEditMode ? 3 : 2,
                fillOpacity: isUnavailable ? 0.3 : isSelected ? 0.7 : 0.5,
                dashArray: isEditMode ? '5, 5' : undefined,
                opacity: isUnavailable ? 0.5 : 1,
              };
              
              layer.setStyle(newStyle);
              // Force redraw
              if ((layer as any)._renderer) {
                (layer as any)._renderer._updateStyle(layer);
              }
            }
          }
        }
      });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [selectedQuadraIds, geoJsonData, isEditMode, unavailableQuadraIds]);

  // Update event handlers when selection mode or geoJsonData changes
  useEffect(() => {
    if (!geoJsonData || !geoJsonRef.current) {
      console.log('EditorMapComponent: No geoJsonData or ref');
      return;
    }

    console.log('EditorMapComponent: Setting up handlers', {
      isSelectionMode,
      isEditMode,
      hasOnSelectionChange: !!onSelectionChange,
    });

    // Use a small delay to ensure layers are fully rendered
    const timeoutId = setTimeout(() => {
      let handlersAdded = 0;
      let handlersSkipped = 0;

      geoJsonRef.current?.eachLayer((layer) => {
        if (layer instanceof L.Path) {
          const feature = (layer as any).feature;
          if (!feature) return;

          const featureId = feature.properties?.id ?? '';
          const isCard = featureId.startsWith('card-');

          // Remove all existing handlers
          layer.off('click mouseover mouseout');

          // Make cards non-interactive
          if (isCard) {
            (layer as any).options.interactive = false;
            return;
          }

          // Check if quadra is unavailable
          const isUnavailable = unavailableQuadraIds.has(featureId);
          
          // Make quadras interactive (but unavailable ones will show warning on click)
          (layer as any).options.interactive = true;
          
          // Set cursor style via CSS class
          if (isUnavailable && isSelectionMode) {
            (layer as any)._path?.setAttribute('style', 'cursor: not-allowed;');
          } else {
            (layer as any)._path?.setAttribute('style', 'cursor: pointer;');
          }

          // Add handlers if in edit mode or selection mode
          if (isEditMode || isSelectionMode) {
            layer.on('click', (e: L.LeafletMouseEvent) => {
              e.originalEvent.stopPropagation();
              e.originalEvent.preventDefault();

              const polygonFeature: PolygonFeature = {
                type: 'Feature',
                properties: feature.properties,
                geometry: feature.geometry,
              };

          if (isSelectionMode && onSelectionChangeRef.current) {
            // Check if quadra is unavailable (already in a card)
            if (unavailableQuadraIdsRef.current.has(featureId)) {
              alert('Esta quadra já está em um cartão e não pode ser selecionada.');
              return;
            }

                const currentSelection = new Set(selectedQuadraIdsRef.current);
                const newSelection = new Set(currentSelection);

                if (newSelection.has(featureId)) {
                  newSelection.delete(featureId);
                  console.log(`Desselecionando quadra ${featureId}`);
                } else {
                  newSelection.add(featureId);
                  console.log(`Selecionando quadra ${featureId}`);
                }

                console.log(`Total selecionadas: ${newSelection.size}`);

                if (onSelectionChangeRef.current) {
                  onSelectionChangeRef.current(newSelection);
                }
              } else if (onPolygonClick && !isSelectionMode) {
                onPolygonClick(polygonFeature);
              }
            });

            layer.on('mouseover', (e: L.LeafletMouseEvent) => {
              const pathLayer = e.target as L.Path;
              const isSelected = selectedQuadraIdsRef.current.has(featureId);
              const isUnavailable = unavailableQuadraIds.has(featureId);

              if (isUnavailable) {
                pathLayer.setStyle({
                  weight: 4,
                  fillOpacity: 0.4,
                  opacity: 0.6,
                });
              } else {
                pathLayer.setStyle({
                  weight: isSelected ? 5 : 4,
                  fillOpacity: isSelected ? 0.8 : 0.7,
                });
              }
            });

            layer.on('mouseout', (e: L.LeafletMouseEvent) => {
              if (geoJsonRef.current) {
                const pathLayer = e.target as L.Path;
                const feature = (pathLayer as any).feature;
                if (feature) {
                  const featureId = feature.properties?.id ?? '';
                  const isSelected = selectedQuadraIdsRef.current.has(featureId);
                  const isUnavailable = unavailableQuadraIdsRef.current.has(featureId);
                  
                  // Reset to correct style based on selection state
                  pathLayer.setStyle({
                    fillColor: isUnavailable 
                      ? '#ef4444'
                      : isSelected 
                        ? '#3b82f6' 
                        : '#9ca3af',
                    color: isUnavailable 
                      ? '#dc2626'
                      : isSelected 
                        ? '#2563eb' 
                        : '#6b7280',
                    weight: isSelected ? 4 : isEditModeRef.current ? 3 : 2,
                    fillOpacity: isUnavailable ? 0.3 : isSelected ? 0.7 : 0.5,
                    opacity: isUnavailable ? 0.5 : 1,
                    dashArray: isEditModeRef.current ? '5, 5' : undefined,
                  });
                } else {
                  geoJsonRef.current.resetStyle(pathLayer);
                }
              }
            });
            handlersAdded++;
          } else {
            handlersSkipped++;
          }
        }
      });

      console.log(`EditorMapComponent: Handlers added to ${handlersAdded} layers, skipped ${handlersSkipped}`);
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [geoJsonData, isEditMode, isSelectionMode, onPolygonClick, unavailableQuadraIds]);

  const style = (feature: any) => {
    const featureId = feature.properties?.id ?? '';
    const isSelected = selectedQuadraIds.has(featureId);
    const isCard = featureId.startsWith('card-');
    const isUnavailable = unavailableQuadraIds.has(featureId);
    
    if (isCard) {
      return {
        fillColor: '#10b981',
        color: '#059669',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.4,
        dashArray: '10, 5',
      };
    }
    
    return {
      fillColor: isUnavailable 
        ? '#ef4444' // Red for unavailable
        : isSelected 
          ? '#3b82f6' 
          : '#9ca3af',
      color: isUnavailable 
        ? '#dc2626' // Darker red for unavailable
        : isSelected 
          ? '#2563eb' 
          : '#6b7280',
      weight: isSelected ? 4 : isEditMode ? 3 : 2,
      opacity: isUnavailable ? 0.5 : 1,
      fillOpacity: isUnavailable ? 0.3 : isSelected ? 0.7 : 0.5,
      dashArray: isEditMode ? '5, 5' : undefined,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    // This is called when each feature is rendered.
    // We set up handlers here as a fallback, but the main setup is in useEffect.
    // This ensures that even if the useEffect runs later, basic interactivity is present.
    if (layer instanceof L.Path) {
      const featureId = feature.properties?.id ?? '';
      const isCard = featureId.startsWith('card-');
      
      // Make cards non-interactive
      if (isCard) {
        (layer as any).options.interactive = false;
        layer.off('click mouseover mouseout');
        return;
      }
      
      // Make quadras interactive
      (layer as any).options.interactive = true;
      
      // Remove existing handlers first
      layer.off('click mouseover mouseout');
      
      // Add handlers if in edit mode or selection mode
      if ((isEditMode || isSelectionMode) && (onPolygonClick || onSelectionChange)) {
        layer.on('click', (e: L.LeafletMouseEvent) => {
          e.originalEvent.stopPropagation();
          e.originalEvent.preventDefault();
          
          const polygonFeature: PolygonFeature = {
            type: 'Feature',
            properties: feature.properties,
            geometry: feature.geometry,
          };
          
          if (isSelectionMode && onSelectionChangeRef.current) {
            // Check if quadra is unavailable (already in a card)
            if (unavailableQuadraIdsRef.current.has(featureId)) {
              alert('Esta quadra já está em um cartão e não pode ser selecionada.');
              return;
            }

            const currentSelection = new Set(selectedQuadraIdsRef.current);
            const newSelection = new Set(currentSelection);
            
            if (newSelection.has(featureId)) {
              newSelection.delete(featureId);
              console.log(`Desselecionando quadra ${featureId}`);
            } else {
              newSelection.add(featureId);
              console.log(`Selecionando quadra ${featureId}`);
            }
            
            console.log(`Total selecionadas: ${newSelection.size}`);
            
            if (onSelectionChangeRef.current) {
              onSelectionChangeRef.current(newSelection);
            }
          } else if (onPolygonClick && !isSelectionMode) {
            onPolygonClick(polygonFeature);
          }
        });
        
        layer.on('mouseover', (e: L.LeafletMouseEvent) => {
          const pathLayer = e.target as L.Path;
          const isSelected = selectedQuadraIdsRef.current.has(featureId);
          const isUnavailable = unavailableQuadraIdsRef.current.has(featureId);

          if (isUnavailable) {
            pathLayer.setStyle({
              weight: 4,
              fillOpacity: 0.4,
              opacity: 0.6,
            });
          } else {
            pathLayer.setStyle({
              weight: isSelected ? 5 : 4,
              fillOpacity: isSelected ? 0.8 : 0.7,
            });
          }
        });
        
        layer.on('mouseout', (e: L.LeafletMouseEvent) => {
          if (geoJsonRef.current) {
            const pathLayer = e.target as L.Path;
            const feature = (pathLayer as any).feature;
            if (feature) {
              const featureId = feature.properties?.id ?? '';
              const isSelected = selectedQuadraIdsRef.current.has(featureId);
              const isUnavailable = unavailableQuadraIdsRef.current.has(featureId);
              
              // Reset to correct style based on selection state
              pathLayer.setStyle({
                fillColor: isUnavailable 
                  ? '#ef4444'
                  : isSelected 
                    ? '#3b82f6' 
                    : '#9ca3af',
                color: isUnavailable 
                  ? '#dc2626'
                  : isSelected 
                    ? '#2563eb' 
                    : '#6b7280',
                weight: isSelected ? 4 : isEditModeRef.current ? 3 : 2,
                fillOpacity: isUnavailable ? 0.3 : isSelected ? 0.7 : 0.5,
                opacity: isUnavailable ? 0.5 : 1,
                dashArray: isEditModeRef.current ? '5, 5' : undefined,
              });
            } else {
              geoJsonRef.current.resetStyle(pathLayer);
            }
          }
        });
      }
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
          key={`${isSelectionMode}-${isEditMode}-${Array.from(selectedQuadraIds).sort().join(',')}`}
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

