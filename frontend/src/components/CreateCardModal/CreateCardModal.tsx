import { useState } from 'react';
import { X } from 'lucide-react';
import { PolygonFeature, GeoJSONData } from '../../types/polygon';
import union from '@turf/union';
import { Feature, Polygon } from '@turf/helpers';
import './CreateCardModal.css';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: PolygonFeature) => void;
  selectedQuadras: PolygonFeature[];
  geoJsonData: GeoJSONData | null;
}

export default function CreateCardModal({
  isOpen,
  onClose,
  onSave,
  selectedQuadras,
  geoJsonData,
}: CreateCardModalProps) {
  const [cardId, setCardId] = useState('');
  const [cardName, setCardName] = useState('');
  const [bairro, setBairro] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!cardId.trim() || !cardName.trim() || !bairro.trim()) {
      alert('Por favor, preencha o ID, nome e bairro do cartão');
      return;
    }

    if (selectedQuadras.length === 0) {
      alert('Por favor, selecione pelo menos uma quadra no mapa');
      return;
    }

    // Unite selected quadras to create territory polygon
    let territoryPolygon: Feature<Polygon> | null = null;
    
    if (selectedQuadras.length > 0) {
      territoryPolygon = {
        type: 'Feature',
        properties: {},
        geometry: selectedQuadras[0].geometry,
      } as Feature<Polygon>;
      
      // Union all remaining quadras
      for (let i = 1; i < selectedQuadras.length; i++) {
        if (territoryPolygon) {
          try {
            const quadraFeature: Feature<Polygon> = {
              type: 'Feature',
              properties: {},
              geometry: selectedQuadras[i].geometry,
            };
            
            const unionResult = union(territoryPolygon, quadraFeature);
            if (unionResult) {
              territoryPolygon = unionResult;
            }
          } catch (err) {
            console.error(`Error in union for quadra ${i + 1}:`, err);
          }
        }
      }
    }

    if (!territoryPolygon) {
      alert('Erro ao criar território. Tente novamente.');
      return;
    }

    // Get quadra IDs and names
    const quadraIds = selectedQuadras.map(q => q.properties.id);
    const quadraNames = selectedQuadras
      .map(q => q.properties.nome || q.properties.id)
      .filter(Boolean);

    // Create card with all required fields
    const newCard: PolygonFeature = {
      type: 'Feature',
      properties: {
        id: cardId.trim(),
        nome: cardName.trim(),
        bairro: bairro.trim(),
        status: 'nao_iniciado',
        // Reference to quadras
        quadraIds: quadraIds,
        quadraNames: quadraNames,
        totalQuadras: selectedQuadras.length,
      },
      geometry: territoryPolygon.geometry,
    };

    onSave(newCard);
    setCardId('');
    setCardName('');
    setBairro('');
    onClose();
  };

  const handleCancel = () => {
    setCardId('');
    setCardName('');
    setBairro('');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Criar Cartão</h2>
          <button className="modal-close" onClick={handleCancel}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>ID do Cartão:</label>
            <input
              type="text"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              placeholder="Ex: CARD-001"
            />
          </div>

          <div className="form-group">
            <label>Nome do Cartão:</label>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="Ex: Lagoas - Dormentes"
            />
          </div>

          <div className="form-group">
            <label>Bairro:</label>
            <input
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex: Centro"
            />
          </div>

          <div className="form-group">
            <label>Quadras Selecionadas:</label>
            <div className="selection-info">
              <p>{selectedQuadras.length} quadra(s) selecionada(s)</p>
              {selectedQuadras.length > 0 && (
                <ul className="quadra-list">
                  {selectedQuadras.map((q, idx) => (
                    <li key={q.properties.id || idx}>
                      {q.properties.nome || q.properties.id || `Quadra ${idx + 1}`}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {selectedQuadras.length === 0 && (
            <div className="form-hint">
              <p>⚠️ Selecione pelo menos uma quadra no mapa antes de salvar</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={selectedQuadras.length === 0}
          >
            Criar Cartão
          </button>
        </div>
      </div>
    </div>
  );
}

