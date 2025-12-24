import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Trash2, Save, Map, LogOut, CreditCard } from "lucide-react";
import MapComponent from "../../components/MapComponent";
import { GeoJSONData } from "../../types/polygon";
import "./EditorPage.css";

export default function EditorPage() {
  const navigate = useNavigate();
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapMode, setMapMode] = useState<'create' | 'edit' | null>(null);

  // Verifica autenticação
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleCreateCard = () => {
    setMapMode('create');
    setShowMap(true);
  };

  const handleEditCard = () => {
    setMapMode('edit');
    setShowMap(true);
  };

  const handleCloseMap = () => {
    setShowMap(false);
    setMapMode(null);
  };

  const handlePolygonClick = (featureId: string) => {
    // Handler para cliques em polígonos no modo de edição
    console.log("Polygon clicked:", featureId);
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
              <button className="tool-button">
                <Plus size={20} />
                <span>Criar Quadra</span>
              </button>
              <button className="tool-button">
                <Save size={20} />
                <span>Salvar Alterações</span>
              </button>
              {showMap && (
                <button 
                  className="tool-button"
                  onClick={handleCloseMap}
                  style={{ marginTop: '8px', backgroundColor: '#ef4444' }}
                >
                  <MapPin size={20} />
                  <span>Fechar Mapa</span>
                </button>
              )}
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
          {showMap ? (
            <MapComponent
              geoJsonData={geoJsonData}
              setGeoJsonData={setGeoJsonData}
              onPolygonClick={handlePolygonClick}
              isEditMode={mapMode === 'edit'}
              isGPSActive={false}
            />
          ) : (
            <div className="editor-placeholder">
              <MapPin size={64} />
              <h2>Editor de Quadras</h2>
              <p>
                Esta página será usada para criar, desenhar e definir quadras e
                agrupamentos de quadras.
              </p>
              <p className="placeholder-hint">
                Clique em "Criar Cartão" ou "Editar Cartão" para começar
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

