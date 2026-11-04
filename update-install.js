// Pure update policy. Host parseInstallSpec supports HTTP .tgz/.tar.gz, not release ZIPs.
// Evidence: @deepseek-ai/dsh-plugin-manager/lib/index.js:73-101, 1757-1767.
const UPDATE_PACKAGE = '@local/elderly-script';
const UPDATE_REPOSITORY_PATH = '/OuyangLing1999/Dsh-scriptForGin/releases/download/';
function stableUpdateVersion(value) {
  return typeof value === 'string' && /^v?\d+\.\d+\.\d+$/.test(value) ? value.replace(/^v/, '') : '';
}
function officialUpdateArchive(value, expectedVersion) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.hostname !== 'github.com' || url.port || url.username || url.password || url.search || url.hash) return false;
    if (!url.pathname.startsWith(UPDATE_REPOSITORY_PATH)) return false;
    const rest = url.pathname.slice(UPDATE_REPOSITORY_PATH.length).split('/');
    return rest.length === 2 && stableUpdateVersion(rest[0]) === expectedVersion && /\.(?:tgz|tar\.gz)$/i.test(rest[1]);
  } catch { return false; }
}
export function resolveInstallTarget(bundle, release) {
  const expectedVersion = stableUpdateVersion(release?.latest);
  const manual = reason => ({ kind: 'manual', reason, expectedVersion });
  if (!bundle || bundle.name !== UPDATE_PACKAGE) return manual('未找到本插件的已安装信息，请下载安装包后手动安装。');
  if (!expectedVersion || release?.available !== true) return manual('没有确认可用的新正式版本。');
  const current = stableUpdateVersion(bundle.version);
  if (!current || expectedVersion.split('.').map(Number).reduce((order, value, i) => order || Math.sign(value - Number(current.split('.')[i])), 0) <= 0) return manual('新版版本号未高于已安装版本，或已安装版本未披露。');
  const source = bundle.installTarget?.spec || bundle.source;
  if (typeof source !== 'string' || !officialUpdateArchive(source, current)) return manual('当前安装来源未确认为官方发布的远程压缩包，请下载新版安装包后手动安装。');
  if (!officialUpdateArchive(release.assetUrl, expectedVersion)) return manual('新版资源不是宿主明确支持的官方 TGZ/TAR.GZ 安装包；ZIP 请下载解压后手动安装。');
  return { kind: 'remote', spec: release.assetUrl, expectedVersion };
}
export function verifyInstalledVersion(bundle, expected) {
  const expectedVersion = stableUpdateVersion(expected);
  const actualVersion = typeof bundle?.version === 'string' ? bundle.version : '';
  let reason = '';
  if (!bundle || bundle.name !== UPDATE_PACKAGE || bundle.installed !== true) reason = '未找到本插件的已安装信息。';
  else if (bundle.error) reason = '宿主报告插件安装状态异常，请检查插件管理器。';
  else if (!expectedVersion || !stableUpdateVersion(actualVersion)) reason = '已安装版本或目标版本未披露，尚未核验更新结果。';
  else if (actualVersion !== expectedVersion) reason = '已安装版本为 ' + actualVersion + '，目标版本为 ' + expectedVersion + '，更新尚未核验成功。';
  return { ok: !reason, reason, actualVersion, expectedVersion };
}
