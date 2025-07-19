// harvest/harvester.js

import { customEventAggregator } from "../aggregators/custom-event";
import { sendData } from "../transport/send";

const ENDPOINT = "https://your-collector.example.com/custom-events";
const MAX_RETRIES = 3;

let retryCount = 0;
let retryTimeout = null;

export const harvester = {
  harvest() {
    if (!customEventAggregator.hasEvents()) return;

    const events = customEventAggregator.getAndClear();
    const payload = JSON.stringify({ events });

    sendData(ENDPOINT, payload)
      .then(() => {
        retryCount = 0;
        clearRetry();
      })
      .catch(() => {
        // retry on failure
        retryCount++;
        if (retryCount <= MAX_RETRIES) {
          retryTimeout = setTimeout(() => {
            harvester.harvest();
          }, retryCount * 2000); // Exponential backoff
        }
      });
  },
};

function clearRetry() {
  if (retryTimeout) {
    clearTimeout(retryTimeout);
    retryTimeout = null;
  }
}
