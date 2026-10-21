import { useState } from "react";

import { useJwtVerifier } from "../../hooks/useJwtVerifier.js";
import { validateJwtInput } from "../../utils/validateJwtInput.js";

import "../../styles/verifier.css";

const ALGORITHMS = ["HS256", "RS256", "ES256", "PS256"];

export default function VerifierForm() {
  const {
    result,
    error,
    isLoading,
    verify,
    reset,
  } = useJwtVerifier();

  const [token, setToken] = useState("");
  const [algorithm, setAlgorithm] = useState("HS256");
  const [key, setKey] = useState("");
  const [formError, setFormError] = useState("");
  const [touched, setTouched] = useState(false);

  const validation = validateJwtInput(token);

  function handleSubmit(event) {
    event.preventDefault();

    setFormError("");
    reset();

    const tokenValidation = validateJwtInput(token);

    if (!tokenValidation.valid) {
      setFormError(tokenValidation.message);
      setTouched(true);
      return;
    }

    if (!key.trim()) {
      setFormError("Please provide the verification key.");
      return;
    }

    verify({
      token: tokenValidation.token,
      algorithm,
      key,
    });
  }

  function handleTokenChange(event) {
    setToken(event.target.value);
    setTouched(true);
    setFormError("");

    reset();
  }

  function handleKeyChange(event) {
    setKey(event.target.value);
    setFormError("");

    reset();
  }

  function handleAlgorithmChange(event) {
    setAlgorithm(event.target.value);
    setKey("");
    setFormError("");

    reset();
  }

  return (
    <section className="verifier-panel">
      <form
        className="verifier-form"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="verifier-heading">
          <div>
            <span className="eyebrow">SIGNATURE VALIDATION</span>

            <h2>Verify a JWT</h2>

            <p>
              Verify a token's signature using the expected
              algorithm and corresponding key.
            </p>
          </div>

          <span className="algorithm-badge">{algorithm}</span>
        </div>

        <div className="form-field">
          <label htmlFor="verify-token">Encoded JWT</label>

          <textarea
            id="verify-token"
            value={token}
            onChange={handleTokenChange}
            rows={6}
            placeholder="Paste the JWT to verify..."
            spellCheck="false"
            autoComplete="off"
            aria-invalid={
              touched && token.trim() && !validation.valid
            }
            aria-describedby="verify-token-feedback"
          />

          <small id="verify-token-feedback" aria-live="polite">
            {!touched || !token.trim()
              ? "Paste a signed JWT containing three dot-separated segments."
              : validation.valid
                ? "Token structure looks correct. Submit to verify the signature."
                : validation.message}
          </small>
        </div>

        <div className="form-field">
          <label htmlFor="verify-algorithm">
            Expected algorithm
          </label>

          <select
            id="verify-algorithm"
            value={algorithm}
            onChange={handleAlgorithmChange}
          >
            {ALGORITHMS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <small>
            The backend must enforce this algorithm independently
            of the untrusted token header.
          </small>
        </div>

        <div className="form-field">
          <label htmlFor="verify-key">
            {algorithm === "HS256"
              ? "Shared secret"
              : "Public key (PEM)"}
          </label>

          <textarea
            id="verify-key"
            value={key}
            onChange={handleKeyChange}
            rows={algorithm === "HS256" ? 3 : 6}
            placeholder={
              algorithm === "HS256"
                ? "Enter your test secret..."
                : "-----BEGIN PUBLIC KEY-----\n..."
            }
            spellCheck="false"
            autoComplete="off"
            aria-describedby="verify-key-help"
          />

          <small id="verify-key-help" className="security-note">
            HS256 uses the shared secret. RS256, ES256, and PS256
            generally use the corresponding public key for verification.
            Never use production secrets in an untrusted environment.
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
          {isLoading ? "Verifying..." : "Verify JWT"}
        </button>
      </form>

      {result && (
        <section
          className="verification-result"
          aria-live="polite"
        >
          <span className="eyebrow">VERIFICATION RESULT</span>

          <h3>
            {result.verified
              ? "Signature verified"
              : "Verification unsuccessful"}
          </h3>

          <p>
            Algorithm:{" "}
            <strong>{result.algorithm || algorithm}</strong>
          </p>

          <p>
            Status:{" "}
            <strong>
              {result.verified ? "Verified" : "Not verified"}
            </strong>
          </p>

          {result.verified && result.payload != null && (
            <div className="verification-payload">
              <h4>Verified payload</h4>

              <pre>
                <code>
                  {JSON.stringify(result.payload, null, 2)}
                </code>
              </pre>
            </div>
          )}

          <p className="security-note">
            Signature verification does not automatically establish
            that every claim is acceptable for your application.
            The backend must also enforce the required expiration,
            issuer, audience, and other applicable claim policies.
          </p>
        </section>
      )}
    </section>
  );
}