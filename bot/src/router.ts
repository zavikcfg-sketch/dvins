import { useEffect, useState } from "react";

export type Route = "home" | "rooms" | "admin";

function parse(): Route {
  const hash = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  if (hash === "rooms") return "rooms";
  if (hash === "admin") return "admin";
  return "home";
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() =>
    typeof window === "undefined" ? "home" : parse(),
  );

  useEffect(() => {
    const onChange = () => {
      setRoute(parse());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

export function navigate(route: Route) {
  window.location.hash = route === "home" ? "/" : `/${route}`;
}
