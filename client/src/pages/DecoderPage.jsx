import DecoderForm from "../components/decoder/DecoderForm.jsx";

export default function DecoderPage() {
  return (
    <section className="page decoder-page">
      <div className="decoder-intro">
        <span className="eyebrow">
          DEVELOPER SECURITY TOOLKIT
        </span>

        <h1>JWT Decoder</h1>

        <p>
          Decode JSON Web Tokens and inspect their headers and
          payload claims without confusing decoding with verification.
        </p>
      </div>

      <DecoderForm />
    </section>
  );
}