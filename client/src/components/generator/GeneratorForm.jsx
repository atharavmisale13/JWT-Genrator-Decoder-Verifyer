import { useState } from "react";

import { useJwtGenerator } from "../../hooks/useJwtGenerator.js";
import "../../styles/generator.css";

const ALGORITHMS = ["HS256", "RS256", "ES256", "PS256"];

const INITIAL_PAYLOAD = JSON.stringify(
  {
    sub: "user123",
    name: "Test User",
    role: "developer",
  },
  null,
  2
);

export default function GeneratorForm() {
  const { result, error, isLoading, generate, reset } =
    useJwtGenerator();

  const [algorithm, setAlgorithm] = useState("HS256");
  const [payload, setPayload] = useState(INITIAL_PAYLOAD);
  const [key, setKey] = useState("");
  const [expiresIn, setExpiresIn] = useState("1h");
  const [formError, setFormError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setFormError("");
    reset();

    let parsedPayload;

    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      setFormError("Enter valid JSON in the payload field.");
      return;
    }

    if (
      parsedPayload === null ||
      typeof parsedPayload !== "object" ||
      Array.isArray(parsedPayload)
    ) {
      setFormError("The JWT payload must be a JSON object.");
      return;
    }

    if (!key.trim()) {
      setFormError("Please provide a signing key.");
      return;
    }

    await generate({
      algorithm,
      payload: parsedPayload,
      key,
      expiresIn,
    });
  }

  function handleChange(setter) {
    return (event) => {
      setter(event.target.value);
      setFormError("");
      reset();
    };
  }

  async function copyToken() {
    if (!result?.token) return;

    try {
      await navigator.clipboard.writeText(result.token);
    } catch {
      setFormError(
        "Unable to copy automatically. Select and copy the generated token."
      );
    }
  }

  return (
    <div className="generator-panel">
      <form className="generator-form" onSubmit={handleSubmit}>
        <div className="form-header">
          <div>
            <span className="eyebrow">TOKEN CREATION</span>
            <h2>Generate a JWT</h2>
            <p>
              Configure the signing algorithm, payload, expiration,
              and signing key.
            </p>
          </div>

          <span className="algorithm-badge">{algorithm}</span>
        </div>

        <div className="form-field">
          <label htmlFor="generator-algorithm">
            Signing algorithm
          </label>

          <select
            id="generator-algorithm"
            value={algorithm}
            onChange={handleChange(setAlgorithm)}
          >
            {ALGORITHMS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <small>
            HS256 uses a shared secret. RS256, ES256, and PS256
            require a compatible private key in PEM format.
          </small>
        </div>

        <div className="form-field">
          <label htmlFor="generator-payload">JWT payload (JSON)</label>

          <textarea
            id="generator-payload"
            value={payload}
            onChange={handleChange(setPayload)}
            rows={8}
            placeholder='{"sub":"user123","role":"developer"}'
            spellCheck="false"
            autoComplete="off"
            required
          />

          <small>
            Use non-sensitive test data. Do not include passwords,
            production credentials, or private information.
          </small>
        </div>

        <div className="form-field">
          <label htmlFor="generator-expires">Token expiration</label>

          <select
            id="generator-expires"
            value={expiresIn}
            onChange={handleChange(setExpiresIn)}
          >
            <option value="15m">15 minutes</option>
            <option value="30m">30 minutes</option>
            <option value="1h">1 hour</option>
            <option value="6h">6 hours</option>
            <option value="12h">12 hours</option>
            <option value="24h">24 hours</option>
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="generator-key">
            {algorithm === "HS256"
              ? "Shared signing secret"
              : "Private signing key (PEM)"}
          </label>

          <textarea
            id="generator-key"
            value={key}
            onChange={handleChange(setKey)}
            rows={algorithm === "HS256" ? 3 : 6}
            placeholder={
              algorithm === "HS256"
                ? "Enter a test secret of at least 32 UTF-8 bytes..."
                : "-----BEGIN PRIVATE KEY-----\n..."
            }
            spellCheck="false"
            autoComplete="off"
            required
          />

          <small>
            This tool sends the signing key to its configured backend
            for processing. Use test keys only, and never enter
            production secrets.
          </small>
        </div>

        {formError && (
          <div className="form-error" role="alert">
            {formError}
          </div>
        )}

        {error && (
          <div className="form-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="generate-button"
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate JWT"}
        </button>
      </form>

      {result?.token && (
        <section className="generated-result" aria-live="polite">
          <div className="result-heading">
            <div>
              <span className="eyebrow">GENERATION SUCCESSFUL</span>
              <h3>Your JWT</h3>
            </div>

            <span className="result-status">Generated</span>
          </div>

          <div className="form-field">
            <label htmlFor="generated-token">Encoded token</label>

            <textarea
              id="generated-token"
              className="token-output"
              value={result.token}
              readOnly
              rows={6}
              spellCheck="false"
            />
          </div>

          <div className="result-heading">
            <span>Algorithm: {result.algorithm}</span>
            <span>Expires in: {result.expiresIn}</span>
          </div>

          <button
            type="button"
            className="secondary-button"
            onClick={copyToken}
          >
            Copy JWT
          </button>
        </section>
      )}
    </div>
  );
}