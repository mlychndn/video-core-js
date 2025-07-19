// Minimal standalone Harvester for New Relic-style payload delivery
// Compatible with Aggregator you already have

export class Harvester {
  constructor({
    endpoint,
    onUnload,
    features,
    retryConfig = {},
    interval = 10000,
  }) {
    this.endpoint = endpoint;
    this.onUnload = onUnload;
    this.features = features; // { featureName: { getPayload: fn, onFinished: fn } }
    this.retryConfig = retryConfig;
    this.interval = interval;
    this.timer = null;
    this.beaconAvailable =
      typeof navigator !== "undefined" &&
      typeof navigator.sendBeacon === "function";
    this.useSendBeacon = true;
    this.retryCount = 0;
  }

  start() {
    this.stop();
    this.timer = setTimeout(() => this.harvestAll(), this.interval);
    if (this.onUnload && typeof window !== "undefined") {
      window.addEventListener("unload", () => this.harvestAll(true));
    }
  }

  stop() {
    if (this.timer) clearTimeout(this.timer);
  }

  harvestAll(isFinal = false) {
    for (const [featureName, { getPayload, onFinished }] of Object.entries(
      this.features
    )) {
      const payload = getPayload();
      if (!payload || Object.keys(payload).length === 0) continue;

      const method = this.getMethod(isFinal);
      const body = JSON.stringify(payload);

      this.send(method, this.endpoint, body, (success) => {
        if (success) {
          this.retryCount = 0;
          if (onFinished) onFinished();
        } else if (this.shouldRetry()) {
          this.retryCount++;
          setTimeout(() => this.harvestAll(), this.getRetryDelay());
        }
      });
    }
    if (!isFinal)
      this.timer = setTimeout(() => this.harvestAll(), this.interval);
  }

  getMethod(isFinal) {
    if (isFinal && this.useSendBeacon && this.beaconAvailable) return "beacon";
    return "xhr";
  }

  shouldRetry() {
    return this.retryCount < (this.retryConfig.maxRetries || 3);
  }

  getRetryDelay() {
    const base = this.retryConfig.baseDelay || 5000;
    return base * Math.pow(2, this.retryCount);
  }

  send(method, url, body, callback) {
    if (method === "beacon") {
      const success = navigator.sendBeacon(url, body);
      callback(success);
      return;
    }

    const xhr = new XMLHttpRequest();
    xhr.open("POST", url, true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        const success = xhr.status >= 200 && xhr.status < 300;
        callback(success);
      }
    };
    xhr.onerror = function () {
      callback(false);
    };
    xhr.send(body);
  }
}
