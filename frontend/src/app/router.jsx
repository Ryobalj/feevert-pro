import { createBrowserRouter } from "react-router-dom";

// Pages (MATCH ACTUAL STRUCTURE)
import Home from "../features/home/pages/HomePage";

import Login from "../features/accounts/pages/LoginPage";
import Register from "../features/accounts/pages/RegisterPage";

// later unaweza kuwa na DashboardPage
import Dashboard from "../features/dashboard/pages/Dashboard";

// Guards
import ProtectedRoute from "../components/layout/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
]);