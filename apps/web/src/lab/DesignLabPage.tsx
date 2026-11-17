import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { isElectron } from "../env";
import { setGridShown, useGridShown } from "../lib/gridOverlay";
import { cn } from "../lib/utils";
import { Button } from "../components/ui/button";
import { Switch } from "../components/ui/switch";
import { LabComponents } from "./LabComponents";
import { DEFAULT_ROOTS, RootsPanel, rootsStyle, type Roots } from "./LabRoots";
import { LabScreens } from "./LabScreens";
import { LabType } from "./LabType";

// The grid as a playground, as a page of its own outside the app shell: roots on the left; on the
// right, screens and primitives built from rings, with the grid drawn over them.

export function DesignLabPage() {
  const [roots, setRoots] = useState<Roots>(DEFAULT_ROOTS);
  const gridShown = useGridShown();

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- the lab opens with the grid drawn on the html element and takes it away when it unmounts
  useEffect(() => {
    setGridShown(true);
    return () => setGridShown(false);
  }, []);

  return (
    <div
      data-system-scope=""
      style={rootsStyle(roots)}
      className="flex h-dvh min-h-0 flex-col bg-background text-ink-1"
    >
      {/* The window's titlebar: draggable, and clear of the macOS window buttons. */}
      <header
        className={cn(
          "drag-region flex h-(--workspace-topbar-height) shrink-0 items-center gap-2 border-b border-(--level-line) px-4",
          isElectron && "ps-20",
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Back to the app"
          className="app-region-no-drag"
          render={<Link to="/" />}
        >
          <ArrowLeftIcon />
        </Button>
        <h1 className="text-heading">Design lab</h1>
        <label className="app-region-no-drag ms-auto flex items-center gap-2 text-body">
          Show grid
          <Switch checked={gridShown} onCheckedChange={setGridShown} />
        </label>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="scrollbar-gutter-both w-72 shrink-0 overflow-y-auto border-e border-(--level-line) p-6">
          <RootsPanel roots={roots} onChange={setRoots} />
        </aside>
        <main className="scrollbar-gutter-both min-h-0 flex-1 overflow-y-auto">
          <div className="flex max-w-5xl flex-col gap-6 p-6">
            <LabScreens />
            <LabType version={JSON.stringify(roots)} />
            <LabComponents />
          </div>
        </main>
      </div>
    </div>
  );
}
