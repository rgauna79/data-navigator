import React from "react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-auto">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Lado Izquierdo: Copyright */}
          <div className="text-gray-500 text-xs font-medium">
            © {currentYear}{" "}
            <span className="text-gray-300 font-bold">Data Navigator</span>.
            <span className="hidden sm:inline"> All rights reserved.</span>
          </div>

          {/* Lado Derecho: Créditos y Contacto */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">
                Developer
              </span>
              <a
                href="https://github.com/rgauna79"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 font-bold transition-colors"
              >
                Roberto Gauna
              </a>
            </div>

            <div className="h-4 w-px bg-gray-800 hidden md:block"></div>

            <a
              href="mailto:rgauna@gmail.com"
              className="text-gray-500 hover:text-white transition-colors flex items-center gap-2"
            >
              <span className="text-gray-600 font-bold uppercase tracking-widest text-[10px]">
                Contact
              </span>
              <span className="font-medium">rgauna@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
