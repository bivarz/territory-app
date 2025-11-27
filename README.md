# Mapa de Polígonos Interativo

Aplicação React com TypeScript para visualização e interação com polígonos em um mapa usando GeoJSON.

## Funcionalidades

- Visualização de polígonos em um mapa interativo
- Clique nos polígonos para alterar o status
- Cores baseadas no status:
  - **Concluído**: Verde (fill e stroke)
  - **Em Andamento**: Vermelho (fill e stroke)
  - **Não Iniciado**: Cinza (fill e stroke)
- Efeito hover nos polígonos

## Instalação

```bash
npm install
```

## Executar

```bash
npm run dev
```

## Estrutura

- `src/data/dormentes-blocks.json`: Arquivo GeoJSON com os polígonos
- `src/components/MapComponent.tsx`: Componente do mapa com Leaflet
- `src/App.tsx`: Componente principal com lógica de estado

## Como usar

1. Clique em qualquer polígono no mapa
2. O status do polígono será alterado ciclicamente: Não Iniciado → Em Andamento → Concluído → Não Iniciado
3. As cores são atualizadas automaticamente conforme o status



