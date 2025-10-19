import process from 'node:process';

export interface ExportOptions {
  format?: 'json' | 'csv';
  includeConflicts?: boolean;
  out?: string;
}

export async function runExport(options: ExportOptions = {}): Promise<void> {
  try {
    console.log('TODO: 调用 /export 接口并保存文件');
    console.log('导出选项: ', options);
  } catch (error) {
    console.error('导出失败，请确认本地服务已启动。');
    console.error(error);
    process.exitCode = 1;
  }
}
