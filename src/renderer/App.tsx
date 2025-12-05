import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { Layout, Button, message, Card, Typography, Space, Tag } from "antd";
import FilePool from "./components/FilePool";
import RuleBuilder from "./components/RuleBuilder";
import { ExcelFileData } from "./utils/excelParser";

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [files, setFiles] = useState<Map<string, ExcelFileData>>(new Map());
  const [result, setResult] = useState<number>(0);

  const handleFilesLoaded = (newFiles: ExcelFileData[]) => {
    const map = new Map(files);
    newFiles.forEach((f) => map.set(f.id, f));
    setFiles(map);
    message.success(`成功加载 ${newFiles.length} 个文件`);
  };

  const handleRemoveFile = (fileId: string) => {
    const map = new Map(files);
    map.delete(fileId);
    setFiles(map);
  };

  const handleCalculate = (total: number) => {
    setResult(total);
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Header style={{ color: "white", fontSize: 20 }}>
        多表格数值计算工具
      </Header>
      <Layout>
        <Sider width={300} style={{ background: "#f0f2f5", padding: 12 }}>
          <FilePool
            files={Array.from(files.values())}
            onFilesLoaded={handleFilesLoaded}
            onRemoveFile={handleRemoveFile}
          />
        </Sider>
        <Content style={{ padding: 24 }}>
          <Space direction="vertical" size="large" style={{ width: "100%" }}>
            <Card title="规则构建区">
              <RuleBuilder filesData={files} onCalculate={handleCalculate} />
            </Card>

            <Card>
              <Title level={2} style={{ textAlign: "center" }}>
                计算结果:{" "}
                <Tag color="green" style={{ fontSize: 32 }}>
                  {result.toLocaleString()}
                </Tag>
              </Title>
            </Card>
          </Space>
        </Content>
      </Layout>
    </Layout>
  );
};

const root = createRoot(document.body);
root.render(<App />);
