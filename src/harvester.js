export class Harvester {
  constructor(aggregator, sendFn, intervalMs = 10000, maxRetries = 3) {
    this.aggregator = aggregator;
    this.sendFn = sendFn;
    this.intervalMs = intervalMs;
    this.maxRetries = maxRetries;
    this.timer = null;
  }

  scheduleHarvest() {
    if (this.timer) return;
    this.timer = setTimeout(() => this._harvest(), this.intervalMs);
  }

  _harvest(retries = 0) {
    const data = this.aggregator.take(["customEvent"]);
    if (!data) {
      this.timer = null;
      return;
    }

    this.sendFn(data)
      .then(() => {
        this.timer = null;
      })
      .catch(() => {
        if (retries < this.maxRetries) {
          setTimeout(() => this._harvest(retries + 1), 2000);
        } else {
          this.timer = null; // Stop retrying after max
        }
      });
  }
}
