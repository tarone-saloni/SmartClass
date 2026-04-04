import { createContext, useContext } from "react";

export const themes = {
  light: "light",
  dark: "dark",
};

export const ThemeContext = createContext({
  themeName: themes.light,
  setThemeName: () => {},
  themes,
});

export const useTheme = () => useContext(ThemeContext);
