'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useErrorHandler } from '@/components/ui/toast';

interface FileUploadProps {
  type: 'photo' | 'clothing';
  multiple?: boolean;
  maxFiles?: number;
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * 文件上传组件
 * 专为移动端优化，支持相机拍照和图片选择
 */
export function FileUpload({
  type,
  multiple = false,
  maxFiles = 1,
  onFilesSelected,
  disabled = false,
  className = ''
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useErrorHandler();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];

    // 文件验证
    for (const file of fileArray) {
      // 检查文件类型
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} 不是图片文件`);
        continue;
      }

      // 检查文件大小 (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} 文件过大，请选择小于10MB的图片`);
        continue;
      }

      validFiles.push(file);

      // 检查文件数量
      if (validFiles.length >= maxFiles) {
        if (fileArray.length > maxFiles) {
          toast.warning(`最多只能选择 ${maxFiles} 张图片`);
        }
        break;
      }
    }

    if (validFiles.length > 0) {
      onFilesSelected(validFiles);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // 清空input值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const openFileSelector = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const openCamera = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
      fileInputRef.current.removeAttribute('capture');
    }
  };

  const getUploadText = () => {
    if (type === 'photo') {
      return {
        title: '📸 上传您的照片',
        subtitle: '拍照或从相册选择',
        description: '建议上传正面清晰的全身照'
      };
    } else {
      return {
        title: '👗 选择服装图片',
        subtitle: multiple ? '可选择多张服装图片' : '选择一张服装图片',
        description: '建议选择平铺或模特展示图'
      };
    }
  };

  const uploadText = getUploadText();

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div
        className={`
          border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-200
          ${isDragging 
            ? 'border-pink-400 bg-pink-50' 
            : 'border-pink-200 hover:border-pink-300'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-pink-50/50'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        {/* 图标和标题 */}
        <div className="mb-4">
          <div className="text-4xl mb-3 cat-bounce">
            {type === 'photo' ? '📸' : '👗'}
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {uploadText.title}
          </h3>
          <p className="text-sm cat-text-muted mb-4">
            {uploadText.description}
          </p>
        </div>

        {/* 操作按钮 */}
        <div className="space-y-3">
          <Button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              openFileSelector();
            }}
            disabled={disabled}
            className="cat-gradient-button touch-target w-full"
          >
            📱 从相册选择
          </Button>

          {type === 'photo' && (
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCamera();
              }}
              disabled={disabled}
              variant="outline"
              className="touch-target w-full border-pink-300 text-pink-600 hover:bg-pink-50"
            >
              📷 拍照
            </Button>
          )}
        </div>

        {/* 提示文字 */}
        <p className="text-xs cat-text-muted mt-4">
          {uploadText.subtitle} • 支持JPG、PNG格式 • 最大10MB
        </p>
      </div>
    </div>
  );
}