export class Aggregator {
  constructor() {
    this.aggregatedData = {};
  }

  store(type, name, params, newMetrics, customParams) {
    const bucket = this.#getBucket(type, name, params, customParams);
    bucket.metrics = aggregateMetrics(newMetrics, bucket.metrics);
    return bucket;
  }

  merge(type, name, metrics, params, customParams, overwriteParams = false) {
    const bucket = this.#getBucket(type, name, params, customParams);
    if (overwriteParams) bucket.params = params;

    if (!bucket.metrics) {
      bucket.metrics = metrics;
      return;
    }

    const oldMetrics = bucket.metrics;
    oldMetrics.count += metrics.count;

    Object.keys(metrics || {}).forEach((key) => {
      if (key === "count") return;
      const oldMetric = oldMetrics[key];
      const newMetric = metrics[key];
      if (newMetric && !newMetric.c) {
        oldMetrics[key] = updateMetric(newMetric.t, oldMetric);
      } else {
        oldMetrics[key] = mergeMetric(newMetric, oldMetric);
      }
    });
  }

  storeMetric(type, name, params, value) {
    const bucket = this.#getBucket(type, name, params);
    bucket.stats = updateMetric(value, bucket.stats);
    return bucket;
  }

  take(types, deleteWhenRetrieved = true) {
    const results = {};
    let hasData = false;
    for (const type of types) {
      results[type] = Object.values(this.aggregatedData[type] || []);
      if (results[type].length) hasData = true;
      if (deleteWhenRetrieved) delete this.aggregatedData[type];
    }
    return hasData ? results : null;
  }

  #getBucket(type, name, params, customParams) {
    if (!this.aggregatedData[type]) this.aggregatedData[type] = {};
    let bucket = this.aggregatedData[type][name];
    if (!bucket) {
      bucket = this.aggregatedData[type][name] = { params: params || {} };
      if (customParams) bucket.custom = customParams;
    }
    return bucket;
  }
}

function aggregateMetrics(newMetrics, oldMetrics = { count: 0 }) {
  oldMetrics.count += 1;
  Object.entries(newMetrics || {}).forEach(([key, value]) => {
    oldMetrics[key] = updateMetric(value, oldMetrics[key]);
  });
  return oldMetrics;
}

function updateMetric(value, metric) {
  if (value == null) return updateCounterMetric(metric);
  if (!metric) return { t: value };
  if (!metric.c) metric = createMetricObject(metric.t);
  metric.c += 1;
  metric.t += value;
  metric.sos += value * value;
  metric.max = Math.max(metric.max, value);
  metric.min = Math.min(metric.min, value);
  return metric;
}

function updateCounterMetric(metric) {
  return metric ? { ...metric, c: metric.c + 1 } : { c: 1 };
}

function mergeMetric(newMetric, oldMetric) {
  if (!oldMetric) return newMetric;
  if (!oldMetric.c) oldMetric = createMetricObject(oldMetric.t);
  oldMetric.min = Math.min(newMetric.min, oldMetric.min);
  oldMetric.max = Math.max(newMetric.max, oldMetric.max);
  oldMetric.t += newMetric.t;
  oldMetric.sos += newMetric.sos;
  oldMetric.c += newMetric.c;
  return oldMetric;
}

function createMetricObject(value) {
  return {
    t: value,
    min: value,
    max: value,
    sos: value * value,
    c: 1,
  };
}
