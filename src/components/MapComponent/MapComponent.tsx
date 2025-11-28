import { useEffect, useRef, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { GeoJSONData, PolygonStatus, PolygonFeature } from "../../App";
import initialGeoJsonData from "../../data/dormentes-blocks.json";
import "leaflet/dist/leaflet.css";
import "./MapComponent.css";

// Fix para ícones do Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

interface MapComponentProps {
  geoJsonData: GeoJSONData | null;
  setGeoJsonData: (data: GeoJSONData) => void;
  onPolygonClick: (featureId: string) => void;
  isEditMode?: boolean;
  isGPSActive?: boolean;
  polygonToFocus?: PolygonFeature | null;
  highlightedPolygonId?: string | null;
}

const getColorByStatus = (
  status: PolygonStatus
): { fill: string; stroke: string } => {
  switch (status) {
    case "concluido":
      return { fill: "#22c55e", stroke: "#16a34a" }; // Verde
    case "em_andamento":
      return { fill: "#ef4444", stroke: "#dc2626" }; // Vermelho
    case "nao_iniciado":
      return { fill: "#9ca3af", stroke: "#6b7280" }; // Cinza
    default:
      return { fill: "#9ca3af", stroke: "#6b7280" };
  }
};

// Função para calcular o centroide de um polígono
// GeoJSON usa [lng, lat], Leaflet usa [lat, lng]
const getPolygonCenter = (coordinates: number[][][]): [number, number] => {
  if (!coordinates || coordinates.length === 0 || !coordinates[0]) {
    return [0, 0];
  }

  const ring = coordinates[0]; // Primeiro anel do polígono
  let sumLat = 0;
  let sumLng = 0;

  for (const [lng, lat] of ring) {
    sumLat += lat;
    sumLng += lng;
  }

  // Retorna [lat, lng] para o Leaflet
  return [sumLat / ring.length, sumLng / ring.length];
};

// Função para extrair o número da quadra das propriedades
const getQuadraNumber = (feature: PolygonFeature, index: number): string => {
  // Procura por propriedades que contenham "Quadra" ou "Cartão" na chave
  for (const [key, value] of Object.entries(feature.properties)) {
    if (
      key.includes("Quadra") ||
      key.includes("Cartão") ||
      key.includes("Cartao")
    ) {
      // Tenta extrair número da chave (ex: "Cartão 29" -> "Q29")
      const keyMatch = key.match(/(\d+)/);
      if (keyMatch) {
        return `${keyMatch[1]}`;
      }
      // Tenta extrair número do valor
      const valueMatch = String(value).match(/(\d+)/);
      if (valueMatch) {
        return `${valueMatch[1]}`;
      }
    }
  }

  // Tenta extrair do nome (ex: "Polígono 1" -> "Q1")
  const nome = feature.properties.nome || "";
  const nomeMatch = nome.match(/(\d+)/);
  if (nomeMatch) {
    return `${nomeMatch[1]}`;
  }

  // Tenta extrair do ID (ex: "polygon-1" -> "Q1", "190" -> "Q190")
  const id = feature.properties.id || "";
  const idMatch = id.match(/(\d+)/);
  if (idMatch) {
    return `${idMatch[1]}`;
  }

  // Fallback: usa o índice + 1
  return `${index + 1}`;
};

// Função para calcular os bounds de um conjunto de polígonos
const calculateBounds = (features: PolygonFeature[]): L.LatLngBounds | null => {
  if (!features || features.length === 0) return null;

  const bounds = L.latLngBounds([]);

  features.forEach((feature) => {
    if (feature.geometry.type === "Polygon") {
      const coordinates = feature.geometry.coordinates[0]; // Primeiro anel
      coordinates.forEach(([lng, lat]) => {
        bounds.extend([lat, lng]); // Leaflet usa [lat, lng]
      });
    }
  });

  return bounds.isValid() ? bounds : null;
};

// Componente interno para ajustar o zoom do mapa
function MapZoomController({
  geoJsonData,
}: {
  geoJsonData: GeoJSONData | null;
}) {
  const map = useMap();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (!geoJsonData || hasInitialized.current) return;

    // Pequeno delay para garantir que o mapa esteja totalmente renderizado
    const timer = setTimeout(() => {
      // Procura polígonos com status "em_andamento"
      const emAndamentoFeatures = geoJsonData.features.filter(
        (f) => f.properties.status === "em_andamento"
      );

      let bounds: L.LatLngBounds | null = null;

      if (emAndamentoFeatures.length > 0) {
        // Se houver polígonos em andamento, foca neles
        bounds = calculateBounds(emAndamentoFeatures);
      } else {
        // Caso contrário, foca em todos os polígonos
        bounds = calculateBounds(geoJsonData.features);
      }

      // Calcula o zoom para 83% do máximo
      const minZoom = map.getMinZoom();
      const maxZoom = map.getMaxZoom();
      const zoomRange = maxZoom - minZoom;
      const targetZoom = minZoom + zoomRange * 0.83;

      if (bounds) {
        // Centraliza o mapa no centro dos bounds
        const center = bounds.getCenter();
        map.setView(center, targetZoom, { animate: false });
        hasInitialized.current = true;
      } else {
        // Se não houver bounds, define o zoom para 83% diretamente
        map.setZoom(targetZoom);
        hasInitialized.current = true;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [geoJsonData, map]);

  return null;
}

// Componente para renderizar marcadores das quadras
function QuadraMarkers({
  polygonCenters,
  onPolygonClick,
}: {
  polygonCenters: Array<{
    center: [number, number];
    quadraNumber: string;
    featureId: string;
  }>;
  onPolygonClick: (featureId: string) => void;
}) {
  const map = useMap();
  const [currentZoom, setCurrentZoom] = useState(map.getZoom());
  const iconsRef = useRef<Map<string, L.DivIcon>>(new Map());
  const MAX_ZOOM = 18;

  // Monitora mudanças no zoom
  useEffect(() => {
    const updateZoom = () => {
      setCurrentZoom(map.getZoom());
    };

    map.on("zoomend", updateZoom);
    map.on("zoom", updateZoom);

    // Atualiza o zoom inicial
    updateZoom();

    return () => {
      map.off("zoomend", updateZoom);
      map.off("zoom", updateZoom);
    };
  }, [map]);

  // Cria ou atualiza ícones apenas quando necessário (baseado em featureId e quadraNumber)
  useEffect(() => {
    polygonCenters.forEach(({ featureId, quadraNumber: qNumber }) => {
      if (!iconsRef.current.has(featureId)) {
        const icon = L.divIcon({
          className: "quadra-marker",
          html: `<div class="quadra-circle">${qNumber}</div>`,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        });
        iconsRef.current.set(featureId, icon);
      } else {
        // Atualiza apenas o número da quadra se mudou, sem recriar o ícone
        const existingIcon = iconsRef.current.get(featureId);
        if (existingIcon && existingIcon.options.html) {
          const currentHtml = existingIcon.options.html as string;
          const newHtml = `<div class="quadra-circle">${qNumber}</div>`;
          if (currentHtml !== newHtml) {
            existingIcon.options.html = newHtml;
          }
        }
      }
    });
  }, [polygonCenters]);

  // Só renderiza os marcadores se o zoom estiver no máximo
  if (currentZoom < MAX_ZOOM) {
    return null;
  }

  return (
    <>
      {polygonCenters.map(({ center, featureId }) => {
        const icon = iconsRef.current.get(featureId);
        if (!icon) return null;

        return (
          <Marker
            key={featureId}
            position={center}
            icon={icon}
            eventHandlers={{
              click: () => {
                onPolygonClick(featureId);
              },
            }}
          />
        );
      })}
    </>
  );
}

// Componente interno para centralizar o mapa em um polígono específico
function PolygonFocusController({
  polygon,
}: {
  polygon: PolygonFeature | null;
}) {
  const map = useMap();
  const lastPolygonIdRef = useRef<string | null>(null);
  const focusCounterRef = useRef(0);

  useEffect(() => {
    if (!polygon) {
      lastPolygonIdRef.current = null;
      return;
    }

    const polygonId = polygon.properties.id;
    const isNewPolygon = lastPolygonIdRef.current !== polygonId;

    // Atualiza a referência
    lastPolygonIdRef.current = polygonId;
    // Incrementa o contador para forçar o foco mesmo se for o mesmo polígono
    focusCounterRef.current += 1;

    const coordinates = polygon.geometry.coordinates[0];
    const bounds = L.latLngBounds(
      coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
    );

    if (bounds.isValid()) {
      // Delay para garantir que o mapa está pronto e renderizado
      const delay = isNewPolygon ? 200 : 150;
      setTimeout(() => {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 18,
          animate: true,
          duration: 0.5,
        });
      }, delay);
    }
  }, [polygon, map]);

  return null;
}

// Componente interno para exibir a porcentagem de zoom
function ZoomPercentage() {
  const map = useMap();
  const [zoomPercentage, setZoomPercentage] = useState(0);

  useEffect(() => {
    const updateZoomPercentage = () => {
      const currentZoom = map.getZoom();
      const minZoom = map.getMinZoom();
      const maxZoom = map.getMaxZoom();
      const zoomRange = maxZoom - minZoom;
      const currentRange = currentZoom - minZoom;
      const percentage = zoomRange > 0 ? (currentRange / zoomRange) * 100 : 0;
      setZoomPercentage(Math.round(percentage));
    };

    map.on("zoomend", updateZoomPercentage);
    map.on("zoom", updateZoomPercentage);

    // Atualiza o zoom inicial
    updateZoomPercentage();

    return () => {
      map.off("zoomend", updateZoomPercentage);
      map.off("zoom", updateZoomPercentage);
    };
  }, [map]);

  return <div className="zoom-percentage">{zoomPercentage}%</div>;
}

// Componente interno para gerenciar a localização GPS
function GPSController({
  isActive,
  onLocationUpdate,
}: {
  isActive: boolean;
  onLocationUpdate: (position: [number, number]) => void;
}) {
  const map = useMap();
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      // Para o rastreamento se desativado
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    // Verifica se a geolocalização está disponível
    if (!navigator.geolocation) {
      alert("Geolocalização não é suportada pelo seu navegador.");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    };

    // Função de sucesso
    const success = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const location: [number, number] = [latitude, longitude];
      onLocationUpdate(location);

      // Centraliza o mapa na posição do usuário
      map.setView(location, 18, {
        animate: true,
      });
    };

    // Função de erro
    const error = (err: GeolocationPositionError) => {
      console.error("Erro ao obter localização:", err);
      let message = "Erro ao obter localização: ";
      switch (err.code) {
        case err.PERMISSION_DENIED:
          message += "Permissão negada pelo usuário.";
          break;
        case err.POSITION_UNAVAILABLE:
          message += "Posição indisponível.";
          break;
        case err.TIMEOUT:
          message += "Tempo de espera excedido.";
          break;
        default:
          message += "Erro desconhecido.";
          break;
      }
      alert(message);
    };

    // Inicia o rastreamento contínuo
    watchIdRef.current = navigator.geolocation.watchPosition(
      success,
      error,
      options
    );

    // Cleanup
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [isActive, map, onLocationUpdate]);

  return null;
}

