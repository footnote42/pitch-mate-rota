import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import "@fontsource-variable/bricolage-grotesque/opsz.css";
import "./index.css";
import "./styles/app.css";

// Theme is a per-phone preference; light (chalk on paper) unless the coach chose dark.
try {
  if (localStorage.getItem("theme") === "dark") document.documentElement.dataset.theme = "dark";
} catch {
  /* storage blocked: stay light */
}

createRoot(document.getElementById("root")!).render(<App />);
