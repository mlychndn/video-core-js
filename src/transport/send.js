// transport/send.js

export function sendData(url, payload) {
  return new Promise((resolve, reject) => {
    // Prefer beacon
    if (navigator.sendBeacon) {
      const success = navigator.sendBeacon(
        url,
        new Blob([payload], { type: "application/json" })
      );
      success ? resolve() : reject();
    } else {
      // Fallback to XHR
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          xhr.status >= 200 && xhr.status < 300 ? resolve() : reject();
        }
      };
      xhr.onerror = reject;
      xhr.send(payload);
    }
  });
}
