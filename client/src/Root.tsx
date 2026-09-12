import { useState } from "react";
import Landing from "./components/Landing";
import App from "./App";

const STORAGE_KEY = "flakfredag-started";

function hasStarted(): boolean {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function Root() {
  const [started, setStarted] = useState(hasStarted);

  const handleStart = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore (e.g. private browsing) — landing just reappears next load
    }
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

  return started ? <App onBack={handleBack} /> : <Landing onStart={handleStart} />;
}
