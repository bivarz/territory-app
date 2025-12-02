import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, LogOut } from "lucide-react";
import MapComponent from "../../components/MapComponent";
import Menu from "../../components/Menu";
import EditModeButton from "../../components/EditModeButton";
import GPSButton from "../../components/GPSButton";
import SearchButton from "../../components/SearchButton";
import SearchModal from "../../components/SearchModal";
import EditPolygonModal from "../../components/EditPolygonModal";
import Tabs from "../../components/Tabs";
import LogsTab from "../../components/LogsTab";
import RecentQuadras from "../../components/RecentQuadras";
import ThemeToggle from "../../components/ThemeToggle";
import { StatusChangeLog, QuadraLog } from "../../types/logs";
import { formatDate } from "../../utils/dateFormatter";
import { PolygonFeature, GeoJSONData } from "../../types/polygon";
import "./MapPage.css";

// Função para extrair o número da quadra
function getQuadraNumber(feature: PolygonFeature): string {
  for (const [key, value] of Object.entries(feature.properties)) {
    if (
      key.includes("Quadra") ||
      key.includes("Cartão") ||
      key.includes("Cartao")
    ) {
      const match = String(value).match(/(\d+)/);
      if (match) return match[1];
    }
  }
  const nome = feature.properties.nome || "";
  const nomeMatch = nome.match(/(\d+)/);
  if (nomeMatch) return nomeMatch[1];
  const id = feature.properties.id || "";
  const idMatch = id.match(/(\d+)/);
  if (idMatch) return idMatch[1];
  return "?";
}

