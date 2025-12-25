import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Trash2, Save, Map, LogOut, CreditCard } from "lucide-react";
import EditorMapComponent from "../../components/EditorMapComponent";
import CreateCardModal from "../../components/CreateCardModal";
import { GeoJSONData, PolygonFeature } from "../../types/polygon";
import initialGeoJsonData from "../../data/dormentes-blocks.json";
import "./EditorPage.css";

export default function EditorPage() {
  const navigate = useNavigate();
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);
  const [mapMode, setMapMode] = useState<'create' | 'edit' | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingType, setDrawingType] = useState<'card' | 'quadra' | null>(null);
  const [drawnCoordinates, setDrawnCoordinates] = useState<number[][][] | undefined>();
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);

  // Verifica autenticação
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  // Carrega dados iniciais
  useEffect(() => {
    if (!geoJsonData) {
      setGeoJsonData(initialGeoJsonData as GeoJSONData);
    }
  }, [geoJsonData]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleCreateCard = () => {
    setMapMode('create');
    setIsDrawingMode(true);
    setDrawingType('card');
    setDrawnCoordinates(undefined);
  };

  const handleEditCard = () => {
    setMapMode('edit');
    setIsDrawingMode(false);
    setDrawingType(null);
  };

  const handleCreateQuadra = () => {
    setMapMode(null);
    setIsDrawingMode(true);
    setDrawingType('quadra');
    setDrawnCoordinates(undefined);
  };

  const handlePolygonDrawn = (coordinates: number[][][]) => {
    setDrawnCoordinates(coordinates);
    if (drawingType === 'card') {
      setShowCreateCardModal(true);
    }
  };

  const handlePolygonClick = (feature: PolygonFeature) => {
    console.log("Polygon clicked:", feature.properties.id);
  };

  const handleSaveCard = (card: PolygonFeature) => {
    if (geoJsonData) {
      const updatedFeatures = [...geoJsonData.features, card];
      setGeoJsonData({
        ...geoJsonData,
        features: updatedFeatures,
      });
    }
    setShowCreateCardModal(false);
    setIsDrawingMode(false);
    setDrawingType(null);
    setDrawnCoordinates(undefined);
    setMapMode(null);
  };

  return (
    <div className="editor-page">
      <div className="page-header">
        <h1>Editor de Quadras</h1>
        <div className="header-actions">
          <button
            className="nav-button"
            onClick={() => navigate("/mapas")}
            title="Voltar para Mapas"
          >
            <Map size={16} />
            <span>Mapas</span>
          </button>
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sair</span>
          </button>
        </div>
      </div>

      <div className="editor-content">
        <div className="editor-sidebar">
          <div className="sidebar-section">
            <h3>Ferramentas</h3>
            <div className="tool-buttons">
              <button 
                className={`tool-button ${mapMode === 'create' ? 'active' : ''}`}
                onClick={handleCreateCard}
              >
                <CreditCard size={20} />
                <span>Criar Cartão</span>
              </button>
              <button 
                className={`tool-button ${mapMode === 'edit' ? 'active' : ''}`}
                onClick={handleEditCard}
              >
                <MapPin size={20} />
                <span>Editar Cartão</span>
              </button>
              <button 
                className={`tool-button ${drawingType === 'quadra' ? 'active' : ''}`}
                onClick={handleCreateQuadra}
              >
                <Plus size={20} />
                <span>Criar Quadra</span>
              </button>
              <button className="tool-button">
                <Save size={20} />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Agrupamentos</h3>
            <div className="group-list">
              <p className="empty-state">
                Nenhum agrupamento criado ainda
              </p>
            </div>
          </div>
        </div>

        <div className="editor-main">
          <EditorMapComponent
            geoJsonData={geoJsonData}
            onPolygonDrawn={handlePolygonDrawn}
            isDrawingMode={isDrawingMode}
            drawingType={drawingType}
            isEditMode={mapMode === 'edit'}
            onPolygonClick={handlePolygonClick}
          />
        </div>

        {showCreateCardModal && (
          <CreateCardModal
            isOpen={showCreateCardModal}
            onClose={() => {
              setShowCreateCardModal(false);
              setIsDrawingMode(false);
              setDrawingType(null);
              setDrawnCoordinates(undefined);
            }}
            onSave={handleSaveCard}
            drawnCoordinates={drawnCoordinates}
          />
        )}
      </div>
    </div>
  );
}

