import { useState } from 'react';
import { X } from 'lucide-react';
import { PolygonFeature, PolygonStatus } from '../../types/polygon';
import './CreateQuadraModal.css';

interface CreateQuadraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (quadra: PolygonFeature) => void;
  drawnCoordinates?: number[][][];
}

export default function CreateQuadraModal({
  isOpen,
  onClose,
  onSave,
  drawnCoordinates,
}: CreateQuadraModalProps) {
  const [nome, setNome] = useState('');
  const [status, setStatus] = useState<PolygonStatus>('nao_iniciado');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!nome.trim()) {
      alert('Por favor, preencha o nome da quadra');
      return;
    }

    if (!drawnCoordinates || drawnCoordinates.length === 0) {
      alert('Por favor, desenhe um polígono no mapa primeiro');
      return;
    }

    const newQuadra: PolygonFeature = {
      type: 'Feature',
      properties: {
        id: `polygon-${Date.now()}`,
        nome: nome.trim(),
        status: status,
      },
      geometry: {
        type: 'Polygon',
        coordinates: drawnCoordinates,
      },
    };

    onSave(newQuadra);
    setNome('');
    setStatus('nao_iniciado');
    onClose();
  };

  const handleCancel = () => {
    setNome('');
    setStatus('nao_iniciado');
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Criar Quadra</h2>
          <button className="modal-close" onClick={handleCancel}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Nome da Quadra:</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Quadra 1"
            />
          </div>

          <div className="form-group">
            <label>Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PolygonStatus)}
            >
              <option value="nao_iniciado">Não Iniciado</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
            </select>
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
            Criar Quadra
          </button>
        </div>
      </div>
    </div>
  );
}

