import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import App from "./App";
import "./styles.css";

const router = createBrowserRouter([{ path: "*", element: <AuthProvider><App /></AuthProvider> }]);
createRoot(document.getElementById("root")!).render(<StrictMode><RouterProvider router={router} /></StrictMode>);
