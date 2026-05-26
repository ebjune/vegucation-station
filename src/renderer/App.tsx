import { BrowserRouter, Routes, Route, HashRouter } from 'react-router-dom'
import KioskLayout from './views/layouts/KioskLayout'
import Home from './views/customer/Home'
import ProduceBrowser from './views/customer/ProduceBrowser'
import ProduceDetail from './views/education/ProduceDetail'
import ItemSelector from './views/recipes/ItemSelector'
import RecipeResults from './views/recipes/RecipeResults'
import PinEntry from './views/seller/PinEntry'
import ProduceManager from './views/seller/ProduceManager'
import SellerRoute from './views/seller/SellerRoute'

// Use HashRouter for Electron compatibility (file:// protocol)
const Router = window.location.protocol === 'file:' ? HashRouter : BrowserRouter

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<KioskLayout />}>
          {/* Customer Routes */}
          <Route index element={<Home />} />
          <Route path="browse" element={<ProduceBrowser />} />
          <Route path="browse/:categoryId" element={<ProduceBrowser />} />
          <Route path="learn/:produceId" element={<ProduceDetail />} />
          <Route path="recipes" element={<ItemSelector />} />
          <Route path="recipes/results" element={<RecipeResults />} />

          {/* Seller Routes */}
          <Route path="seller" element={<PinEntry />} />
          <Route path="seller/manage" element={<SellerRoute><ProduceManager /></SellerRoute>} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
