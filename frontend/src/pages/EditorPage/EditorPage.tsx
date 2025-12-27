import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Plus, Save, Map, LogOut, CreditCard, X, List, Trash2 } from "lucide-react";
import MapComponent from "../../components/MapComponent";
import CreateCardModal from "../../components/CreateCardModal/CreateCardModal";
import { GeoJSONData, PolygonFeature } from "../../types/polygon";
import "./EditorPage.css";

export default function EditorPage() {
  const navigate = useNavigate();
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData | null>(null);
  const [mapMode, setMapMode] = useState<'create' | 'edit' | null>(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedQuadraIds, setSelectedQuadraIds] = useState<Set<string>>(new Set());
  const [showCreateCardModal, setShowCreateCardModal] = useState(false);
  const [showCardsList, setShowCardsList] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [cards, setCards] = useState<any[]>([]);

  // Verifica autenticação
  useEffect(() => {
    const isAuthenticated = localStorage.getItem("isAuthenticated");
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate]);

  // Carrega os cartões do localStorage
  useEffect(() => {
    const loadCards = () => {
      try {
        const cardsData = localStorage.getItem('cards');
        if (cardsData) {
          const parsedCards = JSON.parse(cardsData);
          setCards(Array.isArray(parsedCards) ? parsedCards : []);
        }
      } catch (error) {
        console.error('Erro ao carregar cartões:', error);
        setCards([]);
      }
    };

    loadCards();
    // Recarrega quando um cartão é salvo
    const handleStorageChange = () => {
      loadCards();
    };
    window.addEventListener('storage', handleStorageChange);
    
    // Também recarrega quando o componente monta novamente
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [showCreateCardModal]); // Recarrega quando o modal fecha

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("username");
    navigate("/login");
  };

  const handleCreateCard = () => {
    setMapMode('create');
    setIsSelectionMode(true);
    setSelectedQuadraIds(new Set());
  };

  // Identifica quadras que já estão em cartões existentes
  const unavailableQuadraIds = useMemo(() => {
    if (!geoJsonData) return new Set<string>();
    
    const unavailable = new Set<string>();
    geoJsonData.features.forEach((feature) => {
      // Verifica se é um cartão (pode ter propriedades específicas de cartão)
      const isCard = feature.properties.quadraIds || 
                     feature.properties.tipo === 'card' ||
                     feature.properties.id?.startsWith('card-');
      
      if (isCard && feature.properties.quadraIds) {
        const quadraIds = Array.isArray(feature.properties.quadraIds) 
          ? feature.properties.quadraIds 
          : [];
        quadraIds.forEach((id: string) => unavailable.add(id));
      }
    });
    
    return unavailable;
  }, [geoJsonData]);

  const handleSelectionChange = (quadraId: string) => {
    if (!isSelectionMode) return;
    
    setSelectedQuadraIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(quadraId)) {
        newSet.delete(quadraId);
      } else {
        // Verifica se a quadra não está em um cartão
        if (!unavailableQuadraIds.has(quadraId)) {
          newSet.add(quadraId);
        } else {
          alert('Esta quadra já está em um cartão e não pode ser selecionada.');
        }
      }
      return newSet;
    });
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedQuadraIds(new Set());
  };

  const handleCreateCardFromSelection = () => {
    if (selectedQuadraIds.size === 0) {
      alert('Selecione pelo menos uma quadra para criar um cartão.');
      return;
    }
    setShowCreateCardModal(true);
  };

  const handleSaveCard = (card: PolygonFeature) => {
    if (!geoJsonData) return;

    // Cria o objeto JSON do cartão com os polígonos das quadras
    const cardData = {
      id: card.properties.id,
      nome: card.properties.nome,
      bairro: card.properties.bairro || '',
      status: card.properties.status,
      quadraIds: card.properties.quadraIds || [],
      quadraNames: card.properties.quadraNames || [],
      totalQuadras: card.properties.totalQuadras || 0,
      color: card.properties.color || '#808080', // Cor hexadecimal do cartão (padrão cinza se não houver)
      // Inclui os polígonos das quadras selecionadas
      quadras: selectedQuadras.map(quadra => ({
        id: quadra.properties.id,
        nome: quadra.properties.nome,
        geometry: quadra.geometry,
        properties: quadra.properties,
      })),
      // Geometria do cartão (união das quadras)
      geometry: card.geometry,
      createdAt: new Date().toISOString(),
    };

    // Salva no localStorage
    try {
      const existingCards = localStorage.getItem('cards');
      let cardsArray: any[] = [];
      
      if (existingCards) {
        cardsArray = JSON.parse(existingCards);
      }
      
      // Verifica se já existe um cartão com o mesmo ID e substitui
      const existingIndex = cardsArray.findIndex(c => c.id === cardData.id);
      if (existingIndex >= 0) {
        cardsArray[existingIndex] = cardData;
      } else {
        cardsArray.push(cardData);
      }
      
      localStorage.setItem('cards', JSON.stringify(cardsArray, null, 2));
      
      console.log('Cartão salvo no localStorage:', cardData);
      alert('Cartão salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar cartão no localStorage:', error);
      alert('Erro ao salvar cartão. Verifique o console para mais detalhes.');
    }

    // Atualiza o estado do mapa também
    const updatedFeatures = [...geoJsonData.features, card];
    setGeoJsonData({
      ...geoJsonData,
      features: updatedFeatures,
    });

    // Reseta o estado de seleção
    setIsSelectionMode(false);
    setSelectedQuadraIds(new Set());
    setShowCreateCardModal(false);
    
    // Recarrega os cartões
    try {
      const cardsData = localStorage.getItem('cards');
      if (cardsData) {
        const parsedCards = JSON.parse(cardsData);
        setCards(Array.isArray(parsedCards) ? parsedCards : []);
      }
    } catch (error) {
      console.error('Erro ao recarregar cartões:', error);
    }
  };

  // Obtém as quadras selecionadas
  const selectedQuadras = useMemo(() => {
    if (!geoJsonData) return [];
    
    return geoJsonData.features.filter((feature) => 
      selectedQuadraIds.has(feature.properties.id) &&
      !feature.properties.quadraIds && // Não é um cartão
      !feature.properties.id?.startsWith('card-')
    );
  }, [geoJsonData, selectedQuadraIds]);

  const handleEditCard = () => {
    setMapMode('edit');
    setIsSelectionMode(false);
    setSelectedQuadraIds(new Set());
  };

  const handlePolygonClick = (featureId: string) => {
    // Handler para cliques em polígonos no modo de edição
    console.log("Polygon clicked:", featureId);
  };

  const handleShowCards = () => {
    // Recarrega os cartões antes de mostrar
    try {
      const cardsData = localStorage.getItem('cards');
      if (cardsData) {
        const parsedCards = JSON.parse(cardsData);
        setCards(Array.isArray(parsedCards) ? parsedCards : []);
      } else {
        setCards([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
      setCards([]);
    }
    setShowCardsList(true);
  };

  const handleSelectCard = (cardId: string) => {
    setSelectedCardId(cardId);
    setShowCardsList(false);
    setIsSelectionMode(false);
    setMapMode(null);
  };

  const handleClearCardFilter = () => {
    setSelectedCardId(null);
    setShowCardsList(false);
  };

  const handleCloseCardsList = () => {
    setShowCardsList(false);
    // Se não houver cartão selecionado, limpa o filtro
    if (!selectedCardId) {
      // O filtro será limpo automaticamente quando showCardsList for false
    }
  };

  const handleDeleteCard = (cardId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Previne que o clique selecione o cartão
    
    const card = cards.find(c => c.id === cardId);
    const cardName = card?.nome || cardId;
    
    if (!confirm(`Tem certeza que deseja deletar o cartão "${cardName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const existingCards = localStorage.getItem('cards');
      if (existingCards) {
        const cardsArray = JSON.parse(existingCards);
        const filteredCards = cardsArray.filter((c: any) => c.id !== cardId);
        localStorage.setItem('cards', JSON.stringify(filteredCards, null, 2));
        
        // Atualiza o estado
        setCards(filteredCards);
        
        // Se o cartão deletado estava selecionado, limpa a seleção
        if (selectedCardId === cardId) {
          setSelectedCardId(null);
        }
        
        // Remove o cartão do geoJsonData também
        if (geoJsonData) {
          const updatedFeatures = geoJsonData.features.filter(
            (feature) => feature.properties.id !== cardId
          );
          setGeoJsonData({
            ...geoJsonData,
            features: updatedFeatures,
          });
        }
        
        alert('Cartão deletado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao deletar cartão:', error);
      alert('Erro ao deletar cartão. Verifique o console para mais detalhes.');
    }
  };

  // Usa as cores hexadecimais salvas nos cartões
  const quadraCardColors = useMemo(() => {
    const quadraColorMap: Record<string, { fill: string; stroke: string }> = {};
    
    cards.forEach((card) => {
      if (card.quadraIds && Array.isArray(card.quadraIds)) {
        // SEMPRE usa a cor salva no cartão, nunca gera nova
        // Se não houver cor salva, usa cinza como fallback
        const cardColorHex = card.color || '#808080';
        
        // Converte hex para RGB para criar uma versão mais escura para o stroke
        const hex = cardColorHex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        // Cria uma versão mais escura para o stroke (reduz 20% da luminosidade)
        const darkerR = Math.max(0, Math.floor(r * 0.8));
        const darkerG = Math.max(0, Math.floor(g * 0.8));
        const darkerB = Math.max(0, Math.floor(b * 0.8));
        
        const strokeColor = `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
        
        const colorPair = {
          fill: cardColorHex,
          stroke: strokeColor,
        };
        
        // Aplica a cor a todas as quadras do cartão
        card.quadraIds.forEach((quadraId: string) => {
          quadraColorMap[quadraId] = colorPair;
        });
      }
    });
    
    return quadraColorMap;
  }, [cards]);

  // Filtra o geoJsonData para mostrar apenas as quadras associadas a cartões
  const filteredGeoJsonData = useMemo(() => {
    if (!geoJsonData) {
      return geoJsonData;
    }

    // Se um cartão específico está selecionado, mostra apenas as quadras desse cartão
    if (selectedCardId) {
      const selectedCard = cards.find(c => c.id === selectedCardId);
      if (selectedCard && selectedCard.quadraIds) {
        const quadraIdsSet = new Set(selectedCard.quadraIds);
        const filteredFeatures = geoJsonData.features.filter((feature) => 
          quadraIdsSet.has(feature.properties.id)
        );

        return {
          ...geoJsonData,
          features: filteredFeatures,
        };
      }
    }

    // Se o modal de cartões está aberto (mas nenhum cartão específico selecionado),
    // mostra todas as quadras que estão associadas a qualquer cartão
    if (showCardsList) {
      // Coleta todos os IDs de quadras que estão em qualquer cartão
      const allQuadraIdsInCards = new Set<string>();
      cards.forEach((card) => {
        if (card.quadraIds && Array.isArray(card.quadraIds)) {
          card.quadraIds.forEach((id: string) => allQuadraIdsInCards.add(id));
        }
      });

      // Filtra apenas as quadras que estão em algum cartão
      const filteredFeatures = geoJsonData.features.filter((feature) => 
        allQuadraIdsInCards.has(feature.properties.id)
      );

      return {
        ...geoJsonData,
        features: filteredFeatures,
      };
    }

    // Caso contrário, mostra todas as quadras
    return geoJsonData;
  }, [geoJsonData, selectedCardId, cards, showCardsList]);

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
              <button 
                className={`tool-button ${selectedCardId ? 'active' : ''}`}
                onClick={handleShowCards}
              >
                <List size={20} />
                <span>Ver Cartões</span>
              </button>
              {selectedCardId && (
                <button 
                  className="tool-button"
                  onClick={handleClearCardFilter}
                  style={{ backgroundColor: '#ef4444', color: 'white' }}
                >
                  <X size={20} />
                  <span>Limpar Filtro</span>
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-section">
            <h3>Agrupamentos</h3>
            <div className="group-list">
              {selectedCardId ? (
                <div className="card-info">
                  <p><strong>Cartão selecionado:</strong></p>
                  <p>{cards.find(c => c.id === selectedCardId)?.nome || selectedCardId}</p>
                  <p className="card-details">
                    {cards.find(c => c.id === selectedCardId)?.totalQuadras || 0} quadra(s)
                  </p>
                </div>
              ) : (
                <p className="empty-state">
                  Nenhum agrupamento criado ainda
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="editor-main">
          <MapComponent
            geoJsonData={filteredGeoJsonData}
            setGeoJsonData={setGeoJsonData}
            onPolygonClick={isSelectionMode ? handleSelectionChange : handlePolygonClick}
            isEditMode={mapMode === 'edit'}
            isGPSActive={false}
            isSelectionMode={isSelectionMode}
            selectedQuadraIds={selectedQuadraIds}
            unavailableQuadraIds={unavailableQuadraIds}
            quadraCardColors={quadraCardColors}
          />
          {isSelectionMode && (
            <div className="selection-controls">
              <div className="selection-info">
                <h3>Selecionar Quadras</h3>
                <p>{selectedQuadraIds.size} quadra(s) selecionada(s)</p>
                {selectedQuadras.length > 0 && (
                  <div className="selected-quadras-list">
                    <ul>
                      {selectedQuadras.map((quadra) => (
                        <li key={quadra.properties.id}>
                          <span>{quadra.properties.nome || quadra.properties.id}</span>
                          <button
                            onClick={() => handleSelectionChange(quadra.properties.id)}
                            className="btn-remove-quadra"
                          >
                            <X size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="selection-actions">
                  <button
                    className="btn-cancel-selection"
                    onClick={handleCancelSelection}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn-create-card"
                    onClick={handleCreateCardFromSelection}
                    disabled={selectedQuadraIds.size === 0}
                  >
                    Criar Cartão
                  </button>
                </div>
              </div>
            </div>
          )}
          <CreateCardModal
            isOpen={showCreateCardModal}
            onClose={() => setShowCreateCardModal(false)}
            onSave={handleSaveCard}
            selectedQuadras={selectedQuadras}
            existingCards={cards}
          />
          {showCardsList && (
            <div className="cards-list-modal" onClick={handleCloseCardsList}>
              <div className="cards-list-content" onClick={(e) => e.stopPropagation()}>
                <div className="cards-list-header">
                  <h2>Cartões Criados</h2>
                  <button 
                    className="modal-close"
                    onClick={handleCloseCardsList}
                  >
                    <X size={24} />
                  </button>
                </div>
                <div className="cards-list-body">
                  {cards.length === 0 ? (
                    <p className="empty-state">Nenhum cartão criado ainda</p>
                  ) : (
                    <ul className="cards-list">
                      {cards.map((card) => (
                        <li 
                          key={card.id}
                          className={`card-item ${selectedCardId === card.id ? 'selected' : ''}`}
                          onClick={() => handleSelectCard(card.id)}
                        >
                          <div className="card-item-info">
                            <h3>{card.nome || card.id}</h3>
                            <p className="card-item-id">ID: {card.id}</p>
                            {card.bairro && <p className="card-item-bairro">Bairro: {card.bairro}</p>}
                            <p className="card-item-quadras">
                              {card.totalQuadras || 0} quadra(s)
                            </p>
                          </div>
                          <button
                            className="card-item-delete"
                            onClick={(e) => handleDeleteCard(card.id, e)}
                            title="Deletar cartão"
                          >
                            <Trash2 size={18} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

