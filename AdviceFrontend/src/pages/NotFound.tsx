import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4"
    >
      <div className="text-center">
        <h1 className="text-7xl font-extrabold text-purple-400 mb-4">404</h1>
        <h2 className="text-2xl text-white font-bold mb-2">הגעת לקומה שלא קיימת</h2>
        <p className="text-gray-400 mb-6">
          המעלית עצרה בקומה הלא נכונה... הדף שחיפשת פשוט לא נמצא 🤷‍♂️
        </p>
        <a
          href="/"
          className="inline-block rounded-md bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-2 text-white font-medium shadow hover:from-purple-700 hover:to-pink-700 transition"
        >
          חזרה ללובי
        </a>
      </div>
    </div>
  );
};

export default NotFound;
