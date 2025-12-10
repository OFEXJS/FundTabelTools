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

export interface CellRef {
  type: "cell" | "row" | "column" | "custom";
  sheetName: string;
  fileId: string;
  fileName: string;
  ref: string;
  startRow?: number;
  endRow?: number;
  value?: number;
  logic?: "AND" | "OR"; // 与上一个规则的逻辑关系
}

interface ExcludeRule {
  fileId: string;
  sheetName: string;
  excludeColumn: string;
  excludeKeyword: string;
  excludeMode: "exclude" | "include";
  conditionLogic?: "AND" | "OR"; // 与下一个条件的逻辑关系
  filterType?: "keyword" | "columnValue"; // 筛选类型
  selectedValues?: string[]; // 选中的列值
}

interface RuleWithIndex extends ExcludeRule {
  ruleIndex?: number;
  conditionIndex?: number; // 在同一规则中的条件序号
}

export const evaluateCellRefs = (
  refs: CellRef[],
  filesData: Map<string, ExcelFileData>,
  excludes: ExcludeRule[] = []
): number => {
  let total = 0;

  // 为每个工作表维护原始数据和 AND 链处理结果
  const originalSheets = new Map<string, any[][]>();
  const andChainSheets = new Map<string, any[][]>();
  
  // 初始化：为每个使用到的工作表创建数据副本
  refs.forEach((ref) => {
    if (ref.type === "custom") return;
    
    const fileData = filesData.get(ref.fileId);
    if (!fileData) return;
    
    const sheet = fileData.sheets.find((s) => s.name === ref.sheetName);
    if (!sheet || !sheet.data.length) return;
    
    const sheetKey = `${ref.fileId}|${ref.sheetName}`;
    if (!originalSheets.has(sheetKey)) {
      originalSheets.set(sheetKey, [...sheet.data]);
      andChainSheets.set(sheetKey, [...sheet.data]);
    }
  });

  // 逐层处理每个规则
  refs.forEach((ref, index) => {
    // 自定义值直接累加
    if (ref.type === "custom") {
      total += ref.value || 0;
      return;
    }

    const fileData = filesData.get(ref.fileId);
    if (!fileData) return;

    const sheet = fileData.sheets.find((s) => s.name === ref.sheetName);
    if (!sheet || !sheet.data.length) return;

    const sheetKey = `${ref.fileId}|${ref.sheetName}`;
    const logic = ref.logic || "AND"; // 默认 AND
    
    // 获取当前规则的排除条件
    const currentRuleExcludes = (excludes as RuleWithIndex[]).filter(
      (e) => e.fileId === ref.fileId && 
             e.sheetName === ref.sheetName &&
             e.ruleIndex === index
    );
    
    let currentData: any[][];
    let ruleResult = 0;
    
    // 确保工作表数据已初始化（处理动态添加的表）
    if (!originalSheets.has(sheetKey)) {
      originalSheets.set(sheetKey, [...sheet.data]);
      andChainSheets.set(sheetKey, [...sheet.data]);
    }
    
    // 根据逻辑关系选择数据源和处理方式
    if (index === 0 || logic === "OR") {
      // 第一个规则或 OR 规则：从原始数据开始计算，结果累加到 total
      currentData = [...originalSheets.get(sheetKey)!];
      
      // 对于列求和类型：先筛选再计算
      // 对于单元格/行类型：直接从原始数据计算（不受筛选影响）
      if (ref.type === "column" && currentRuleExcludes.length > 0) {
        currentData = filterRowsByExcludesWithLogic(currentData, currentRuleExcludes);
      }
      
      // 计算当前规则的结果并累加
      ruleResult = calculateFromData(currentData, ref);
      total += ruleResult;
      
      // OR 规则：重置 AND 链为当前处理后的数据（为后续可能的 AND 规则准备）
      if (logic === "OR") {
        // 如果是列求和且有筛选，保存筛选后的数据；否则保存原始数据
        const dataToSave = (ref.type === "column" && currentRuleExcludes.length > 0) 
          ? currentData 
          : [...originalSheets.get(sheetKey)!];
        andChainSheets.set(sheetKey, dataToSave);
      }
    } else {
      // AND 规则：从上一个 AND 链的结果继续处理
      currentData = [...andChainSheets.get(sheetKey)!];
      
      // 对于列求和类型：应用筛选条件（逐层累积）
      // 对于单元格/行类型：直接从当前数据计算
      if (ref.type === "column" && currentRuleExcludes.length > 0) {
        currentData = filterRowsByExcludesWithLogic(currentData, currentRuleExcludes);
      }
      
      // 更新 AND 链的结果
      if (ref.type === "column" && currentRuleExcludes.length > 0) {
        andChainSheets.set(sheetKey, currentData);
      }
      
      // 计算当前规则的结果并累加
      ruleResult = calculateFromData(currentData, ref);
      total += ruleResult;
    }
  });

  return total;
};

