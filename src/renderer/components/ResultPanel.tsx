import React from "react";
import { Statistic, Card, Typography, theme } from "antd";

const { Title, Text } = Typography;

interface ResultPanelProps {
  result: number;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ result }) => {
  const {
    token: { colorPrimary },
  } = theme.useToken();

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <Card
        styles={{
          body: { padding: 32, textAlign: "center" },
        }}
      >
        <Statistic
          title={
            <Title level={3} style={{ margin: 0, color: "#666" }}>
              计算结果
            </Title>
          }
          value={result}
          precision={2}
          styles={{
            content: {
              fontSize: 48,
              color: result >= 0 ? colorPrimary : "#cf1322",
              fontWeight: "bold",
            },
          }}
          // suffix={
          //   result !== 0 && (
          //     <span style={{ fontSize: 24, color: "#aaa" }}> 元</span>
          //   )
          // }
        />
        {result === 0 && (
          <Text type="secondary" style={{ fontSize: 18 }}>
            点击「计算结果」按钮开始计算
          </Text>
        )}
      </Card>
    </div>
  );
};

export default ResultPanel;
