import { createFileRoute } from "@tanstack/react-router";

import { DesignLabPage } from "../lab/DesignLabPage";

export const Route = createFileRoute("/design-lab")({
  component: DesignLabPage,
});
