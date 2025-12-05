import React from "react";
import { Statistic, Card } from "antd";

interface ResultPanelProps {
  value: number;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ value }) => (
  <Card>
    <Statistic
      title="最终计算结果"
      value={value}
      precision={2}
      valueStyle={{ color: "#3f8600", fontSize: 36 }}
    />
  </Card>
);

export default ResultPanel;
