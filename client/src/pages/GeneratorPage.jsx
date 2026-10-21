import GeneratorForm from "../components/generator/GeneratorForm.jsx";

import "../styles/generator.css";

export default function GeneratorPage() {
  return (
    <section className="page generator-page">
      <div className="generator-intro">
        <span className="eyebrow">DEVELOPER SECURITY TOOLKIT</span>

        <h1>JWT Generator</h1>

        <p>
          Generate signed JSON Web Tokens with control over
          algorithms, payload claims, and token expiration.
        </p>
      </div>

      <GeneratorForm />
    </section>
  );
}