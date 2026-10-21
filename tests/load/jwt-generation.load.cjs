const autocannon = require("autocannon");

const BASE_URL = "http://localhost:5000";
const ENDPOINT = "/api/v1/jwt/generate";

const TEST_SECRET = "jwt-studio-demo-secret-key-2026-testing";

const requestBody = JSON.stringify({
  algorithm: "HS256",
  payload: {
    sub: "load-test-user",
    role: "developer",
  },
  key: TEST_SECRET,
  expiresIn: "1h",
});

const instance = autocannon(
  {
    url: BASE_URL,
    connections: 10,
    duration: 30,
    pipelining: 1,

    requests: [
      {
        method: "POST",
        path: ENDPOINT,
        headers: {
          "content-type": "application/json",
        },
        body: requestBody,
      },
    ],
  },
  (error, result) => {
    if (error) {
      console.error("Load test failed:", error.message);
      process.exitCode = 1;
      return;
    }

    console.log("\n===== JWT GENERATION LOAD TEST =====");
    console.log("Endpoint:", ENDPOINT);
    console.log("Total requests:", result.requests.total);
    console.log("Requests per second:", result.requests.average);
    console.log("Average latency:", result.latency.mean, "ms");
    console.log("P99 latency:", result.latency.p99, "ms");
    console.log("Non-2xx responses:", result.non2xx);
    console.log("Socket errors:", result.errors);
    console.log("Timeouts:", result.timeouts);
  }
);

autocannon.track(instance, { renderProgressBar: true });