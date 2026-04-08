import { createBrowserRouter } from "react-router";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { CreateBounty } from "./pages/CreateBounty";
import { BountyListings } from "./pages/BountyListings";
import { BountyDetails } from "./pages/BountyDetails";
import { DisputePage } from "./pages/DisputePage";
import { AppLayout } from "./components/AppLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LandingPage,
  },
  {
    path: "/app",
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: "create", Component: CreateBounty },
      { path: "bounties", Component: BountyListings },
      { path: "bounties/:id", Component: BountyDetails },
      { path: "disputes", Component: DisputePage },
      { path: "disputes/:id", Component: DisputePage },
    ],
  },
]);
