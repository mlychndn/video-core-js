// aggregators/custom-event.js

const MAX_EVENTS = 1000; // to avoid memory bloat

class CustomEventAggregator {
  constructor() {
    this.queue = [];
  }

  store(event) {
    if (this.queue.length >= MAX_EVENTS) this.queue.shift();
    this.queue.push(event);
  }

  getAndClear() {
    const events = [...this.queue];
    this.queue.length = 0;
    return events;
  }

  hasEvents() {
    return this.queue.length > 0;
  }
}

export const customEventAggregator = new CustomEventAggregator();
