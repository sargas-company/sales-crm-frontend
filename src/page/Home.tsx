import {lazy, Suspense} from "react"
import {Route, Routes} from "react-router-dom"
import AppBar from "../components/appbar/AppBar"
// import Footer from "../components/footer/Footer";
import {Flex} from "../components/layout"
import AppLayout from "../components/layout/AppLayout"
import PageLoading from "../components/loading/PageLoading"
import Nav from "../components/nav/Nav"

const PageNotFound = lazy(() => import("./404/PageNotFound"));
const Analytics = lazy(() => import("./analytics"));
const Chat = lazy(() => import("./chat"));
const Proposal = lazy(() => import("./proposal"));
const Leads = lazy(() => import("./leads"));
const BaseKnowledge = lazy(() => import("./base-knowledge"));
const Platforms = lazy(() => import("./platforms"));
const Accounts = lazy(() => import("./accounts"));
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
              <Route path="/chats" element={<Chat />} />
              <Route path="/proposal/*" element={<Proposal />} />
              <Route path="/leads/*" element={<Leads />} />
              <Route path="/knowledge/*" element={<BaseKnowledge />} />
              <Route path="/platforms/*" element={<Platforms />} />
              <Route path="/accounts/*" element={<Accounts />} />
              <Route path="/*" element={<PageNotFound />} />
            </Routes>
          </Suspense>
        </main>
        {/*<Footer />*/}
      </Flex>

    </AppLayout>
  );
};
export default Home;
