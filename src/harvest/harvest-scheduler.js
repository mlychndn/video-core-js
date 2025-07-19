// harvest/harvest-scheduler.js

import { harvester } from "./harvester";

const HARVEST_INTERVAL = 10000; // 10 seconds
let intervalId = null;

export const scheduler = {
  scheduleHarvest() {
    if (!intervalId) {
      intervalId = setInterval(() => {
        harvester.harvest();
      }, HARVEST_INTERVAL);
    }
  },

  stop() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  },

  forceHarvest() {
    harvester.harvest();
  },
};
