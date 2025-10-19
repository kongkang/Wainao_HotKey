import fs from 'node:fs';
import path from 'node:path';

const mockDir = path.join(process.cwd(), 'tests', 'integration', 'fixtures');
const shortcutFile = path.join(mockDir, 'shortcuts.json');

export function ensureMockData(): void {
  if (!fs.existsSync(mockDir)) {
    fs.mkdirSync(mockDir, { recursive: true });
  }

  if (!fs.existsSync(shortcutFile)) {
    const payload = {
      shortcuts: [
        {
          id: 'demo-1',
          scope: 'app',
          bundleId: 'com.example.demo',
          appName: 'DemoApp',
          rawCombo: '⌘⇧P',
          normalizedCombo: 'Command+Shift+P',
          humanLabel: '打开命令面板',
          target: '菜单 > 文件 > 打开命令面板',
          sourceFile: '~/Library/Preferences/com.example.demo.plist',
          editable: true,
          lastSeenAt: new Date().toISOString()
        }
      ]
    };
    fs.writeFileSync(shortcutFile, JSON.stringify(payload, null, 2), 'utf-8');
  }
}

if (require.main === module) {
  ensureMockData();
  console.log('Integration mock data ready at', shortcutFile);
}
