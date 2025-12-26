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
  const [selectedQuadraIds, setSelectedQuadraIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

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
    setIsSelectionMode(true);
    setIsDrawingMode(false);
    setDrawingType(null);
    setSelectedQuadraIds(new Set());
  };

  const handleEditCard = () => {
    setMapMode('edit');
    setIsSelectionMode(false);
    setIsDrawingMode(false);
    setDrawingType(null);
    setSelectedQuadraIds(new Set());
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
    if (isSelectionMode) {
      // Selection is handled by EditorMapComponent
      return;
    }
    console.log("Polygon clicked:", feature.properties.id);
  };

  const handleSelectionChange = (selectedIds: Set<string>) => {
    setSelectedQuadraIds(selectedIds);
    // Não abre o modal automaticamente - usuário deve clicar no botão
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
    setIsSelectionMode(false);
    setIsDrawingMode(false);
    setDrawingType(null);
    setDrawnCoordinates(undefined);
    setSelectedQuadraIds(new Set());
    setMapMode(null);
    
    alert('Cartão criado com sucesso!');
  };

  // Get all quadra IDs that are already in cards
  const getQuadrasInCards = (): Set<string> => {
    if (!geoJsonData) return new Set();
    
    const quadrasInCards = new Set<string>();
    
    geoJsonData.features.forEach((feature) => {
      // Check if this is a card
      if (feature.properties.id.startsWith('card-')) {
        // Get quadraIds from card properties
        const quadraIds = feature.properties.quadraIds;
        if (Array.isArray(quadraIds)) {
          quadraIds.forEach((id: string) => {
            quadrasInCards.add(id);
          });
        }
      }
    });
    
    return quadrasInCards;
  };

  const quadrasInCards = getQuadrasInCards();

  // Get selected quadras from geoJsonData
  const selectedQuadras: PolygonFeature[] = geoJsonData
    ? geoJsonData.features.filter((f) => 
        selectedQuadraIds.has(f.properties.id) && !f.properties.id.startsWith('card-')
      )
    : [];

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
            isEditMode={mapMode === 'edit' || isSelectionMode}
            onPolygonClick={handlePolygonClick}
            selectedQuadraIds={selectedQuadraIds}
            onSelectionChange={handleSelectionChange}
            isSelectionMode={isSelectionMode}
            unavailableQuadraIds={quadrasInCards}
          />
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '10px',
              borderRadius: '5px',
              fontSize: '12px',
              zIndex: 1000,
            }}>
              <div>Selection Mode: {isSelectionMode ? 'ON' : 'OFF'}</div>
              <div>Selected: {selectedQuadraIds.size}</div>
              <div>Has Handler: {handleSelectionChange ? 'YES' : 'NO'}</div>
            </div>
          )}
          
          {isSelectionMode && (
            <div className="selection-controls">
              <div className="selection-info">
                <h4>Selecionar Quadras</h4>
                <p>
                  <strong>{selectedQuadraIds.size}</strong> selecionada(s)
                </p>
                
                {selectedQuadras.length > 0 && (
                  <div className="selected-quadras-list">
                    <p>Quadras:</p>
                    <ul>
                      {selectedQuadras.map((q) => (
                        <li key={q.properties.id}>
                          <span>{q.properties.nome || q.properties.id}</span>
                          <button
                            onClick={() => {
                              const newSelection = new Set(selectedQuadraIds);
                              newSelection.delete(q.properties.id);
                              setSelectedQuadraIds(newSelection);
                            }}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {quadrasInCards.size > 0 && (
                  <p style={{ fontSize: '11px', color: '#ef4444', margin: '4px 0' }}>
                    ⚠️ {quadrasInCards.size} já em cartões
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  <button
                    className="btn-cancel-selection"
                    onClick={() => {
                      setSelectedQuadraIds(new Set());
                      setIsSelectionMode(false);
                      setMapMode(null);
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-create-card"
                    onClick={() => {
                      if (selectedQuadraIds.size === 0) {
                        alert('Por favor, selecione pelo menos uma quadra no mapa');
                        return;
                      }
                      setShowCreateCardModal(true);
                    }}
                    disabled={selectedQuadraIds.size === 0}
                  >
                    <CreditCard size={14} />
                    Criar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {showCreateCardModal && (
          <CreateCardModal
            isOpen={showCreateCardModal}
            onClose={() => {
              setShowCreateCardModal(false);
            }}
            onSave={handleSaveCard}
            selectedQuadras={selectedQuadras}
            geoJsonData={geoJsonData}
          />
        )}
      </div>
    </div>
  );
}

