import AddIcon from '@mui/icons-material/Add'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Link,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  type Theme,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { api, type ThreadSort } from '../../api/client'
import { formatRelative } from '../../lib/format'
import { useRetro } from '../../lib/styleMode'
import { Window } from '../Retro'
import PostForm, { type PostInput } from './PostForm'

const SORT_LABEL: Record<ThreadSort, string> = { active: '最新コメント', new: '新着', popular: 'コメント数' }

/** 作品ページの「掲示板」：トピック一覧と、トピックを立てるボタン */
export default function ThreadSection({ workId, workTitle }: { workId: number; workTitle: string }) {
  const retro = useRetro()
  const [sort, setSort] = useState<ThreadSort>('active')
  const [creating, setCreating] = useState(false)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['threads', workId, sort],
    queryFn: () => api.listThreads(workId, sort),
  })

  return (
    <Window file="bbs/" title="語りたい人の掲示板">
      {/* スマホ: ボタン → タブ（全幅）の2段 / タブレット以上: 横並び */}
      <Stack direction={{ xs: 'column-reverse', sm: 'row' }} sx={{ alignItems: { xs: 'stretch', sm: 'center' }, gap: 1, mb: 1 }}>
        <Tabs
          value={sort}
          onChange={(_, v: ThreadSort) => setSort(v)}
          variant="fullWidth"
          sx={{ flex: 1, minHeight: 44, '& .MuiTab-root': { minHeight: 44, px: 1, fontSize: { xs: 13, sm: 14 } } }}
        >
          {(Object.keys(SORT_LABEL) as ThreadSort[]).map((s) => (
            <Tab key={s} value={s} label={SORT_LABEL[s]} />
          ))}
        </Tabs>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreating(true)} sx={{ height: 44, flexShrink: 0 }}>
          トピックを立てる
        </Button>
      </Stack>

      {isLoading && <CircularProgress size={24} sx={{ m: 2 }} />}
      {isError && <Alert severity="error">{(error as Error).message}</Alert>}
      {data && data.threads.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
          {retro ? '> まだトピックがありません。最初のトピックを立てよう' : 'まだトピックがありません。最初のトピックを立ててみましょう。'}
        </Typography>
      )}

      <Box component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {data?.threads.map((t) => (
          <Box component="li" key={t.id} sx={{ borderTop: 1, borderColor: 'divider' }}>
            <Link
              component={RouterLink}
              to={`/threads/${t.id}`}
              underline="none"
              color="inherit"
              sx={{ display: 'block', py: 1.5, px: 0.5, '&:hover .title': { color: 'primary.main' } }}
            >
              <Stack direction="row" sx={{ gap: 1, alignItems: 'baseline' }}>
                <Typography className="title" sx={{ flex: 1, fontWeight: 700, fontSize: 16, minWidth: 0 }}>
                  {t.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'primary.main', whiteSpace: 'nowrap', fontWeight: 700 }}>
                  {t.postCount}
                  <Box component="span" sx={{ fontSize: 12, ml: 0.25 }}>
                    コメント
                  </Box>
                </Typography>
              </Stack>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.25, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {t.excerpt.replace(/\s+/g, ' ')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                最終コメント {formatRelative(t.lastPostedAt)}
              </Typography>
            </Link>
          </Box>
        ))}
      </Box>

      <CreateThreadDialog workId={workId} workTitle={workTitle} open={creating} onClose={() => setCreating(false)} />
    </Window>
  )
}

function CreateThreadDialog({
  workId,
  workTitle,
  open,
  onClose,
}: {
  workId: number
  workTitle: string
  open: boolean
  onClose: () => void
}) {
  const fullScreen = useMediaQuery((t: Theme) => t.breakpoints.down('sm'))
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const mutation = useMutation({
    mutationFn: (input: PostInput) => api.createThread(workId, { title: title.trim(), ...input }),
    onSuccess: ({ thread }) => {
      qc.invalidateQueries({ queryKey: ['threads', workId] })
      onClose()
      navigate(`/threads/${thread.id}`)
    },
  })

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 6 }}>
        トピックを立てる
        <Typography variant="body2" color="text.secondary">
          {workTitle}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="タイトル"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            slotProps={{ htmlInput: { maxLength: 60 } }}
            helperText={`${[...title].length} / 60文字`}
            autoFocus
          />
          <PostForm
            body={body}
            onBodyChange={setBody}
            onSubmit={(input) => mutation.mutateAsync(input)}
            submitLabel="トピックを立てる"
            extraValid={title.trim() !== ''}
          />
          <Button onClick={onClose} sx={{ alignSelf: 'flex-start' }}>
            キャンセル
          </Button>
        </Stack>
      </DialogContent>
    </Dialog>
  )
}
