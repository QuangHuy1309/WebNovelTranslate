"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  fontSize: number;
  setFontSize: (size: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(16);

  useEffect(() => {
    // Sử dụng setTimeout(..., 0) để đưa việc cập nhật state vào hàng đợi bất đồng bộ,
    // giúp tránh lỗi "Calling setState synchronously" của React.
    const timer = setTimeout(() => {
      const savedTheme = localStorage.getItem("theme");
      const savedFontSize = localStorage.getItem("fontSize");
      
      if (savedTheme === "dark") {
        setIsDarkMode(true);
      }
      
      if (savedFontSize) {
        setFontSize(Number(savedFontSize));
      }
    }, 0);

    // Dọn dẹp timer khi component unmount
    return () => clearTimeout(timer);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => {
      const newTheme = !prev;
      localStorage.setItem("theme", newTheme ? "dark" : "light");
      return newTheme;
    });
  };

  const updateFontSize = (size: number) => {
    setFontSize(size);
    localStorage.setItem("fontSize", size.toString());
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, fontSize, setFontSize: updateFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme phải được bọc bên trong ThemeProvider");
  }
  return context;
}