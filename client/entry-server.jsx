import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import App from "./components/App";

// The angle brackets < /> are special React syntax that indicate you want to use a component, not just call a regular function.
export function render() {
  const html = renderToString(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  return { html };
}
