import Logo from './Logo';

export default function AppLoadingScreen({ message = 'Preparing your smart booking space...' }) {
  return (
    <section className="app-loader-screen" aria-live="polite" aria-label="Loading">
      <div className="loader-content">
        <div className="loader-logo-wrap">
          <Logo size={88} />
        </div>
        <h1>FairSlot</h1>
        <p>{message}</p>
        <div className="loader-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </section>
  );
}
