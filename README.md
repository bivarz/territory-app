# Mapa de Quadras - Polígonos Interativo

Aplicação React com TypeScript para visualização e interação com polígonos em um mapa usando GeoJSON.

## Estrutura do Projeto

O projeto está organizado em três pastas principais:

- **frontend/**: Aplicação React com TypeScript
- **backend/**: API e serviços do backend
- **database/**: Scripts e configurações do banco de dados

## Funcionalidades

- Visualização de polígonos em um mapa interativo
- Clique nos polígonos para alterar o status
- Cores baseadas no status:
  - **Concluído**: Verde (fill e stroke)
  - **Em Andamento**: Vermelho (fill e stroke)
  - **Não Iniciado**: Cinza (fill e stroke)
- Efeito hover nos polígonos

## Instalação

### Frontend

```bash
cd frontend
npm install
```

## Executar

### Frontend

```bash
cd frontend
npm run dev
```

## Estrutura do Frontend

- `src/data/dormentes-blocks.json`: Arquivo GeoJSON com os polígonos
- `src/components/MapComponent.tsx`: Componente do mapa com Leaflet
- `src/App.tsx`: Componente principal com lógica de estado

## Como usar

1. Clique em qualquer polígono no mapa
2. O status do polígono será alterado ciclicamente: Não Iniciado → Em Andamento → Concluído → Não Iniciado
3. As cores são atualizadas automaticamente conforme o status

