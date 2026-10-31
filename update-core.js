export const CURRENT_VERSION = '2.1.0';
export const REPOSITORY = 'OuyangLing1999/Dsh-scriptForGin';

export function compareVersions(left, right) {
  const parse = (value) => {
    const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(value);
    if (!match) throw new Error('版本号格式不受支持：' + value);
    return match.slice(1).map(Number);
  };
  const a = parse(left), b = parse(right);
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i] ? 1 : -1;
  }
  return 0;
}

export const AUTO_UPDATE_INTERVAL_MS = 30 * 60 * 1000;

export function startAutoUpdateChecks({
  check = checkForUpdates, onResult, onError = () => {},
  schedule = setInterval, cancel = clearInterval,
}) {
  let stopped = false;
  let running = false;
  async function tick() {
    if (stopped || running) return;
    running = true;
    try {
      const result = await check();
      if (!stopped) onResult(result);
    } catch (error) {
      if (!stopped) onError(error);
    } finally {
      running = false;
    }
  }
  void tick();
  const timer = schedule(tick, AUTO_UPDATE_INTERVAL_MS);
  return () => { stopped = true; cancel(timer); };
}

export async function checkForUpdates(fetcher = globalThis.fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetcher('https://api.github.com/repos/' + REPOSITORY + '/releases/latest', {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store', signal: controller.signal,
    });
    if (!response.ok) throw new Error(response.status === 404
      ? '暂未发布正式版本，请稍后重试。'
      : response.status === 403 || response.status === 429
        ? 'GitHub 请求频率受限，请稍后重试。'
        : 'GitHub 返回 HTTP ' + response.status);
    const release = await response.json();
    if (release.draft || release.prerelease || typeof release.tag_name !== 'string') {
      throw new Error('GitHub 返回的正式版本信息不完整。');
    }
    const latest = release.tag_name.replace(/^v/, '');
    return {
      current: CURRENT_VERSION, latest,
      available: compareVersions(latest, CURRENT_VERSION) > 0,
      url: 'https://github.com/' + REPOSITORY + '/releases/tag/' + encodeURIComponent(release.tag_name),
      notes: typeof release.body === 'string' ? release.body.slice(0, 6000) : '',
    };
  } catch (error) {
    if (controller.signal.aborted) throw new Error('检查更新超时，请检查网络后重试。');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
