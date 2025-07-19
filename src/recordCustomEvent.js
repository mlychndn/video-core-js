// record-custom-event.js
import { customEventAggregator } from "../aggregators/custom-event";
import { scheduler } from "../harvest/harvest-scheduler";

export function recordCustomEvent(eventType, attributes = {}) {
  if (typeof eventType !== "string" || eventType.length === 0) return;

  console.log("eventType", eventType, attributes);

  customEventAggregator.store({
    type: eventType,
    attributes: { ...attributes },
    timestamp: Date.now(),
  });

  scheduler.scheduleHarvest();
}
