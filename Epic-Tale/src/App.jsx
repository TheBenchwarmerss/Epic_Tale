import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Home from './pages/Home';
import AddMedia from './pages/AddMedia';
import MediaDetail from './pages/MediaDetail';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="add" element={<AddMedia />} />
          <Route path="detail/:id" element={<MediaDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}