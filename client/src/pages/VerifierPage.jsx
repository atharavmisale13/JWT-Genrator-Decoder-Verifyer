import VerifierForm from "../components/verifier/VerifierForm.jsx";

export default function VerifierPage() {
  return (
    <section className="page verifier-page">
      <div className="verifier-intro">
        <span className="eyebrow">
          DEVELOPER SECURITY TOOLKIT
        </span>

        <h1>JWT Verifier</h1>

        <p>
          Verify JWT signatures with an explicitly selected
          algorithm and the appropriate verification key.
        </p>
      </div>

      <VerifierForm />
    </section>
  );
}