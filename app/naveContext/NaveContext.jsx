"use client";

import { createContext, useState } from "react";

export const Navecontext = createContext();

export default function NaveContext({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <Navecontext.Provider value={{ open, setOpen }}>
      {children}
    </Navecontext.Provider>
  );
}