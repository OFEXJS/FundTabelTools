import React from "react";
import {
  Statistic,
  Card,
  Typography,
  theme,
  Button,
  message,
  Flex,
  Space,
} from "antd";
import { CopyOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface ResultPanelProps {
  result: number;
}

const ResultPanel: React.FC<ResultPanelProps> = ({ result }) => {
  const {
    token: { colorPrimary },
  } = theme.useToken();

  const handleCopy = () => {
    if (result !== 0) {
      // 格式化结果为带有两位小数的字符串
      const formattedResult = result.toFixed(2);
      // 复制到剪贴板
      navigator.clipboard
        .writeText(formattedResult)
        .then(() => {
          message.success("结果已复制到剪贴板");
        })
        .catch(() => {
          message.error("复制失败，请手动复制");
        });
    }
  };

  return (
    <div style={{ padding: "0 24px 24px" }}>
      <Card
        styles={{
          body: { padding: 32, textAlign: "center" },
        }}
      >
        <Space>
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
          {result !== 0 && <CopyOutlined onClick={handleCopy} />}
        </Space>
        <div>
          {result === 0 && (
            <Text type="secondary" style={{ fontSize: 18 }}>
              点击「计算结果」按钮开始计算
            </Text>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ResultPanel;
