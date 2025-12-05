import ExcelJS from "exceljs";
import path from "node:path";

export interface CellRef {
  type: "cell" | "row" | "column";
  sheetName: string;
  fileId: string;
  fileName: string;
  ref: string; // 如 A1, 或 row:5, 或 col:B
}

export interface ExcelFileData {
  id: string;
  name: string;
  sheets: {
    name: string;
    data: any[][];
    json: any;
  }[];
}

let fileCounter = 0;

export const parseExcelToJson = async (
  filePath: string
): Promise<ExcelFileData> => {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  const fileId = `file_${++fileCounter}`;
  const fileName = path.basename(filePath);

  const sheets = workbook.worksheets.map((sheet) => {
    const data: any[][] = [];
    const json: any[] = [];

    sheet.eachRow((row, rowNumber) => {
      const rowValues: any[] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rowValues.push(cell.value);
      });
      data.push(rowValues);

      // 首行作为表头，生成对象数组
      if (rowNumber === 1) {
        const headers = rowValues.map((h) => String(h ?? ""));
        sheet.eachRow({ includeEmpty: true }, (r, rn) => {
          if (rn > 1) {
            const obj: any = {};
            r.eachCell({ includeEmpty: true }, (c, cn) => {
              obj[headers[cn - 1] || `col${cn}`] = c.value;
            });
            json.push(obj);
          }
        });
      }
    });

    return { name: sheet.name, data, json };
  });

  return { id: fileId, name: fileName, sheets };
};

export const evaluateCellRefs = (
  refs: CellRef[],
  filesData: Map<string, ExcelFileData>
): number => {
  let total = 0;

  refs.forEach((ref) => {
    const fileData = filesData.get(ref.fileId);
    if (!fileData) return;

    const sheet = fileData.sheets.find((s) => s.name === ref.sheetName);
    if (!sheet) return;

    if (ref.type === "cell" && ref.ref.match(/^[A-Z]+\d+$/)) {
      const col = ref.ref.replace(/\d+/g, "");
      const row = parseInt(ref.ref.replace(/[A-Z]+/g, ""));
      const cellValue =
        sheet.data[row - 1]?.[ExcelJS.utils.columnToIndex(col) - 1];
      const num =
        typeof cellValue === "number"
          ? cellValue
          : parseFloat(String(cellValue || "0"));
      if (!isNaN(num)) total += num;
    } else if (ref.type === "row" && ref.ref.startsWith("row:")) {
      const rowNum = parseInt(ref.ref.split(":")[1]);
      const row = sheet.data[rowNum - 1] || [];
      row.forEach((cell) => {
        const num =
          typeof cell === "number"
            ? cell
            : parseFloat(String(cell || "0").replace(/[^0-9.-]/g, ""));
        if (!isNaN(num)) total += num;
      });
    } else if (ref.type === "column" && ref.ref.startsWith("col:")) {
      const colLetter = ref.ref.split(":")[1];
      const colIndex = ExcelJS.utils.columnToIndex(colLetter) - 1;
      sheet.data.forEach((row) => {
        const cell = row[colIndex];
        const num =
          typeof cell === "number"
            ? cell
            : parseFloat(String(cell || "0").replace(/[^0-9.-]/g, ""));
        if (!isNaN(num)) total += num;
      });
    }
  });

  return total;
};
