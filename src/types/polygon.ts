export type PolygonStatus = "concluido" | "em_andamento" | "nao_iniciado";

export interface PolygonFeature {
  type: "Feature";
  properties: {
    id: string;
    nome: string;
    status: PolygonStatus;
    [key: string]: any;
  };
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface GeoJSONData {
  type: "FeatureCollection";
  features: PolygonFeature[];
}

