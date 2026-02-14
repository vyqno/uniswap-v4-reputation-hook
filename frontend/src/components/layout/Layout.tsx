import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

export function MarketingLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <main className="flex-1 ml-[260px] transition-all duration-200">
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export function RootLayout() {
  const location = useLocation();
  const isAppRoute = location.pathname.startsWith("/dashboard") || 
                     location.pathname.startsWith("/register") ||
                     location.pathname.startsWith("/reputation") ||
                     location.pathname.startsWith("/fees") ||
                     location.pathname.startsWith("/withdraw") ||
                     location.pathname.startsWith("/history") ||
                     location.pathname.startsWith("/stats");

  if (isAppRoute) {
    return <AppLayout />;
  }

  return <MarketingLayout />;
}
