import { useLocation, useEffect } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    document.title = "Page Not Found";
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div id="main-content" className="flex min-h-screen items-center justify-center bg-muted">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
