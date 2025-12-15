export interface QuadraLog {
  quadraId: string;
  quadraNome: string;
  quadraNumber: string;
  inicio?: {
    status: string;
    data: Date;
    formatted: string;
  };
  finalizado?: {
    status: string;
    data: Date;
    formatted: string;
  };
}

export interface StatusChangeLog {
  quadraId: string;
  quadraNome: string;
  quadraNumber: string;
  statusAnterior: string;
  statusNovo: string;
  data: Date;
  formatted: string;
}