export default function MapPage() {
  const navigate = useNavigate();
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isGPSActive, setIsGPSActive] = useState(false);
  const [selectedPolygon, setSelectedPolygon] = useState<PolygonFeature | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [polygonToFocus, setPolygonToFocus] = useState<PolygonFeature | null>(
    null
  );
  const [highlightedPolygonId, setHighlightedPolygonId] = useState<
    string | null
  >(null);
  const [statusLogs, setStatusLogs] = useState<StatusChangeLog[]>([]);
  const [activeTab, setActiveTab] = useState<"map" | "logs">("map");

  // Ref para manter o valor atual do modo de edição sem delay
  const isEditModeRef = useRef(isEditMode);

  // Atualiza a ref sempre que o estado mudar
  useEffect(() => {
    isEditModeRef.current = isEditMode;
  }, [isEditMode]);

  // Verifica autenticação
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  const handleFocusQuadra = (quadraId: string) => {
    if (!geoJsonData) return;
    const polygon = geoJsonData.features.find(
      (f) => f.properties.id === quadraId
    );
    if (polygon) {
      // Garante que está na aba do mapa primeiro
      setActiveTab("map");

      // Limpa o foco anterior para forçar o re-foco
      setPolygonToFocus(null);

      // Delay maior para garantir que o mapa está renderizado após mudar de aba
      setTimeout(() => {
        setPolygonToFocus(polygon);
        setHighlightedPolygonId(quadraId);
        // Remove o destaque após 5 segundos
        setTimeout(() => {
          setHighlightedPolygonId(null);
        }, 5000);
      }, 300);
    }
  };

  const handlePolygonClick = (featureId: string) => {
    if (!geoJsonData) return;

    // Usa a ref para verificar o modo de edição imediatamente
    if (isEditModeRef.current) {
      const polygon = geoJsonData.features.find(
        (f) => f.properties.id === featureId
      );
      if (polygon) {
        setSelectedPolygon(polygon);
        setIsModalOpen(true);
      }
      return;
    }

    // Modo normal: muda o status
    console.log("handlePolygonClick called with id:", featureId);

    const updatedFeatures = geoJsonData.features.map((feature) => {
      if (feature.properties.id === featureId) {
        // Cicla entre os status: não iniciado -> em andamento -> concluído -> não iniciado
        const statusOrder: ("concluido" | "em_andamento" | "nao_iniciado")[] = [
          "nao_iniciado",
          "em_andamento",
          "concluido",
        ];
        const currentIndex = statusOrder.indexOf(feature.properties.status);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        const newStatus = statusOrder[nextIndex];
        const oldStatus = feature.properties.status;

        console.log(`Status changed: ${oldStatus} -> ${newStatus}`);

        // Registra o log de mudança de status
        const now = new Date();
        const quadraNumber = getQuadraNumber(feature);
        const log: StatusChangeLog = {
          quadraId: featureId,
          quadraNome: feature.properties.nome,
          quadraNumber,
          statusAnterior: oldStatus,
          statusNovo: newStatus,
          data: now,
          formatted: formatDate(now),
        };
        setStatusLogs((prev) => [...prev, log]);

        // Foca automaticamente na última quadra trabalhada
        if (newStatus === "em_andamento" || newStatus === "concluido") {
          handleFocusQuadra(featureId);
        }

        return {
          ...feature,
          properties: {
            ...feature.properties,
            status: newStatus,
          },
        };
      }
      return feature;
    });

    setGeoJsonData({
      ...geoJsonData,
      features: updatedFeatures,
    });
  };

  const handleSavePolygon = (updatedPolygon: PolygonFeature) => {
    if (!geoJsonData) return;

    const updatedFeatures = geoJsonData.features.map((feature) => {
      if (feature.properties.id === updatedPolygon.properties.id) {
        return updatedPolygon;
      }
      return feature;
    });

    setGeoJsonData({
      ...geoJsonData,
      features: updatedFeatures,
    });
  };

  const handleSearchSelect = (polygon: PolygonFeature) => {
    setPolygonToFocus(polygon);
    // Limpa o foco após um tempo para permitir novo foco
    setTimeout(() => {
      setPolygonToFocus(null);
    }, 1000);
  };

  const handleHighlightPolygon = (polygonId: string | null) => {
    setHighlightedPolygonId(polygonId);
  };

  const handleDeleteLog = (quadraId: string) => {
    // Remove todos os logs relacionados a essa quadra
    setStatusLogs((prev) => prev.filter((log) => log.quadraId !== quadraId));
  };

  // Processa os logs para criar o formato de quadra com início e finalização
  const quadraLogs = useMemo(() => {
    const logsMap = new Map<string, QuadraLog>();

    statusLogs.forEach((log) => {
      if (!logsMap.has(log.quadraId)) {
        logsMap.set(log.quadraId, {
          quadraId: log.quadraId,
          quadraNome: log.quadraNome,
          quadraNumber: log.quadraNumber,
        });
      }

      const quadraLog = logsMap.get(log.quadraId)!;

      // Se mudou para "em_andamento", registra como início
      if (log.statusNovo === "em_andamento" && !quadraLog.inicio) {
        quadraLog.inicio = {
          status: log.statusNovo,
          data: log.data,
          formatted: log.formatted,
        };
      }

      // Se mudou para "concluido", registra como finalizado
      if (log.statusNovo === "concluido") {
        quadraLog.finalizado = {
          status: log.statusNovo,
          data: log.data,
          formatted: log.formatted,
        };
      }

      // Se voltou para "nao_iniciado" após estar em andamento, reseta
      if (
        log.statusNovo === "nao_iniciado" &&
        log.statusAnterior === "em_andamento"
      ) {
        quadraLog.inicio = undefined;
        quadraLog.finalizado = undefined;
      }
    });

    return logsMap;
  }, [statusLogs]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="map-page">
      <div className="page-header">
        <h1>Mapa de Quadras</h1>
        <div className="header-actions">
          <button
            className="nav-button"
            onClick={() => navigate("/editor")}
            title="Editor de Quadras"
          >
            <Pencil size={16} />
            <span>Editor</span>
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </div>
      <Tabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        recentQuadras={
          <RecentQuadras
            quadraLogs={quadraLogs}
            geoJsonData={geoJsonData}
            onFocusQuadra={handleFocusQuadra}
            onSwitchToMap={() => setActiveTab("map")}
          />
        }
        mapContent={
          <div style={{ position: "relative", width: "100%", height: "100%" }}>
            <Menu>
              <ThemeToggle />
              <SearchButton onClick={() => setIsSearchModalOpen(true)} />
              <GPSButton
                isActive={isGPSActive}
                onToggle={() => setIsGPSActive(!isGPSActive)}
              />
              <EditModeButton
                isEditMode={isEditMode}
                onToggle={() => setIsEditMode(!isEditMode)}
              />
            </Menu>
            <MapComponent
              geoJsonData={geoJsonData}
              setGeoJsonData={setGeoJsonData}
              onPolygonClick={handlePolygonClick}
              isEditMode={isEditMode}
              isGPSActive={isGPSActive}
              polygonToFocus={polygonToFocus}
              highlightedPolygonId={highlightedPolygonId}
            />
            <SearchModal
              isOpen={isSearchModalOpen}
              onClose={() => setIsSearchModalOpen(false)}
              geoJsonData={geoJsonData}
              onSelectPolygon={handleSearchSelect}
              onHighlightPolygon={handleHighlightPolygon}
            />
            <EditPolygonModal
              polygon={selectedPolygon}
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedPolygon(null);
              }}
              onSave={handleSavePolygon}
            />
          </div>
        }
        logsContent={
          <LogsTab
            logs={statusLogs}
            quadraLogs={quadraLogs}
            onDeleteLog={handleDeleteLog}
            cityName="Dormentes"
          />
        }
      />
    </div>
  );
}
