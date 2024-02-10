import React from "react";

function Footer() {
  //get current year
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="sticky bottom-0 text-center py-3 bg-gray-800 text-white w-full"
      id="footerContainer"
    >
      <p id="footerText">
        Copyright &copy; <span>{currentYear}</span>. All rights reserved.
      </p>
      <p id="footerText">
        Developed by: <a href="https://github.com/rgauna79">Roberto Gauna</a>
      </p>
      <p id="footerText">
        Contact: <a href="mailto:rgauna@gmail.com">rgauna@gmail.com</a>
      </p>
    </footer>
  );
}

export default Footer;
