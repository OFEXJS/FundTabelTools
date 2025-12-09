// src/renderer/components/HistoryPanel.tsx —— 美观清晰时间轴版
import React, { useState, useEffect } from "react";
import {
  Card,
  Timeline,
  Button,
  Empty,
  Popconfirm,
  Typography,
  Space,
  Flex,
} from "antd";
import { ClockCircleOutlined, ClearOutlined } from "@ant-design/icons";
import { clearHistory } from "../utils/history";
import { useHistory } from "../contexts/HistoryContext";

const { Text, Title } = Typography;

const HistoryPanel: React.FC = () => {
  const { history, refreshHistory } = useHistory();

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0 }}>
          <ClockCircleOutlined style={{ marginRight: 8 }} />
          历史记录 ({history.length})
        </Title>
      }
      extra={
        history.length > 0 && (
          <Popconfirm
            placement="bottomRight"
            title="确认清空所有记录？"
            description="此操作不可恢复"
            onConfirm={async () => {
              await clearHistory();
              // 由于clearHistory中已经触发了事件，这里不需要手动刷新
              // 但为了确保立即响应，仍调用refreshHistory
              await refreshHistory();
            }}
            okText="清空"
            cancelText="取消"
            okButtonProps={{ danger: true }}
          >
            <Button danger icon={<ClearOutlined />} size="small">
              清空
            </Button>
          </Popconfirm>
        )
      }
      styles={{
        body: {
          maxHeight: "calc(100vh - 150px)",
          overflow: "auto",
          padding: 16,
        },
      }}
      variant="outlined"
      style={{
        background: "#f9f9f9",
        borderRadius: 8,
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      }}
    >
      {history.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<Text type="secondary">暂无计算记录</Text>}
          style={{ marginTop: 80 }}
        />
      ) : (
        <Timeline style={{ marginTop: 16 }}>
          {history?.map((item, i) => {
            const value = `${item.sheetName}：${item.result}`
            return (
              <Timeline.Item key={i} color="green">
                <div
                  style={{
                    background: "white",
                    padding: "12px 16px",
                    borderRadius: 8,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <Text style={{ color: "#888", fontSize: 12 }}>{item.time}</Text>
                  <br />
                  <Flex>
                    <Text strong ellipsis={{ tooltip: item.fileName }} style={{ flex: 2 }}>
                      {item.fileName}
                    </Text>
                    <Text strong ellipsis={{ tooltip: value }} style={{ flex: 1 }}>
                      {value}
                    </Text>
                  </Flex>
                </div>
              </Timeline.Item>
            )
          })}
        </Timeline>
      )}
    </Card>
  );
};

export default HistoryPanel;
