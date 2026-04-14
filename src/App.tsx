import "./global.css";
import "./styles/table/Table.css";
import "./styles/modal/Modal.css";

import useTheme from "./theme/useTheme";
import GlobalStyle from "./global.styled";
import AppRoutes from "./routes/AppRoutes";
import AuthInitializer from "./components/auth/AuthInitializer";
import { ToastProvider } from "./context/toast/ToastContext";

const App = () => {
  const {
    theme: {
      mode,
      primaryColor: { color },
      skin,
    },
  } = useTheme();

  return (
    <ToastProvider>
      <GlobalStyle
        textColor={mode.textColor}
        backgroundColor={mode.background}
        foregroundColor={mode.foreground}
        mode={mode.name}
        skinColor={color}
        skin={skin}
      />
      <AuthInitializer />
      <AppRoutes />
    </ToastProvider>
  );
};
export default App;
