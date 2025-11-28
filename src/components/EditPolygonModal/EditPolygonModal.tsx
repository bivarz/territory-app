import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { PolygonFeature } from '../../types/polygon'
import './EditPolygonModal.css'

interface EditPolygonModalProps {
  polygon: PolygonFeature | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedPolygon: PolygonFeature) => void
}

// Funções utilitárias para localStorage
const STORAGE_PREFIX = 'polygon-'
const STORAGE_SUFFIX = '-properties'

const saveToLocalStorage = (polygonId: string, properties: Record<string, any>) => {
  const key = `${STORAGE_PREFIX}${polygonId}${STORAGE_SUFFIX}`
  localStorage.setItem(key, JSON.stringify(properties))
}

const loadFromLocalStorage = (polygonId: string): Record<string, any> | null => {
  const key = `${STORAGE_PREFIX}${polygonId}${STORAGE_SUFFIX}`
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : null
}

export default function EditPolygonModal({
  polygon,
  isOpen,
  onClose,
  onSave,
}: EditPolygonModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [isAddingProperty, setIsAddingProperty] = useState(false)
  const [newPropertyKey, setNewPropertyKey] = useState('')
  const formDataRef = useRef<Record<string, any>>({})

  useEffect(() => {
    if (polygon) {
      const originalProps = { ...polygon.properties }
      const savedProps = loadFromLocalStorage(polygon.properties.id)
      
      // Mescla: dados originais + dados salvos (savedProps sobrescreve)
      const mergedProps = savedProps 
        ? { ...originalProps, ...savedProps }
        : originalProps
      
      setFormData(mergedProps)
      formDataRef.current = mergedProps
    }
  }, [polygon])

  // Sincroniza o ref sempre que formData mudar
  useEffect(() => {
    formDataRef.current = formData
  }, [formData])

  if (!isOpen || !polygon) return null

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value }
      formDataRef.current = updated
      return updated
    })
  }

  const handleSave = () => {
    // Usa o ref que está sempre sincronizado com o estado mais recente
    const currentFormData = formDataRef.current
    
    // Cria uma cópia para garantir que todas as propriedades sejam incluídas
    const updatedProperties = { ...currentFormData }
    
    // Salva no localStorage
    saveToLocalStorage(polygon.properties.id, updatedProperties)
    
    // NÃO chama onSave - não atualiza o JSON principal
    // onSave(updatedPolygon) // Comentado - salva apenas no localStorage
    
    onClose()
  }

  const handleAddProperty = () => {
    setIsAddingProperty(true)
  }

  const handleConfirmAddProperty = () => {
    if (newPropertyKey && newPropertyKey.trim()) {
      const trimmedKey = newPropertyKey.trim()
      
      // Verifica se não é uma propriedade reservada
      if (['id', 'nome', 'status'].includes(trimmedKey)) {
        alert('Esta propriedade é reservada e não pode ser adicionada!')
        return
      }
      
      // Adiciona a propriedade diretamente ao formData usando callback para garantir estado atualizado
      setFormData((prev) => {
        // Verifica se a chave já existe no estado atual
        if (prev[trimmedKey] !== undefined) {
          alert('Esta propriedade já existe!')
          return prev
        }
        
        const updated = { ...prev, [trimmedKey]: '' }
        formDataRef.current = updated
        return updated
      })
      
      setNewPropertyKey('')
      setIsAddingProperty(false)
    }
  }

  const handleCancelAddProperty = () => {
    setNewPropertyKey('')
    setIsAddingProperty(false)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleConfirmAddProperty()
    } else if (e.key === 'Escape') {
      handleCancelAddProperty()
    }
  }

  const handleRemoveProperty = (key: string) => {
    if (['id', 'nome', 'status'].includes(key)) {
      alert('Não é possível remover propriedades obrigatórias (id, nome, status)')
      return
    }
    const newData = { ...formData }
    delete newData[key]
    formDataRef.current = newData
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
              {!isAddingProperty && (
                <button
                  className="add-property-btn"
                  onClick={handleAddProperty}
                  type="button"
                >
                  + Adicionar
                </button>
              )}
            </div>

            {isAddingProperty && (
              <div className="property-row new-property-row">
                <input
                  type="text"
                  value={newPropertyKey}
                  onChange={(e) => setNewPropertyKey(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className="property-key"
                  placeholder="Nome da propriedade"
                  autoFocus
                />
                <button
                  className="confirm-add-btn"
                  onClick={handleConfirmAddProperty}
                  type="button"
                >
                  ✓
                </button>
                <button
                  className="cancel-add-btn"
                  onClick={handleCancelAddProperty}
                  type="button"
                >
                  ✕
                </button>
              </div>
            )}

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
                      formDataRef.current = newData
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

