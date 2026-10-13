import { Toaster } from "@/components/ui/toaster";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Collection from "./pages/Collection";
import NotFound from "./pages/NotFound";
import Study from "./pages/Study";

/**
 * A data router supports React Router's official navigation blocker.
 * Unsaved writing must be protected for links and browser Back/Forward.
 */
const router = createBrowserRouter(
  [
    { path: "/", element: <Landing /> },
    { path: "/write", element: <Index /> },
    { path: "/collection", element: <Collection /> },
    { path: "/study", element: <Study /> },
    { path: "*", element: <NotFound /> },
  ],
  { basename: import.meta.env.BASE_URL },
);

export default function App() {
  return (
    <>
      <Toaster />
      <RouterProvider router={router} />
    </>
  );
}
