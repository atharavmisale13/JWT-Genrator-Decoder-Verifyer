const autocannon = require("autocannon");

const url = "http://localhost:5000/api/v1/health";

const instance = autocannon(
  {
    url,
    connections: 10,
    duration: 30,
    pipelining: 1,
  },
  (error, result) => {
    if (error) {
      console.error("Load test failed:", error);
      process.exitCode = 1;
      return;
    }

    console.log("\n===== HEALTH API LOAD TEST =====");
    console.log("Total requests:", result.requests.total);
    console.log("Requests per second:", result.requests.average);
    console.log("Average latency:", result.latency.mean, "ms");
    console.log("P95 latency:", result.latency.p95, "ms");
    console.log("P99 latency:", result.latency.p99, "ms");
    console.log("Non-2xx responses:", result.non2xx);
    console.log("Socket errors:", result.errors);
    console.log("Timeouts:", result.timeouts);
  }
);

autocannon.track(instance, { renderProgressBar: true });