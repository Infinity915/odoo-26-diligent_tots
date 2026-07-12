import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <div className="dark">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          {/* We will add dashboard routes later */}
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
