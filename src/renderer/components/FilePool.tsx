import React from "react";
import { Button, Upload, message, Tree, Space, Popconfirm } from "antd";
import type { UploadProps } from "antd";
import { InboxOutlined, DeleteOutlined } from "@ant-design/icons";
import { parseExcelToJson, ExcelFileData } from "../utils/excelParser";

const { Dragger } = Upload;

interface FilePoolProps {
  files: ExcelFileData[];
  onFilesLoaded: (files: ExcelFileData[]) => void;
  onRemoveFile: (fileId: string) => void;
}

const FilePool: React.FC<FilePoolProps> = ({
  files,
  onFilesLoaded,
  onRemoveFile,
}) => {
  const handleUpload: UploadProps["customRequest"] = async (options) => {
    const { file } = options;
    try {
      const parsed = await parseExcelToJson((file as any).path);
      onFilesLoaded([parsed]);
    } catch (err) {
      message.error(`解析失败：${(file as any).name}`);
    }
  };

  const treeData = files.map((f) => ({
    title: (
      <Space>
        <span>{f.name}</span>
        <Popconfirm
          title="确定删除此文件？"
          onConfirm={() => onRemoveFile(f.id)}
          okText="删除"
          cancelText="取消"
        >
          <DeleteOutlined style={{ color: "red", cursor: "pointer" }} />
        </Popconfirm>
      </Space>
    ),
    key: f.id,
    children: f.sheets.map((s) => ({
      title: s.name,
      key: `${f.id}-${s.name}`,
      isLeaf: true,
    })),
  }));

  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      <Dragger
        multiple
        customRequest={handleUpload}
        showUploadList={false}
        accept=".xlsx,.xls"
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">点击或拖拽 Excel 文件到此区域</p>
      </Dragger>

      <div style={{ maxHeight: "70vh", overflow: "auto" }}>
        {treeData.length > 0 ? (
          <Tree defaultExpandAll treeData={treeData} showLine />
        ) : (
          <div style={{ textAlign: "center", color: "#999", marginTop: 50 }}>
            暂无文件，拖拽上传开始
          </div>
        )}
      </div>
    </Space>
  );
};

export default FilePool;
