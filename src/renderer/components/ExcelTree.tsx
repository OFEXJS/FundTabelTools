import React from "react";
import { TreeSelect } from "antd";
import type { ExcelFileData } from "../utils/excelParser";

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
    children: file.sheets.map((sheet) => ({
      title: sheet.name,
      value: `${file.id}|${sheet.name}`,
      children: [
        {
          title: "整行选择（如 row:5）",
          value: `${file.id}|${sheet.name}|row`,
          disabled: true,
        },
        {
          title: "整列选择（如 col:B）",
          value: `${file.id}|${sheet.name}|col`,
          disabled: true,
        },
        {
          title: "单元格（如 A1）",
          value: `${file.id}|${sheet.name}|cell`,
          disabled: true,
        },
      ],
    })),
  }));

  return (
    <TreeSelect
      style={{ width: "100%" }}
      treeData={treeData}
      placeholder={placeholder || "请选择文件 → 工作表"}
      treeDefaultExpandAll
      value={value}
      onChange={onChange}
    />
  );
};

export default ExcelTree;
