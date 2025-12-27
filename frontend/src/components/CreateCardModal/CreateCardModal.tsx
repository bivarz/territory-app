import { useState } from 'react';
import { X } from 'lucide-react';
import { PolygonFeature } from '../../types/polygon';
import './CreateCardModal.css';

interface CreateCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (card: PolygonFeature) => void;
  selectedQuadras?: PolygonFeature[];
  existingCards?: any[];
}

export default function CreateCardModal({
  isOpen,
  onClose,
  onSave,
  selectedQuadras = [],
  existingCards = [],
}: CreateCardModalProps) {
  const [cardId, setCardId] = useState('');
  const [cardName, setCardName] = useState('');
  const [bairro, setBairro] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!cardId.trim() || !cardName.trim()) {
      alert('Por favor, preencha o ID e o nome do cartão');
      return;
    }

    if (!selectedQuadras || selectedQuadras.length === 0) {
      alert('Por favor, selecione pelo menos uma quadra');
      return;
    }

    try {
      // Valida as quadras selecionadas
      if (selectedQuadras.length === 0) {
        throw new Error('Nenhuma quadra selecionada');
      }

      // Valida que a primeira quadra tem geometria válida
      const firstQuadra = selectedQuadras[0];
      if (!firstQuadra.geometry || !firstQuadra.geometry.coordinates) {
        throw new Error('Primeira quadra não possui geometria válida');
      }
      if (firstQuadra.geometry.type !== 'Polygon') {
        throw new Error('Primeira quadra não é um polígono válido');
      }

      // Copia os dados do polígono da primeira quadra
      const quadraGeometry = {
        type: 'Polygon' as const,
        coordinates: JSON.parse(JSON.stringify(firstQuadra.geometry.coordinates)), // Deep copy
      };

      // Gera uma cor hexadecimal única para o cartão
      const generateUniqueColor = (): string => {
        // Coleta todas as cores já usadas
        const usedColors = new Set<string>();
        existingCards.forEach((card) => {
          if (card.color && card.id !== cardId.trim()) {
            usedColors.add(card.color.toLowerCase());
          }
        });

        // Tenta gerar uma cor única (máximo de 100 tentativas)
        for (let attempt = 0; attempt < 100; attempt++) {
          // Gera uma cor com boa visibilidade (não muito clara, não muito escura)
          const r = Math.floor(Math.random() * 156) + 100; // 100-255
          const g = Math.floor(Math.random() * 156) + 100; // 100-255
          const b = Math.floor(Math.random() * 156) + 100; // 100-255
          const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toLowerCase();
          
          if (!usedColors.has(color)) {
            return color;
          }
        }
        
        // Se não conseguir gerar uma cor única, retorna uma cor padrão
        return '#808080';
      };

      // Verifica se o cartão já existe e tem cor
      const existingCard = existingCards.find(c => c.id === cardId.trim());
      const cardColor = existingCard?.color || generateUniqueColor();

      // Extrai as IDs e nomes das quadras
      const quadraIds = selectedQuadras.map(q => q.properties.id);
      const quadraNames = selectedQuadras.map(q => q.properties.nome || q.properties.id);

      const newCard: PolygonFeature = {
        type: 'Feature',
        properties: {
          id: cardId.trim(),
          nome: cardName.trim(),
          bairro: bairro.trim(),
          status: 'nao_iniciado',
          quadraIds: quadraIds,
          quadraNames: quadraNames,
          totalQuadras: selectedQuadras.length,
          color: cardColor, // Adiciona a cor hexadecimal ao cartão
        },
        geometry: quadraGeometry,
      };

      console.log('Cartão criado com sucesso:', newCard);
      onSave(newCard);
      setCardId('');
      setCardName('');
      setBairro('');
      onClose();
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao criar cartão: ${errorMessage}`);
    }
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
              placeholder="Ex: C-01"
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

          {selectedQuadras.length > 0 && (
            <div className="selection-info">
              <p><strong>{selectedQuadras.length}</strong> quadra(s) selecionada(s):</p>
              <ul className="quadra-list">
                {selectedQuadras.map((quadra) => (
                  <li key={quadra.properties.id}>
                    {quadra.properties.nome || quadra.properties.id}
                  </li>
                ))}
              </ul>
              <p className="form-success">
                ✓ Os dados dos polígonos das quadras serão copiados para o cartão.
              </p>
            </div>
          )}

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
          <button className="btn-save" onClick={handleSave}>
            Criar Cartão
          </button>
        </div>
      </div>
    </div>
  );
}