export default function MapComponent({
  geoJsonData,
  setGeoJsonData,
  onPolygonClick,
  isEditMode = false,
  isGPSActive = false,
  polygonToFocus = null,
  highlightedPolygonId = null,
}: MapComponentProps) {
  const geoJsonRef = useRef<L.GeoJSON>(null);
  const [gpsPosition, setGpsPosition] = useState<[number, number] | null>(null);

  useEffect(() => {
    // Carrega o GeoJSON inicial
    if (!geoJsonData) {
      setGeoJsonData(initialGeoJsonData as GeoJSONData);
    }
  }, [geoJsonData, setGeoJsonData]);

  // Atualiza os estilos quando o geoJsonData, isEditMode ou highlightedPolygonId muda
  useEffect(() => {
    if (geoJsonData && geoJsonRef.current) {
      console.log(
        "Atualizando estilos, highlightedPolygonId:",
        highlightedPolygonId
      );
      // Cria um mapa de features atualizadas por ID para acesso rápido
      const featuresMap = new Map(
        geoJsonData.features.map((f) => [f.properties.id, f])
      );

      let highlightedCount = 0;

      geoJsonRef.current.eachLayer((layer) => {
        if (layer instanceof L.Path) {
          const feature = (layer as any).feature;
          if (feature) {
            // Busca o feature atualizado no geoJsonData usando o ID do feature original
            const featureId = feature.properties.id;
            const updatedFeature = featuresMap.get(featureId);

            if (updatedFeature) {
              // Atualiza o feature no layer com os dados mais recentes
              (layer as any).feature = updatedFeature;
              const status = updatedFeature.properties.status as PolygonStatus;
              const colors = getColorByStatus(status);

              // Compara usando o ID do feature original armazenado no layer
              const isHighlighted = highlightedPolygonId === featureId;

              if (isHighlighted) {
                highlightedCount++;
                console.log(
                  "Destacando polígono:",
                  featureId,
                  updatedFeature.properties.nome,
                  "Status:",
                  status
                );
              }

              layer.setStyle({
                fillColor: colors.fill,
                color: isHighlighted ? "#fbbf24" : colors.stroke, // Amarelo para destacar
                weight: isHighlighted ? 4 : isEditMode ? 3 : 2,
                opacity: 1,
                fillOpacity: isHighlighted ? 0.8 : isEditMode ? 0.5 : 0.7,
                dashArray: isEditMode ? "5, 5" : undefined,
              });
            }
          }
        }
      });

      if (highlightedPolygonId && highlightedCount === 0) {
        console.warn(
          "Aviso: Nenhum polígono foi destacado com o ID:",
          highlightedPolygonId
        );
      }
    }
  }, [geoJsonData, isEditMode, highlightedPolygonId]);

  const style = (feature: any) => {
    const status = feature.properties.status as PolygonStatus;
    const colors = getColorByStatus(status);
    // Usa o ID do feature para comparar, garantindo que seja o polígono correto
    const featureId = feature.properties.id;
    const isHighlighted = highlightedPolygonId === featureId;

    return {
      fillColor: colors.fill,
      color: isHighlighted ? "#fbbf24" : colors.stroke, // Amarelo para destacar
      weight: isHighlighted ? 6 : isEditMode ? 3 : 2,
      opacity: 1,
      fillOpacity: isHighlighted ? 0.8 : isEditMode ? 0.5 : 0.7,
      dashArray: isEditMode ? "5, 5" : undefined,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    // Armazena o ID do feature para usar no clique
    const featureId = feature.properties.id;

    layer.on({
      click: () => {
        console.log("Polygon clicked:", featureId);
        onPolygonClick(featureId);
      },
      mouseover: (e: L.LeafletMouseEvent) => {
        const layer = e.target as L.Path;
        layer.setStyle({
          weight: 4,
          fillOpacity: 0.9,
        });
      },
      mouseout: (e: L.LeafletMouseEvent) => {
        const geoJsonLayer = geoJsonRef.current;
        if (geoJsonLayer) {
          geoJsonLayer.resetStyle(e.target as L.Path);
        }
      },
    });
  };

  const dataToUse = geoJsonData || (initialGeoJsonData as GeoJSONData);

  // Calcula os centros e números das quadras para cada polígono
  const polygonCenters = useMemo(() => {
    if (!dataToUse) return [];

    return dataToUse.features.map((feature, index) => {
      const center = getPolygonCenter(feature.geometry.coordinates);
      const quadraNumber = getQuadraNumber(feature, index);
      return {
        center: [center[0], center[1]] as [number, number],
        quadraNumber,
        featureId: feature.properties.id,
      };
    });
  }, [dataToUse]);

  return (
    <MapContainer
      center={[-8.44, -40.77]} // Centro baseado nos polígonos fornecidos (será ajustado pelo MapZoomController)
      zoom={15} // Zoom inicial (será ajustado para 83% pelo MapZoomController)
      style={{ height: "100%", width: "100%" }}
    >
      <MapZoomController geoJsonData={dataToUse} />
      <GPSController isActive={isGPSActive} onLocationUpdate={setGpsPosition} />
      <PolygonFocusController polygon={polygonToFocus} />
      <ZoomPercentage />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {dataToUse && (
        <GeoJSON
          key={
            geoJsonData
              ? JSON.stringify(
                  geoJsonData.features.map(
                    (f) => `${f.properties.id}:${f.properties.status}`
                  )
                )
              : "initial"
          }
          ref={geoJsonRef}
          data={dataToUse}
          style={style}
          onEachFeature={onEachFeature}
        />
      )}
      <QuadraMarkers
        polygonCenters={polygonCenters}
        onPolygonClick={onPolygonClick}
      />
      {gpsPosition && isGPSActive && (
        <Marker
          position={gpsPosition}
          icon={L.icon({
            iconUrl:
              "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowUrl:
              "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
            shadowSize: [41, 41],
          })}
        >
          <Popup>Sua localização</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}

