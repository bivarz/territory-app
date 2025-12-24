# Resumo de Features - Frontend

## 📋 Visão Geral
Aplicação React com TypeScript para visualização e gerenciamento interativo de polígonos (quadras) em um mapa usando GeoJSON e Leaflet.

---

## 🔐 Autenticação e Rotas

### Sistema de Login
- **Página de Login** (`LoginPage`)
  - Validação de formulário em tempo real
  - Campos: username e password
  - Validações:
    - Username: mínimo 3 caracteres
    - Password: mínimo 4 caracteres
  - Mostrar/ocultar senha
  - Checkbox "Remember Me"
  - Feedback visual de erros
  - Estado de loading durante autenticação
  - Autenticação simples via localStorage (simula API)

### Rotas Protegidas
- **ProtectedRoute**: Componente que protege rotas autenticadas
  - Redireciona para `/login` se não autenticado
  - Verifica `isAuthenticated` no localStorage

### Rotas Disponíveis
- `/login` - Página de login
- `/mapas` - Página principal do mapa (protegida)
- `/editor` - Editor de quadras (protegida, em desenvolvimento)
- `/` - Redireciona para `/login`

---

## 🗺️ Página Principal - MapPage

### Visualização do Mapa
- **MapComponent** (Leaflet/React-Leaflet)
  - Visualização de polígonos GeoJSON
  - TileLayer do OpenStreetMap
  - Zoom automático inicial (83% do máximo)
  - Foco automático em polígonos "em_andamento" ao carregar
  - Indicador de porcentagem de zoom
  - Cores por status:
    - **Concluído**: Verde (#22c55e)
    - **Em Andamento**: Vermelho (#ef4444)
    - **Não Iniciado**: Cinza (#9ca3af)

### Interatividade com Polígonos
- **Clique em Polígono**:
  - Modo Normal: Alterna status ciclicamente (Não Iniciado → Em Andamento → Concluído → Não Iniciado)
  - Modo Edição: Abre modal de edição
- **Efeito Hover**: Destaque visual ao passar o mouse
- **Marcadores de Quadras**: Números das quadras aparecem no zoom máximo (18)
- **Destaque de Polígono**: Destaque amarelo ao focar/selecionar

### Modos de Operação
- **Modo Normal**: Clique altera status
- **Modo Edição**: Clique abre modal de edição
- **Modo GPS**: Rastreamento de localização do usuário
  - Marcador azul mostra posição atual
  - Centraliza mapa na posição do usuário
  - Rastreamento contínuo quando ativado

### Funcionalidades de Navegação
- **Foco Automático**: Centraliza e ajusta zoom em polígono específico
- **Busca de Polígonos**: Modal de busca avançada
- **Navegação entre Páginas**: Botões para Editor e Logout

---

## 🔍 Sistema de Busca

### SearchModal
- **Busca Inteligente**:
  - Busca por Quadra (prioridade máxima)
  - Busca por Rua/Endereço (prioridade alta)
  - Busca por Bairro (prioridade alta)
  - Busca por Cidade/Distrito (filtro opcional)
  
- **Filtros de Território**:
  - Todos
  - Cidade
  - Bairro
  - Distrito

- **Funcionalidades**:
  - Busca em tempo real com debounce (300ms)
  - Ordenação por relevância (score)
  - Destaque de campos encontrados
  - Seleção de resultado centraliza no mapa
  - Destaque visual do polígono selecionado (5 segundos)
  - Carrega propriedades salvas do localStorage

---

## ✏️ Editor de Polígonos

### EditPolygonModal
- **Edição de Propriedades**:
  - ID (somente leitura)
  - Nome (editável)
  - Status (dropdown: Não Iniciado, Em Andamento, Concluído)
  - Propriedades customizadas (dinâmicas)

- **Gerenciamento de Propriedades**:
  - Adicionar novas propriedades
  - Editar chaves e valores
  - Remover propriedades (exceto id, nome, status)
  - Suporte a valores JSON (objetos/arrays)
  - Validação de propriedades reservadas

- **Persistência**:
  - Salva no localStorage (não modifica JSON original)
  - Carrega propriedades salvas ao abrir modal
  - Mescla propriedades originais + salvas

---

## 📊 Sistema de Logs

### LogsTab
- **Registro de Atividades**:
  - Log de mudanças de status
  - Registro de início de trabalho
  - Registro de finalização
  - Data e hora formatadas

- **Filtros**:
  - Todas as quadras
  - Em Andamento
  - Finalizadas

- **Funcionalidades**:
  - Exclusão de logs por quadra
  - Geração de PDF com relatório completo
  - Formato de PDF: Tabela com designação de territórios
  - Cabeçalho com ano de serviço e cidade

### RecentQuadras
- **Última Quadra Trabalhada**:
  - Exibe a quadra mais recente com atividade
  - Data formatada
  - Link para focar no mapa
  - Atualização automática

---

## 🎨 Interface e UX

### Sistema de Tabs
- **Aba Mapa**: Visualização principal
- **Aba Logs**: Histórico de atividades
- Navegação fluida entre abas

### Menu Flutuante
- **ThemeToggle**: Alterna entre tema claro/escuro
  - Persistência no localStorage
  - Aplicação antes do React carregar (evita flash)
- **SearchButton**: Abre modal de busca
- **GPSButton**: Ativa/desativa rastreamento GPS
- **EditModeButton**: Alterna modo de edição

### Tema
- Suporte a tema claro e escuro
- Persistência de preferência
- Aplicação global via CSS variables

---

## 📁 Estrutura de Dados

### Tipos TypeScript
- **PolygonFeature**: Estrutura de um polígono GeoJSON
  - `id`: Identificador único
  - `nome`: Nome do polígono
  - `status`: "concluido" | "em_andamento" | "nao_iniciado"
  - `properties`: Propriedades customizadas (dinâmicas)
  - `geometry`: Coordenadas do polígono

- **GeoJSONData**: Coleção de features
- **StatusChangeLog**: Log de mudança de status
- **QuadraLog**: Log consolidado por quadra (início/finalização)

### Dados
- **dormentes-blocks.json**: GeoJSON com polígonos das quadras
- **dormentes-cards.json**: Dados adicionais (não usado diretamente no código)

---

## 🛠️ Utilitários

### dateFormatter
- `formatDate()`: Formatação completa de data/hora
- `formatDateOnly()`: Apenas data
- `formatShortDate()`: Data curta
- `getStatusLabel()`: Label do status em português

---

## 📦 Dependências Principais

### Core
- **React 18.2.0**: Framework principal
- **TypeScript 5.2.2**: Tipagem estática
- **Vite 5.0.8**: Build tool e dev server

### Mapas
- **leaflet 1.9.4**: Biblioteca de mapas
- **react-leaflet 4.2.1**: Integração React + Leaflet

### Roteamento
- **react-router-dom 7.9.6**: Navegação SPA

### UI/Icons
- **lucide-react 0.555.0**: Ícones modernos

### PDF
- **jspdf 3.0.4**: Geração de PDFs
- **jspdf-autotable 5.0.2**: Tabelas em PDF

---

## 🎯 Funcionalidades em Desenvolvimento

### EditorPage
- Página placeholder para editor de quadras
- Planejado:
  - Criar novas quadras
  - Desenhar polígonos
  - Agrupar quadras
  - Salvar alterações

---

## 💾 Persistência de Dados

### localStorage
- `isAuthenticated`: Status de autenticação
- `username`: Nome do usuário logado
- `rememberMe`: Preferência de lembrar login
- `theme`: Tema preferido (light/dark)
- `polygon-{id}-properties`: Propriedades editadas de cada polígono

---

## 🔄 Fluxo de Trabalho

1. **Login** → Autenticação via localStorage
2. **Mapa** → Visualização de quadras com status colorido
3. **Interação**:
   - Clique para alterar status (modo normal)
   - Clique para editar (modo edição)
   - Busca para localizar quadras
   - GPS para rastreamento
4. **Logs** → Registro automático de mudanças
5. **Exportação** → Geração de PDF com relatório

---

## 🎨 Características de Design

- Interface moderna e responsiva
- Feedback visual em todas as ações
- Animações suaves (zoom, transições)
- Suporte a temas claro/escuro
- Acessibilidade (ARIA labels, roles)
- Validação de formulários em tempo real

---

## 📝 Observações Técnicas

- Estado gerenciado localmente (useState)
- Refs para evitar problemas de closure
- Memoização para performance (useMemo)
- Debounce em buscas
- Cleanup de event listeners
- Tratamento de erros em geolocalização
- Suporte a múltiplos polígonos simultâneos
- Extração inteligente de números de quadras

---

## 🚀 Scripts Disponíveis

- `npm run dev`: Servidor de desenvolvimento
- `npm run build`: Build de produção
- `npm run lint`: Verificação de código
- `npm run preview`: Preview do build

