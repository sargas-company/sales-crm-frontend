import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { Provider } from "react-redux";
import store from "./store/store";
import { injectStore } from "./api/axiosInstance";
import "./index.css";

injectStore(store);
import Theme from "./theme/Theme";
import { BrowserRouter as Router } from "react-router-dom";

// MirageJS disabled — real backend is used instead
// import server from "./api/server";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <Theme>
        <Provider store={store}>
          <App />
        </Provider>
      </Theme>
    </Router>
  </React.StrictMode>
);
