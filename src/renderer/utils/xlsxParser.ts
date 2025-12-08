import * as XLSX from "xlsx";
import { message } from "antd";

export interface ExcelFileData {
  id: string;
  name: string;
  sheets: {
    name: string;
    data: any[][]; // 二维数组，data[row][col]
    json: any[]; // 对象数组（可选）
  }[];
}

// 渲染进程直接解析（支持拖拽 + 选择文件）
export const parseExcelWithXLSX = (file: File): Promise<ExcelFileData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, {
          type: "array",
          cellText: true,
          cellDates: true,
        });

        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const sheets = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];

          // 转为二维数组（最快方式）
          const data = XLSX.utils.sheet_to_json<any>(worksheet, {
            header: 1, // 以数组形式返回
            defval: null, // 空值用 null
          }) as any[][];

          // 同时生成 json 对象数组（首行作为表头）
          const json = XLSX.utils.sheet_to_json(worksheet, {
            defval: null,
          });

          return { name: sheetName, data, json };
        });

        resolve({
          id: fileId,
          name: file.name,
          sheets,
        });
      } catch (err: any) {
        message.error(`解析失败：${file.name} - ${err.message}`);
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error("文件读取失败"));
    reader.readAsArrayBuffer(file);
  });
};

// 数值提取工具（支持单元格、整行、整列）
export const evaluateCellRefs = (
  refs: CellRef[],
  filesData: Map<string, ExcelFileData>
): number => {
  let total = 0;

  refs.forEach((ref) => {
    const fileData = filesData.get(ref.fileId);
    if (!fileData) return;

    const sheet = fileData.sheets.find((s) => s.name === ref.sheetName);
    if (!sheet || !sheet.data.length) return;

    const data = sheet.data;

    if (ref.type === "cell" && ref.ref.match(/^[A-Z]+\d+$/i)) {
      const { row, col } = XLSX.utils.decode_cell(ref.ref.toUpperCase());
      const value = data[row]?.[col];
      total += parseNumber(value);
    } else if (ref.type === "row" && /^\d+$/.test(ref.ref)) {
      const rowIdx = parseInt(ref.ref) - 1;
      if (data[rowIdx]) {
        data[rowIdx].forEach((v) => (total += parseNumber(v)));
      }
    } else if (ref.type === "column" && ref.ref.match(/^[A-Z]+$/i)) {
      const colIdx = XLSX.utils.decode_col(ref.ref.toUpperCase());
      data.forEach((row) => {
        total += parseNumber(row[colIdx]);
      });
    }
  });

  return total;
};

// 安全提取数字
const parseNumber = (val: any): number => {
  if (typeof val === "number") return val;
  if (val === null || val === undefined || val === "") return 0;
  const num = parseFloat(String(val).replace(/[^0-9.-]/g, ""));
  return isNaN(num) ? 0 : num;
};

export interface CellRef {
  type: "cell" | "row" | "column";
  sheetName: string;
  fileId: string;
  fileName: string;
  ref: string; // A1 或 5 或 B
}
