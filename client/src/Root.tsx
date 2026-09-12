import { useState } from "react";
import Landing from "./components/Landing";
import PasswordModal from "./components/PasswordModal";
import BackgroundDecor from "./components/BackgroundDecor";
import App from "./App";
import { clearAuth, hasStoredAuth } from "./auth";

const STORAGE_KEY = "flakfredag-started";

function hasStarted(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function markStarted() {
  try {
    sessionStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // ignore (e.g. private browsing) — landing just reappears next load
  }
}

export default function Root() {
  const [started, setStarted] = useState(() => hasStarted() && hasStoredAuth());
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const handleStartClick = () => {
    if (hasStoredAuth()) {
      markStarted();
      setStarted(true);
    } else {
      setShowPasswordModal(true);
    }
  };

  const handleAuthenticated = () => {
    markStarted();
    setShowPasswordModal(false);
    setStarted(true);
  };

  const handleBack = () => {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setStarted(false);
  };

  // Om en API-förfrågan i appen plötsligt får 401 (t.ex. lösenordet har
  // bytts på servern) — skicka tillbaka till startsidan och be om lösenordet igen.
  const handleAuthError = () => {
    clearAuth();
    handleBack();
    setShowPasswordModal(true);
  };

  return (
    <>
      <BackgroundDecor />

      {started ? (
        <App onBack={handleBack} onAuthError={handleAuthError} />
      ) : (
        <Landing onStart={handleStartClick} />
      )}

      {showPasswordModal && (
        <PasswordModal onSuccess={handleAuthenticated} onClose={() => setShowPasswordModal(false)} />
      )}
    </>
  );
}
