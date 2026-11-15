import { createFileRoute } from "@tanstack/react-router";

import { UiLabPage } from "../components/UiLabPage";

export const Route = createFileRoute("/_chat/ui-lab")({
  component: UiLabPage,
});
