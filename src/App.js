import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import AuthPage from "./pages/AuthPage"
import MembersPage from "./pages/MembersPage"
import AddMember from "./components/AddMember";
import EditMember from "./components/EditMember";
import AdminPanel from "./pages/AdminPanel";

function App() {
  return (
      <Router>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/members" element={<MembersPage />} />
            <Route path="/add-member" element={<AddMember />} />
            <Route path="/edit-member/:id" element={<EditMember />} />
            <Route path="/admin" element={<AdminPanel />}/>
          <Route path="*" element={<AuthPage />} />
        </Routes>
      </Router>
  )
}

export default App
