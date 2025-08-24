import React, { createContext, useContext, useState, useCallback } from "react";

const LoaderContext = createContext({
  show: false,
  setShow: () => {},
  triggerLoader: () => {},
});

export const LoaderProvider = ({ children }) => {
  const [show, setShow] = useState(false);
  // Helper to show loader for a short time (e.g. during navigation)
  const triggerLoader = useCallback((ms = 900) => {
    setShow(true);
    setTimeout(() => setShow(false), ms);
  }, []);
  return (
    <LoaderContext.Provider value={{ show, setShow, triggerLoader }}>
      {children}
    </LoaderContext.Provider>
  );
};

export const useLoader = () => useContext(LoaderContext);