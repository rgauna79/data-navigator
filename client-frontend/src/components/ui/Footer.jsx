import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 border-t border-gray-700/60 py-6 text-sm text-gray-500">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p>© {currentYear} Data Navigator. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <span>
            Built by{" "}
            <a
              href="https://github.com/rgauna79"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
            >
              Roberto Gauna
            </a>
          </span>
          <a
            href="mailto:rgauna@gmail.com"
            className="text-gray-400 hover:text-white transition-colors"
          >
            rgauna@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;