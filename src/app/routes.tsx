import { createBrowserRouter } from "react-router";
import { Layout } from "./Layout";
import { Login } from "./screens/Login";
import { Dashboard } from "./screens/Dashboard";
import { ProfileSetup } from "./screens/ProfileSetup";
import { BuddyDirectory } from "./screens/BuddyDirectory";
import { SpotDirectory } from "./screens/SpotDirectory";
import { RecommendSpot } from "./screens/RecommendSpot";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Login,
  },
  {
    path: "/",
    Component: Layout,
    children: [
      { path: "dashboard", Component: Dashboard },
      { path: "profile", Component: ProfileSetup },
      { path: "buddies", Component: BuddyDirectory },
      { path: "spots", Component: SpotDirectory },
      { path: "spots/recommend", Component: RecommendSpot },
    ],
  },
]);
