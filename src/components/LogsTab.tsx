import { useState, useMemo } from "react";
import { FileText, Trash2 } from "lucide-react";
import { QuadraLog, StatusChangeLog } from "../types/logs";
import { getStatusLabel, formatDateOnly } from "../utils/dateFormatter";
import { jsPDF } from "jspdf";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - jspdf-autotable não tem tipos TypeScript completos
import autoTable from "jspdf-autotable";
import "./LogsTab.css";

interface LogsTabProps {
  logs: StatusChangeLog[];
  quadraLogs: Map<string, QuadraLog>;
  onDeleteLog: (quadraId: string) => void;
  cityName?: string;
}

export default function LogsTab({
  quadraLogs,
  onDeleteLog,
  cityName = "Dormentes",
}: LogsTabProps) {
  const [filter, setFilter] = useState<"all" | "completed" | "in_progress">(
    "all"
  );

  const filteredLogs = useMemo(() => {
    if (filter === "all") return Array.from(quadraLogs.values());

    return Array.from(quadraLogs.values()).filter((log) => {
      if (filter === "completed") {
        return log.finalizado !== undefined;
      }
      if (filter === "in_progress") {
        return log.inicio !== undefined && log.finalizado === undefined;
      }
      return true;
    });
  }, [quadraLogs, filter]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const currentYear = new Date().getFullYear();

    // Título
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("REGISTRO DE DESIGNAÇÃO DE TERRITÓRIO", 105, 20, {
      align: "center",
    });

    // Ano de Serviço e Cidade
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const anoText = `Ano de Serviço: ${currentYear}`;
    const cidadeText = cityName || "Dormentes";
    const anoWidth = doc.getTextWidth(anoText);
    const cidadeWidth = doc.getTextWidth(cidadeText);
    const totalWidth = anoWidth + cidadeWidth + 10; // 10px de espaço
    const startX = (210 - totalWidth) / 2; // 210mm é a largura de uma página A4

    doc.text(anoText, startX, 30);
    doc.text(cidadeText, startX + anoWidth + 10, 30);

    // Preparar dados da tabela - cada território terá múltiplas linhas
    // Estrutura: cada grupo tem uma linha com nome (colSpan: 2) e uma linha com datas
    type TableCell =
      | string
      | {
          content: string;
          rowSpan?: number;
          colSpan?: number;
          styles?: Record<string, unknown>;
        };
    const tableData: Array<Array<TableCell>> = [];

    filteredLogs.forEach((log) => {
      const quadraNum = log.quadraNumber;
      const ultimaDataConcluida = log.finalizado
        ? formatDateOnly(log.finalizado.data)
        : "";

      const dataDesignacao1 = log.inicio ? formatDateOnly(log.inicio.data) : "";
      const dataConclusao1 = log.finalizado
        ? formatDateOnly(log.finalizado.data)
        : "";

      // Primeira linha: nome do usuário (colSpan: 2 para cada grupo)
      tableData.push([
        { content: quadraNum, rowSpan: 2, styles: { valign: "middle" } },
        {
          content: ultimaDataConcluida,
          rowSpan: 2,
          styles: { valign: "middle" },
        },
        { content: "", colSpan: 2 }, // Designado para 1 (nome - vazio por enquanto)
        { content: "", colSpan: 2 }, // Designado para 2 (nome - vazio por enquanto)
        { content: "", colSpan: 2 }, // Designado para 3 (nome - vazio por enquanto)
        { content: "", colSpan: 2 }, // Designado para 4 (nome - vazio por enquanto)
      ]);

      // Segunda linha: datas
      tableData.push([
        dataDesignacao1, // Data da designação 1
        dataConclusao1, // Data da conclusão 1
        "", // Data da designação 2
        "", // Data da conclusão 2
        "", // Data da designação 3
        "", // Data da conclusão 3
        "", // Data da designação 4
        "", // Data da conclusão 4
      ]);

      // Adiciona 2 grupos de linhas vazias adicionais para cada território (para preenchimento futuro)
      // Terceiro grupo
      tableData.push([
        { content: "", rowSpan: 2, styles: { valign: "middle" } },
        { content: "", rowSpan: 2, styles: { valign: "middle" } },
        { content: "", colSpan: 2 }, // Designado para 1
        { content: "", colSpan: 2 }, // Designado para 2
        { content: "", colSpan: 2 }, // Designado para 3
        { content: "", colSpan: 2 }, // Designado para 4
      ]);
      tableData.push([
        "", // Data da designação 1
        "", // Data da conclusão 1
        "", // Data da designação 2
        "", // Data da conclusão 2
        "", // Data da designação 3
        "", // Data da conclusão 3
        "", // Data da designação 4
        "", // Data da conclusão 4
      ]);

      // Quarto grupo
      tableData.push([
        { content: "", rowSpan: 2, styles: { valign: "middle" } },
        { content: "", rowSpan: 2, styles: { valign: "middle" } },
        { content: "", colSpan: 2 }, // Designado para 1
        { content: "", colSpan: 2 }, // Designado para 2
        { content: "", colSpan: 2 }, // Designado para 3
        { content: "", colSpan: 2 }, // Designado para 4
      ]);
      tableData.push([
        "", // Data da designação 1
        "", // Data da conclusão 1
        "", // Data da designação 2
        "", // Data da conclusão 2
        "", // Data da designação 3
        "", // Data da conclusão 3
        "", // Data da designação 4
        "", // Data da conclusão 4
      ]);
    });

    // Criar tabela usando autoTable - formato exato do modelo com cabeçalho de 2 linhas
    autoTable(doc, {
      startY: 38,
      head: [
        [
          { content: "Terr. n.º", rowSpan: 2, styles: { valign: "middle" } },
          {
            content: "Última data concluída*",
            rowSpan: 2,
            styles: { valign: "middle" },
          },
          {
            content: "Designado para",
            colSpan: 2,
            styles: { halign: "center" },
          },
          {
            content: "Designado para",
            colSpan: 2,
            styles: { halign: "center" },
          },
          {
            content: "Designado para",
            colSpan: 2,
            styles: { halign: "center" },
          },
          {
            content: "Designado para",
            colSpan: 2,
            styles: { halign: "center" },
          },
        ],
        [
          // "Designado para",
          "Data da designação",
          "Data da conclusão",
          // "Designado para",
          "Data da designação",
          "Data da conclusão",
          // "Designado para",
          "Data da designação",
          "Data da conclusão",
          // "Designado para",
          "Data da designação",
          "Data da conclusão",
        ],
      ],
      body:
        tableData.length > 0
          ? tableData
          : [
              [
                { content: "", rowSpan: 2 },
                { content: "", rowSpan: 2 },
                { content: "", colSpan: 2 },
                { content: "", colSpan: 2 },
                { content: "", colSpan: 2 },
                { content: "", colSpan: 2 },
              ],
              ["", "", "", "", "", "", "", ""],
            ],
      theme: "grid",
      headStyles: {
        fillColor: [240, 240, 240],
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
        halign: "center",
        valign: "middle",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 8,
        halign: "center",
        valign: "middle",
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
        textColor: [0, 0, 0],
      },
      columnStyles: {
        0: { cellWidth: 15 }, // Terr. n.º
        1: { cellWidth: 20 }, // Última data concluída*
        2: { cellWidth: 18 }, // Data da designação 1
        3: { cellWidth: 18 }, // Data da conclusão 1
        4: { cellWidth: 18 }, // Data da designação 2
        5: { cellWidth: 18 }, // Data da conclusão 2
        6: { cellWidth: 18 }, // Data da designação 3
        7: { cellWidth: 18 }, // Data da conclusão 3
        8: { cellWidth: 18 }, // Data da designação 4
        9: { cellWidth: 18 }, // Data da conclusão 4
      },
      styles: {
        lineColor: [0, 0, 0],
        lineWidth: 0.5,
      },
      margin: { top: 38, left: 10, right: 10 },
      tableWidth: "auto",
      showHead: "everyPage",
    });

    // Salva o PDF
    doc.save(
      `registro-designacao-territorio-${currentYear}-${
        new Date().toISOString().split("T")[0]
      }.pdf`
    );
  };

  return (
    <div className="logs-tab">
      <div className="logs-header">
        <h2>Logs de Trabalho das Quadras</h2>
        <div className="logs-controls">
          <select
            value={filter}
            onChange={(e) =>
              setFilter(e.target.value as "all" | "completed" | "in_progress")
            }
            className="logs-filter"
          >
            <option value="all">Todas</option>
            <option value="in_progress">Em Andamento</option>
            <option value="completed">Finalizadas</option>
          </select>
          <button onClick={generatePDF} className="generate-pdf-button">
            <FileText size={16} />
            <span>PDF</span>
          </button>
        </div>
      </div>

      <div className="logs-content">
        {filteredLogs.length === 0 ? (
          <div className="no-logs">
            <FileText size={48} />
            <p>Nenhum log encontrado</p>
          </div>
        ) : (
          <div className="logs-list">
            {filteredLogs.map((log) => (
              <div key={log.quadraId} className="log-item">
                <div className="log-header">
                  <div className="log-header-left">
                    <h3>Quadra {log.quadraNumber}</h3>
                    <span className="log-nome">{log.quadraNome}</span>
                  </div>
                  <button
                    className="delete-log-button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Deseja realmente excluir o log da Quadra ${log.quadraNumber}?`
                        )
                      ) {
                        onDeleteLog(log.quadraId);
                      }
                    }}
                    title="Excluir log"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="log-details">
                  {log.inicio && (
                    <div className="log-entry">
                      <strong>Início:</strong> {log.inicio.formatted}
                    </div>
                  )}
                  {log.finalizado ? (
                    <div className="log-entry">
                      <strong>Finalizado:</strong> {log.finalizado.formatted}
                      <span className="log-status log-status-completed">
                        {getStatusLabel(log.finalizado.status)}
                      </span>
                    </div>
                  ) : log.inicio ? (
                    <div className="log-entry in-progress">
                      <strong>Status:</strong> Em Andamento
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
