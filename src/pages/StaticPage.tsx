import { Box, Button, Card, CardContent, Typography } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { STATIC_PAGES, type StaticSection, type StaticSlug } from '../../edge/content'
import { Prompt } from '../components/Retro'
import { usePageMeta } from '../lib/pageMeta'
import { useRetro } from '../lib/styleMode'

/** サイトについて・使い方ガイド・よくある質問・利用規約・プライバシーポリシー・著作権（本文は edge/content.ts） */
export default function StaticPage({ slug }: { slug: StaticSlug }) {
  const page = STATIC_PAGES[slug]
  usePageMeta({ title: page.title, description: page.description })

  return (
    <Box sx={{ maxWidth: 820, mx: 'auto' }}>
      <Prompt>cat ./{slug}.md</Prompt>
      <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 30 }, mb: 1 }}>
        {page.title}
      </Typography>
      {page.updated && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          最終更新：{page.updated}
        </Typography>
      )}
      <Card>
        <CardContent sx={{ px: { xs: 2, sm: 4 }, py: { xs: 2.5, sm: 4 } }}>
          <StaticSections sections={page.sections} />
          {slug === 'copyright' && (
            <Button component={RouterLink} to="/contact?category=copyright" variant="contained" sx={{ mt: 3 }}>
              削除依頼フォームへ
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  )
}

/** 固定ページの本文（見出し・段落・箇条書き・Q&A・関連リンク） */
export function StaticSections({ sections }: { sections: StaticSection[] }) {
  const retro = useRetro()
  return (
    <>
    {sections.map((sec) => (
      <Box component="section" key={sec.heading} sx={{ '& + &': { mt: 4 } }}>
        <Typography variant="h6" component="h2" sx={{ fontSize: 18, mb: 1.5 }}>
          {retro ? `## ${sec.heading}` : sec.heading}
        </Typography>
        {sec.paragraphs?.map((p, i) => (
          <Typography key={i} sx={{ lineHeight: 1.9, '& + &': { mt: 1.5 } }}>
            {p}
          </Typography>
        ))}
        {sec.list && (
          <Box component="ul" sx={{ pl: 3, my: 1.5, '& li': { lineHeight: 1.9, mb: 0.5 } }}>
            {sec.list.map((li, i) => (
              <li key={i}>{li}</li>
            ))}
          </Box>
        )}
        {sec.qa?.map((x) => (
          <Box key={x.q} sx={{ '& + &': { mt: 2.5 } }}>
            <Typography component="h3" sx={{ fontWeight: 700, lineHeight: 1.7, mb: 0.5 }}>
              {retro ? `> Q. ${x.q}` : `Q. ${x.q}`}
            </Typography>
            <Typography sx={{ lineHeight: 1.9, pl: { xs: 0, sm: 2 } }}>{`A. ${x.a}`}</Typography>
          </Box>
        ))}
        {sec.links && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
            {sec.links.map((l) => (
              <Button key={l.to} component={RouterLink} to={l.to} variant="outlined" size="small">
                {l.label}
              </Button>
            ))}
          </Box>
        )}
      </Box>
    ))}
    </>
  )
}
