import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Trash2, Bookmark } from "lucide-react";
import type { SavedRoute } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function SavedRoutesList() {
  const { toast } = useToast();
  const { data: routes = [], isLoading } = useQuery<SavedRoute[]>({
    queryKey: ["/api/saved-routes"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/saved-routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/saved-routes"] });
      toast({ description: "Saved route removed." });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1].map((i) => (
          <div key={i} className="h-14 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4" data-testid="text-no-saved-routes">
        No saved routes yet. Run a plan and save it to keep it here.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2" data-testid="saved-routes-list">
      {routes.map((route) => (
        <div
          key={route.id}
          className="flex items-center justify-between gap-3 rounded-md border border-card-border px-3 py-2.5"
          data-testid={`row-saved-route-${route.id}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Bookmark className="h-4 w-4 text-primary shrink-0" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium truncate" data-testid={`text-saved-label-${route.id}`}>
                {route.label}
              </span>
              <span className="text-xs text-muted-foreground truncate">
                {route.spotName} · {new Date(route.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => deleteMutation.mutate(route.id)}
            disabled={deleteMutation.isPending}
            data-testid={`button-delete-saved-${route.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
