import { Route, Routes } from "react-router-dom"
import AppContainer from './components/AppContainer';
import Home from './pages/Home';

function App() {

  return (
    <>
      <Routes>
        <Route path="/" element={<AppContainer />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
