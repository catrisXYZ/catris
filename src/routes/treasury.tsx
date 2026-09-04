import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/treasury")({
  beforeLoad: () => {
    throw redirect({ to: "/house", search: { room: "bowl" } });
  },
  component: () => null,
});
