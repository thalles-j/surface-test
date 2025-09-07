import React, { useState, useEffect } from "react";
import { Search, Moon, ShoppingCart, User } from "lucide-react";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? "bg-white shadow-md" : "bg-transparent"}`}>
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 py-3">
        <nav className="flex gap-6 text-sm font-medium">
          <a href="#" className="hover:text-blue-500">New</a>
          <a href="#" className="hover:text-blue-500">Exclusiv</a>
          <a href="#" className="hover:text-blue-500">Futebol</a>
          <a href="#" className="hover:text-blue-500">Comunidade</a>
          <a href="#" className="hover:text-blue-500">Sobre</a>
        </nav>

        <div className="text-xl font-bold">LOGO</div>

        <div className="flex items-center gap-5">
          <Search className="cursor-pointer hover:text-blue-500" />
          <Moon className="cursor-pointer hover:text-blue-500" />
          <User className="cursor-pointer hover:text-blue-500" />
          <ShoppingCart className="cursor-pointer hover:text-blue-500" />
        </div>
      </div>
    </header>
  );
}
