// src/renderer/components/ExcelTree.tsx —— 只显示工作表（需求1优化）
import React from "react";
import { TreeSelect } from "antd";
import type { ExcelFileData } from "../utils/xlsxParser";
import { Typography } from "antd";

const { Text } = Typography;

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
    title: (
      <Text ellipsis={true} style={{ width: 150 }} title={file.name}>
        {file.name}
      </Text>
    ),
    value: file.id,
    selectable: false, // 禁用选文件，只选 sheet
    children: file.sheets.map((sheet) => ({
      title: (
        <Text ellipsis={true} style={{ width: 130 }} title={sheet.name}>
          {sheet.name}
        </Text>
      ),
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
