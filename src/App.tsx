import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter, ScrollRestoration, Outlet } from "react-router-dom";
import Index from "./pages/Index";
import Article from "./pages/Article";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Layout component with scroll restoration
const Layout = () => (
  <>
    <ScrollRestoration />
    <Outlet />
  </>
);

// SỬA TẠI ĐÂY: Thêm tham số thứ 2 là { basename: "/mimihoalua" }
const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Index />,
      },
      {
        path: "/article/:slug",
        element: <Article />,
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
], {
  basename: "/mimihoalua",
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <RouterProvider router={router} />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
