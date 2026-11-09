import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { usePageViewTracking } from './lib/analytics'
import { AddWorkPage, AdminPage, ContactPage, StaticPage, TagsPage } from './lazyPages'
import NotFoundPage from './pages/NotFoundPage'
import ThreadPage from './pages/ThreadPage'
import WorkDetailPage from './pages/WorkDetailPage'
import WorksPage from './pages/WorksPage'

export default function App() {
  usePageViewTracking()
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<WorksPage />} />
        <Route path="works/new" element={<AddWorkPage />} />
        <Route path="works/:id" element={<WorkDetailPage />} />
        <Route path="threads/:id" element={<ThreadPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="about" element={<StaticPage slug="about" />} />
        <Route path="terms" element={<StaticPage slug="terms" />} />
        <Route path="privacy" element={<StaticPage slug="privacy" />} />
        <Route path="copyright" element={<StaticPage slug="copyright" />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
