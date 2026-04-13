import {lazy, Suspense} from "react"
import {Route, Routes} from "react-router-dom"
import AppBar from "../components/appbar/AppBar"
import {Flex} from "../components/layout"
import AppLayout from "../components/layout/AppLayout"
import PageLoading from "../components/loading/PageLoading"
import Nav from "../components/nav/Nav"
const Dashboard = lazy(() => import("./dashboard/Dashboard"));


const PageNotFound = lazy(() => import("./404/PageNotFound"));

const Chat = lazy(() => import("./chat"));

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
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/apps/chat/*" element={<Chat />} />
              <Route path="/*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </main>
      </Flex>

    </AppLayout>
  );
};
export default Home;
