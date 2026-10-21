import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/common/AppLayout.jsx";
import GeneratorPage from "../pages/GeneratorPage.jsx";
import DecoderPage from "../pages/DecoderPage.jsx";
import VerifierPage from "../pages/VerifierPage.jsx";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <GeneratorPage />,
      },
      {
        path: "decode",
        element: <DecoderPage />,
      },
      {
        path: "verify",
        element: <VerifierPage />,
      },
    ],
  },
]);