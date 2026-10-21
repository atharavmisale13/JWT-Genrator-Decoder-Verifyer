import { useState } from "react";

import { useJwtDecoder } from "../../hooks/useJwtDecoder.js";
import { validateJwtInput } from "../../utils/validateJwtInput.js";

import "../../styles/decoder.css";

export default function DecoderForm() {
  const {
    result,
    error,
    isLoading,
    decode,
    reset,
  } = useJwtDecoder();

  const [token, setToken] = useState("");
  const [formError, setFormError] = useState("");
  const [touched, setTouched] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");

  const validation = validateJwtInput(token);

  function handleSubmit(event) {
    event.preventDefault();

    setFormError("");
    setCopyMessage("");
    reset();

    const tokenValidation = validateJwtInput(token);

    if (!tokenValidation.valid) {
      setFormError(tokenValidation.message);
      setTouched(true);
      return;
    }

    decode(tokenValidation.token);
  }

  function handleTokenChange(event) {
    setToken(event.target.value);
    setTouched(true);
    setFormError("");
    setCopyMessage("");

    reset();
  }

  async function copyToClipboard(value) {
    try {
      const formattedValue = JSON.stringify(value ?? {}, null, 2);

      await navigator.clipboard.writeText(formattedValue);

      setCopyMessage("JSON copied to clipboard.");
    } catch {
      setCopyMessage(
        "Clipboard access is unavailable. Select and copy the JSON manually."
      );
    }
  }

  return (
    <section className="decoder-panel">
      <form
        className="decoder-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="decoder-form-header">
          <div>
            <span className="eyebrow">TOKEN INSPECTOR</span>

            <h2>Decode a JWT</h2>

            <p>
              Inspect a JSON Web Token's header and payload.
              Decoding does not verify its signature.
            </p>
          </div>

          <span className="algorithm-badge">JWT</span>
        </div>

        <div className="form-field">
          <label htmlFor="jwt-token">Encoded JWT</label>

          <textarea
            id="jwt-token"
            value={token}
            onChange={handleTokenChange}
            placeholder="Paste your JWT here..."
            rows={6}
            spellCheck="false"
            autoComplete="off"
            aria-invalid={
              touched && token.trim() && !validation.valid
            }
            aria-describedby="jwt-token-feedback"
          />

          <small id="jwt-token-feedback" aria-live="polite">
            {!touched || !token.trim()
              ? "Paste a signed JWT containing three dot-separated segments."
              : validation.valid
                ? "Token structure looks correct. Signature verification has not been performed."
                : validation.message}
          </small>

          <small className="security-note">
            Do not paste production tokens or tokens containing
            sensitive personal information into an untrusted environment.
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
          {isLoading ? "Decoding..." : "Decode JWT"}
        </button>
      </form>

      {result && (
        <section className="decoder-results">
          <div className="decoder-results-header">
            <div>
              <span className="eyebrow">DECODE COMPLETE</span>

              <h3>Token inspection</h3>
            </div>

            <span className="result-status">
              Decoded — Not Verified
            </span>
          </div>

          <div className="decoder-metadata">
            <div>
              <span>Algorithm</span>

              <strong>
                {result.algorithm || result.header?.alg || "Unknown"}
              </strong>
            </div>

            <div>
              <span>Token type</span>

              <strong>
                {result.tokenType || result.header?.typ || "JWT"}
              </strong>
            </div>

            <div>
              <span>Signature verification</span>

              <strong>Not performed</strong>
            </div>
          </div>

          <JsonResult
            title="Header"
            value={result.header}
            onCopy={copyToClipboard}
          />

          <JsonResult
            title="Payload"
            value={result.payload}
            onCopy={copyToClipboard}
          />

          {copyMessage && (
            <p role="status" aria-live="polite">
              {copyMessage}
            </p>
          )}

          <p className="security-note">
            The decoded header and payload are untrusted until the
            signature and required claims have been verified.
            Never use decoded claims alone to authorize access.
          </p>
        </section>
      )}
    </section>
  );
}

function JsonResult({ title, value, onCopy }) {
  return (
    <section className="json-result">
      <div className="json-result-header">
        <h4>{title}</h4>

        <button
          type="button"
          className="secondary-button"
          onClick={() => onCopy(value)}
        >
          Copy JSON
        </button>
      </div>

      <pre>
        <code>{JSON.stringify(value ?? {}, null, 2)}</code>
      </pre>
    </section>
  );
}