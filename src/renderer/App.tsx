// src/renderer/App.tsx
import React, { useState } from "react";
import { Layout, Tabs, theme, message } from "antd";
import FilePool from "./components/FilePool";
import RuleBuilder from "./components/RuleBuilder";
import { ExcelFileData } from "./utils/xlsxParser";
import { createRoot } from "react-dom/client";

const { Header, Content, Sider } = Layout;

interface CalcTab {
  key: string;
  label: string;
  fileId: string;
  result: number;
}

const App: React.FC = () => {
  const [files, setFiles] = useState<Map<string, ExcelFileData>>(new Map());
  const [activeTabs, setActiveTabs] = useState<CalcTab[]>([]);
  const [activeKey, setActiveKey] = useState<string>("");

  const {
    token: { colorBgContainer },
  } = theme.useToken();

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

    // 同时关闭相关的 Tab
    const remainingTabs = activeTabs.filter((t) => t.fileId !== fileId);
    setActiveTabs(remainingTabs);
    if (activeKey === fileId && remainingTabs.length > 0) {
      setActiveKey(remainingTabs[0].key);
    }
  };

  // 关键：点击文件打开 Tab
  const openFileTab = (file: ExcelFileData) => {
    const existing = activeTabs.find((t) => t.fileId === file.id);
    if (existing) {
      setActiveKey(existing.key);
      return;
    }

    const newTab: CalcTab = {
      key: file.id,
      label: file.name,
      fileId: file.id,
      result: 0,
    };

    setActiveTabs([...activeTabs, newTab]);
    setActiveKey(file.id);
  };

  const onTabChange = (key: string) => {
    setActiveKey(key);
  };

  const onTabEdit = (targetKey: any, action: "add" | "remove") => {
    if (action === "remove") {
      let newActiveKey = activeKey;
      const newTabs = activeTabs.filter((t) => t.key !== targetKey);
      if (activeKey === targetKey && newTabs.length > 0) {
        newActiveKey = newTabs[newTabs.length - 1].key;
      }
      setActiveTabs(newTabs);
      setActiveKey(newActiveKey);
    }
  };

  const updateTabResult = (fileId: string, result: number) => {
    setActiveTabs((tabs) =>
      tabs.map((t) => (t.fileId === fileId ? { ...t, result } : t))
    );
  };

  return (
    <Layout style={{ height: "100vh" }}>
      <Header
        style={{
          color: "white",
          fontSize: 20,
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
        }}
      >
        ExcelCalcPro - 多文件并行计算工具
      </Header>
      <Layout>
        <Sider width="25%" style={{ background: colorBgContainer }}>
          <FilePool
            files={Array.from(files.values())}
            onFilesLoaded={handleFilesLoaded}
            onRemoveFile={handleRemoveFile}
            onFileClick={openFileTab} // 新增：点击打开 Tab
          />
        </Sider>
        <Content style={{ padding: 12, background: colorBgContainer }}>
          {activeTabs.length === 0 ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                color: "#999",
              }}
            >
              <div style={{ fontSize: 64, marginBottom: 24 }}>📊</div>
              <div style={{ fontSize: 20 }}>点击左侧文件开始计算</div>
              <div style={{ marginTop: 8 }}>支持同时打开多个文件并行计算</div>
            </div>
          ) : (
            <Tabs
              type="editable-card"
              hideAdd
              activeKey={activeKey}
              onChange={onTabChange}
              onEdit={onTabEdit}
              items={activeTabs.map((tab) => {
                const file = files.get(tab.fileId);
                return {
                  key: tab.key,
                  label: (
                    <span>
                      {file?.name || "未知文件"}
                      {tab.result > 0 && (
                        <span
                          style={{
                            marginLeft: 8,
                            color: "#52c41a",
                            fontWeight: "bold",
                          }}
                        >
                          = {tab.result.toLocaleString()}
                        </span>
                      )}
                    </span>
                  ),
                  children: file ? (
                    <RuleBuilder
                      filesData={files}
                      currentFileId={file.id}
                      onCalculate={(result) => updateTabResult(file.id, result)}
                    />
                  ) : null,
                };
              })}
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

const root = createRoot(document.body);
root.render(<App />);