// 新增：从数据中计算结果的辅助函数
const calculateFromData = (data: any[][], ref: CellRef): number => {
  let result = 0;
  
  if (ref.type === "cell" && ref.ref.match(/^[A-Z]+\d+$/i)) {
    // 注意：XLSX.utils.decode_cell 返回的是 {r: row, c: col}，不是 {row, col}
    const decoded = XLSX.utils.decode_cell(ref.ref.toUpperCase());
    const rowIdx = decoded.r;
    const colIdx = decoded.c;
    const cellValue = data[rowIdx]?.[colIdx];
    console.log(`[单元格] ${ref.ref} -> row:${rowIdx}, col:${colIdx}, 原始值:`, cellValue, '数据行数:', data.length);
    result = parseNumber(cellValue);
    console.log(`[单元格] ${ref.ref} 解析后结果:`, result);
  } else if (ref.type === "row" && /^\d+$/.test(ref.ref)) {
    const rowIdx = parseInt(ref.ref) - 1;
    console.log(`[行求和] 行${ref.ref} -> 索引:${rowIdx}, 数据:`, data[rowIdx]);
    data[rowIdx]?.forEach((v) => (result += parseNumber(v)));
    console.log(`[行求和] 行${ref.ref} 结果:`, result);
  } else if (ref.type === "column" && ref.ref.match(/^[A-Z]+$/i)) {
    const colIdx = XLSX.utils.decode_col(ref.ref.toUpperCase());
    const start = (ref.startRow ?? 1) - 1;
    let end = ref.endRow ? ref.endRow - 1 : findLastNonEmptyRow(data, colIdx);

    console.log(`[列求和] 列${ref.ref} -> 列索引:${colIdx}, 范围:${start}-${end}, 数据行数:${data.length}`);
    // 列求和：遍历筛选后数据的指定列范围
    for (let r = start; r <= end; r++) {
      result += parseNumber(data[r]?.[colIdx]);
    }
    console.log(`[列求和] 列${ref.ref} 结果:`, result);
  }
  
  return result;
};

// 排除/筛选行（支持 AND/OR 逻辑组合）
const filterRowsByExcludesWithLogic = (
  data: any[][],
  excludes: RuleWithIndex[]
): any[][] => {
  if (excludes.length === 0) return data;

  // 按规则索引分组，每个规则的条件在组内按 AND/OR 处理
  const groupedByRule = new Map<number, RuleWithIndex[]>();
  excludes.forEach((ex) => {
    const ruleIdx = ex.ruleIndex ?? 0;
    if (!groupedByRule.has(ruleIdx)) {
      groupedByRule.set(ruleIdx, []);
    }
    groupedByRule.get(ruleIdx)!.push(ex);
  });

  // 逐规则累积过滤
  let filtered = [...data];
  const sortedRuleIndices = Array.from(groupedByRule.keys()).sort((a, b) => a - b);

  sortedRuleIndices.forEach((ruleIdx) => {
    const conditions = groupedByRule.get(ruleIdx)!;
    filtered = applyConditionsToRows(filtered, conditions);
  });

  return filtered;
};

// 对一组条件应用 AND/OR 逻辑
const applyConditionsToRows = (
  data: any[][],
  conditions: RuleWithIndex[]
): any[][] => {
  if (conditions.length === 0) return data;

  return data.filter((row) => {
    // 计算每个条件的结果
    const results = conditions.map((cond) => {
      const colIdx = XLSX.utils.decode_col(cond.excludeColumn.toUpperCase());
      const cellVal = row[colIdx];
      const cellStr = cellVal == null || cellVal === "" ? "(空)" : String(cellVal);
      
      let matches = false;
      
      // 根据筛选类型判断是否匹配
      if (cond.filterType === "columnValue" && cond.selectedValues && cond.selectedValues.length > 0) {
        // 列值筛选：检查单元格值是否在选中的值列表中
        matches = cond.selectedValues.includes(cellStr);
      } else {
        // 关键字筛选（默认行为）
        const keyword = cond.excludeKeyword.toLowerCase();
        matches = cellStr.toLowerCase().includes(keyword);
      }
      
      // exclude 模式：匹配则排除（返回 false），不匹配则保留（返回 true）
      // include 模式：匹配则保留（返回 true），不匹配则排除（返回 false）
      return cond.excludeMode === "include" ? matches : !matches;
    });

    // 根据逻辑关系计算最终结果
    let finalResult = results[0];
    for (let i = 1; i < results.length; i++) {
      const logic = conditions[i - 1].conditionLogic || "AND";
      if (logic === "AND") {
        finalResult = finalResult && results[i];
      } else {
        finalResult = finalResult || results[i];
      }
    }

    return finalResult;
  });
};

// 找列最后非空行
const findLastNonEmptyRow = (data: any[][], colIdx: number): number => {
  for (let r = data.length - 1; r >= 0; r--) {
    if (data[r]?.[colIdx] != null && data[r][colIdx] !== "") return r;
  }
  return data.length - 1; // 如果全空，默认到最后
};

const parseNumber = (val: any): number => {
  if (typeof val === "number") return val;
  const num = parseFloat(String(val || "0").replace(/[^0-9.-]/g, ""));
  return isNaN(num) ? 0 : num;
};
