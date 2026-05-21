import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "@/components/ui/sonner";
import AppRouter from "@/routes/AppRouter";
import "./index.css";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<AppRouter />
		<Toaster richColors position="top-right" />
	</StrictMode>
);
