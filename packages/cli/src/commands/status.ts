import process from 'node:process';

export async function runStatus(): Promise<void> {
  try {
    console.log('TODO: 调用 /permissions/status 获取权限状态');
    console.log('TODO: 调用 /conflicts 获取冲突统计');
  } catch (error) {
    console.error('无法获取状态，请确认应用已运行。');
    console.error(error);
    process.exitCode = 1;
  }
}
