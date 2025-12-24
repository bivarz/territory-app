import { useState } from 'react';
import { X } from 'lucide-react';
import { PolygonFeature } from '../../types/polygon';
import './CreateCardModal.css';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: PolygonFeature) => void;
  drawnCoordinates?: number[][][];
}

export default function CreateCardModal({
  isOpen,
  onClose,
  onSave,
  drawnCoordinates,
}: CreateCardModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!cardNumber.trim() || !cardName.trim()) {
      alert('Por favor, preencha o número e o nome do cartão');
      return;
    }

    if (!drawnCoordinates || drawnCoordinates.length === 0) {
      alert('Por favor, desenhe um polígono no mapa primeiro');
      return;
    }

    const newCard: PolygonFeature = {
      type: 'Feature',
      properties: {
        id: `card-${Date.now()}`,
        [`Cartão ${cardNumber}`]: cardName,
        status: 'nao_iniciado',
      },
      geometry: {
        type: 'Polygon',
        coordinates: drawnCoordinates,
      },
    };

    onSave(newCard);
    setCardNumber('');
    setCardName('');
    onClose();
  };

  const handleCancel = () => {
    setCardNumber('');
    setCardName('');
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
            <label>Número do Cartão:</label>
            <input
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="Ex: 29"
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

          {!drawnCoordinates && (
            <div className="form-hint">
              <p>⚠️ Desenhe um polígono no mapa antes de salvar</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={handleCancel}>
            Cancelar
          </button>
          <button className="btn-save" onClick={handleSave}>
            Criar Cartão
          </button>
        </div>
      </div>
    </div>
  );
}

