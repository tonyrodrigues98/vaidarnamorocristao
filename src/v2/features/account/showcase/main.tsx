import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { V2AccountShowcase } from "./V2AccountShowcase";
import "../styles.css";
import "./showcase.css";

const root = document.getElementById("root");
if (!root) throw new Error("Account showcase root was not found.");

createRoot(root).render(
  <StrictMode>
    <V2AccountShowcase />
  </StrictMode>,
);
