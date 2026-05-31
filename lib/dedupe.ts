// 동시에 들어오는 동일 GET 요청을 하나의 네트워크 호출로 합친다.
// (여러 컴포넌트가 같은 시점에 마운트되며 같은 API를 부르는 경우 방지)
// 진행 중인 요청만 공유하고, 끝나면 캐시를 비워 다음 호출은 새로 나간다.
const inFlight = new Map<string, Promise<unknown>>();

export function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(key);
  if (existing) return existing as Promise<T>;

  const promise = fn().finally(() => {
    inFlight.delete(key);
  });
  inFlight.set(key, promise);
  return promise;
}
