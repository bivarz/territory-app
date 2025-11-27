import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { PolygonFeature } from '../App'
import './EditPolygonModal.css'

interface EditPolygonModalProps {
  polygon: PolygonFeature | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPolygon: PolygonFeature) => void
}

export default function EditPolygonModal({
  polygon,
  isOpen,
  onClose,
  onSave,
}: EditPolygonModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})

  useEffect(() => {
    if (polygon) {
      setFormData(polygon.properties)
    }
  }, [polygon])

  if (!isOpen || !polygon) return null

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleSave = () => {
    const updatedPolygon: PolygonFeature = {
      ...polygon,
      properties: {
        ...formData,
      } as PolygonFeature['properties'],
    }
    onSave(updatedPolygon)
    onClose()
  }

  const handleAddProperty = () => {
    const key = prompt('Nome da propriedade:')
    if (key && key.trim()) {
      handleChange(key.trim(), '')
    }
  }

  const handleRemoveProperty = (key: string) => {
    if (['id', 'nome', 'status'].includes(key)) {
      alert('Não é possível remover propriedades obrigatórias (id, nome, status)')
      return
    }
    const newData = { ...formData }
    delete newData[key]
    setFormData(newData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Editar Polígono</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>ID:</label>
            <input
              type="text"
              value={formData.id || ''}
              onChange={(e) => handleChange('id', e.target.value)}
              disabled
              className="disabled-input"
            />
          </div>

          <div className="form-group">
            <label>Nome:</label>
            <input
              type="text"
              value={formData.nome || ''}
              onChange={(e) => handleChange('nome', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Status:</label>
            <select
              value={formData.status || 'nao_iniciado'}
              onChange={(e) => handleChange('status', e.target.value)}
            >
              <option value="nao_iniciado">Não Iniciado</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
            </select>
          </div>

          <div className="properties-section">
            <div className="section-header">
              <h3>Outras Propriedades</h3>
              <button
                className="add-property-btn"
                onClick={handleAddProperty}
                type="button"
              >
                + Adicionar
              </button>
            </div>

            {Object.entries(formData)
              .filter(([key]) => !['id', 'nome', 'status'].includes(key))
              .map(([key, value]) => (
                <div key={key} className="property-row">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => {
                      const newData = { ...formData }
                      delete newData[key]
                      newData[e.target.value] = value
                      setFormData(newData)
                    }}
                    className="property-key"
                    placeholder="Chave"
                  />
                  <textarea
                    value={typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                    onChange={(e) => {
                      let parsedValue: any = e.target.value
                      // Tenta fazer parse se parecer JSON
                      if (e.target.value.trim().startsWith('{') || e.target.value.trim().startsWith('[')) {
                        try {
                          parsedValue = JSON.parse(e.target.value)
                        } catch {
                          // Se não conseguir fazer parse, mantém como string
                        }
                      }
                      handleChange(key, parsedValue)
                    }}
                    className="property-value"
                    placeholder="Valor"
                    rows={typeof value === 'object' ? 3 : 1}
                  />
                  <button
                    className="remove-property-btn"
                    onClick={() => handleRemoveProperty(key)}
                    type="button"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-save" onClick={handleSave}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}

