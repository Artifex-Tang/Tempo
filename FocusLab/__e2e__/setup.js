/**
 * miniprogram-automator 全局配置
 * 在运行前设置好微信开发者工具服务端口和项目路径
 */
const automator = require('miniprogram-automator');
const path = require('path');

const WX_CLI = 'C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat';
const PROJECT_PATH = path.resolve(__dirname, '..');

/**
 * 启动小程序，返回 miniProgram 实例
 * @param {number} port 微信开发者工具服务端口（默认9420）
 */
async function launch(port = 9420) {
  const miniProgram = await automator.launch({
    cliPath: WX_CLI,
    projectPath: PROJECT_PATH,
    port,
  });
  return miniProgram;
}

module.exports = { launch, WX_CLI, PROJECT_PATH };
