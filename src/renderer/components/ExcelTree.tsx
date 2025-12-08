// src/renderer/components/ExcelTree.tsx —— 只显示工作表（需求1优化）
import React from "react";
import { TreeSelect } from "antd";
import type { ExcelFileData } from "../utils/xlsxParser";

interface ExcelTreeProps {
  filesData: Map<string, ExcelFileData>;
  value?: any;
  onChange?: (value: any) => void;
  placeholder?: string;
}

const ExcelTree: React.FC<ExcelTreeProps> = ({
  filesData,
  value,
  onChange,
  placeholder,
}) => {
  const treeData = Array.from(filesData.values()).map((file) => ({
    title: file.name,
    value: file.id,
    selectable: false, // 禁用选文件，只选 sheet
    children: file.sheets.map((sheet) => ({
      title: sheet.name,
      value: `${file.id}|${sheet.name}`,
    })),
  }));

  return (
    <TreeSelect
      style={{ width: 200 }}
      treeData={treeData}
      placeholder={placeholder || "选择工作表"}
      treeDefaultExpandAll
      value={value}
      onChange={onChange}
    />
  );
};

export default ExcelTree;
