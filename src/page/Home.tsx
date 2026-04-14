import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import AppBar from "../components/appbar/AppBar";
// import Footer from "../components/footer/Footer";
const ThemeCustomizer = lazy(
  () => import("../components/customizer/Customizer")
);
import { Flex } from "../components/layout";
import AppLayout from "../components/layout/AppLayout";
import PageLoading from "../components/loading/PageLoading";
import Nav from "../components/nav/Nav";
const PageNotFound = lazy(() => import("./404/PageNotFound"));
const Analytics = lazy(() => import("./analytics"));
// const Charts = lazy(() => import("./charts/Charts"));
const Chat = lazy(() => import("./chat"));
// const Email = lazy(() => import("./email"));
const Invoice = lazy(() => import("./invoice"));
// const Pages = lazy(() => import("./pages/Pages"));
// const Users = lazy(() => import("./users"));
// const CardPages = lazy(() => import("./card-pages/index"));
const Home = () => {
  return (
    <AppLayout>
      <Nav />
      <Flex direction="column" styles={{ minHeight: "100vh" }}>
        <AppBar />
        <main
          style={{
            padding: `1.2rem`,
            width: "100%",
            flex: 1,
            marginTop: "1rem",
          }}
        >
          <Suspense fallback={<PageLoading />}>
            <Routes>
              <Route index element={<Analytics />} />
              <Route path="/dashboards/analytics/" element={<Analytics />} />
              {/*<Route path="/apps/email/*" element={<Email />} />*/}
              <Route path="/apps/chat/*" element={<Chat />} />
              <Route path="/proposal/*" element={<Invoice />} />
              {/*<Route path="/user/*" element={<Users />} />*/}
              {/*<Route path="/pages/*" element={<Pages />} />*/}
              {/*<Route path="/charts/*" element={<Charts />} />*/}
              {/*<Route path="/ui/cards/*" element={<CardPages />} />*/}
              <Route path="/*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </main>
        {/*<Footer />*/}
      </Flex>
      <Suspense fallback={null}>
        <ThemeCustomizer />
      </Suspense>
    </AppLayout>
  );
};
export default Home;
