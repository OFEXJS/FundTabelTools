import React, { useState } from "react";
import { Button, Select, Input, Space, Card, Tag, message } from "antd";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import ExcelTree from "./ExcelTree";
import { evaluateCellRefs, CellRef } from "../utils/xlsxParser";
import type { ExcelFileData } from "../utils/xlsxParser";

const { Option } = Select;

interface RuleItem {
  key: string;
  logic: "AND" | "OR";
  fileId: string;
  sheetName: string;
  type: "cell" | "row" | "column";
  ref: string; // A1 或 row:5 或 col:B
}

interface RuleBuilderProps {
  filesData: Map<string, ExcelFileData>;
  currentFileId: string; // 新增：当前激活的文件
  onCalculate: (result: number) => void;
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({
  filesData,
  onCalculate,
  currentFileId,
}) => {
  const [rules, setRules] = useState<RuleItem[]>([]);

  const addRule = () => {
    setRules([
      ...rules,
      {
        key: Date.now().toString(),
        logic: rules.length === 0 ? "AND" : "AND",
        fileId: "",
        sheetName: "",
        type: "cell",
        ref: "",
      },
    ]);
  };

  const removeRule = (key: string) => {
    setRules(rules.filter((r) => r.key !== key));
  };

  const updateRule = (key: string, field: keyof RuleItem, value: any) => {
    setRules(rules.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const parseTreeValue = (
    val: string
  ): { fileId: string; sheetName: string } => {
    const [fileId, sheetName] = val.split("|");
    return { fileId, sheetName };
  };

  const handleTreeChange = (key: string, value: string) => {
    const { fileId, sheetName } = parseTreeValue(value);
    setRules(
      rules.map((r) => {
        if (r.key === key) {
          return { ...r, fileId, sheetName };
        }
        return r;
      })
    );
  };

  const calculate = () => {
    if (rules.length === 0) {
      message.warning("请至少添加一条规则");
      return;
    }

    const validRefs: CellRef[] = [];

    for (const rule of rules) {
      if (!rule.fileId || !rule.sheetName || !rule.ref) continue;

      const file = filesData.get(rule.fileId);
      if (!file) continue;

      validRefs.push({
        type: rule.type,
        sheetName: rule.sheetName,
        fileId: rule.fileId,
        fileName: file.name,
        ref:
          rule.type === "cell"
            ? rule.ref.toUpperCase()
            : rule.type === "row"
              ? `row:${rule.ref}`
              : `col:${rule.ref.toUpperCase()}`,
      });
    }

    if (validRefs.length === 0) {
      message.warning("没有有效的引用");
      return;
    }

    const total = evaluateCellRefs(validRefs, filesData);
    onCalculate(total);
    message.success("计算完成！");
  };

  return (
    <Space
      orientation="vertical"
      size="large"
      style={{ width: "100%", padding: 12 }}
    >
      {rules.map((rule, index) => (
        <Card key={rule.key} size="small">
          <Space align="center" size="middle" style={{ width: "100%" }}>
            {index > 0 && (
              <Select
                value={rule.logic}
                onChange={(v) => updateRule(rule.key, "logic", v)}
                style={{ width: 80 }}
              >
                <Option value="AND">AND</Option>
                <Option value="OR">OR</Option>
              </Select>
            )}
            {index === 0 && <span style={{ width: 80 }} />}

            <ExcelTree
              filesData={filesData}
              value={
                currentFileId
                  ? `${currentFileId}|${rule.sheetName || ""}`
                  : undefined
              }
              onChange={(v) => handleTreeChange(rule.key, v as string)}
              placeholder="选择文件和工作表"
            />

            <Select
              value={rule.type}
              onChange={(v) => updateRule(rule.key, "type", v)}
              style={{ width: 120 }}
            >
              <Option value="cell">单元格</Option>
              <Option value="row">整行</Option>
              <Option value="column">整列</Option>
            </Select>

            <Input
              placeholder={
                rule.type === "cell"
                  ? "如 A1 或 B10"
                  : rule.type === "row"
                    ? "输入行号，如 5"
                    : "输入列字母，如 B"
              }
              value={rule.ref}
              onChange={(e) => updateRule(rule.key, "ref", e.target.value)}
              style={{ width: 140 }}
            />

            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => removeRule(rule.key)}
            />
          </Space>
        </Card>
      ))}

      <div>
        <Button type="dashed" onClick={addRule} block icon={<PlusOutlined />}>
          添加规则
        </Button>
      </div>

      <Button type="primary" size="large" block onClick={calculate}>
        开始计算
      </Button>
    </Space>
  );
};

export default RuleBuilder;
