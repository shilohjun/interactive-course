import { HashRouter, Route, Routes } from "react-router-dom";
import { CourseMap } from "./map/CourseMap";
import { PlayerPage } from "./player/PlayerPage";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CourseMap />} />
        <Route path="/lecture/:id" element={<PlayerPage />} />
        <Route path="*" element={<CourseMap />} />
      </Routes>
    </HashRouter>
  );
}
