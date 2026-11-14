import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import { usePageViewTracking } from './lib/analytics'
import {
  AddWorkPage,
  AdminPage,
  AuthPage,
  ContactPage,
  FinalesPage,
  MyPage,
  NotificationsPage,
  RankingPage,
  SequelsPage,
  StaticPage,
  SupporterPage,
  TagsPage,
} from './lazyPages'
import NotFoundPage from './pages/NotFoundPage'
import ThreadPage from './pages/ThreadPage'
import WorkDetailPage from './pages/WorkDetailPage'
import WorksPage, { SeasonWorksPage, TagWorksPage } from './pages/WorksPage'

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
        <Route path="tags/:id" element={<TagWorksPage />} />
        <Route path="season/:slug" element={<SeasonWorksPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="ranking/:kind" element={<RankingPage />} />
        <Route path="ranking/:kind/:season" element={<RankingPage />} />
        <Route path="about" element={<StaticPage slug="about" />} />
        <Route path="help" element={<StaticPage slug="help" />} />
        <Route path="faq" element={<StaticPage slug="faq" />} />
        <Route path="terms" element={<StaticPage slug="terms" />} />
        <Route path="privacy" element={<StaticPage slug="privacy" />} />
        <Route path="copyright" element={<StaticPage slug="copyright" />} />
        <Route path="tokushoho" element={<StaticPage slug="tokushoho" />} />
        <Route path="guidelines" element={<StaticPage slug="guidelines" />} />
        <Route path="news" element={<StaticPage slug="news" />} />
        <Route path="supporter" element={<SupporterPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="register" element={<AuthPage key="register" mode="register" />} />
        <Route path="login" element={<AuthPage key="login" mode="login" />} />
        <Route path="mypage" element={<MyPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="finales" element={<FinalesPage />} />
        <Route path="sequels" element={<SequelsPage />} />
        <Route path="admin" element={<AdminPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
