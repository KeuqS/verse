import "@fontsource/crimson-text/latin-400.css";
import "@fontsource/crimson-text/latin-400-italic.css";
import "@fontsource/crimson-text/latin-600.css";
import "@fontsource/crimson-text/latin-600-italic.css";
import "@fontsource/crimson-text/latin-700.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import "@fontsource/ibm-plex-mono/latin-500.css";
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(<App />);
