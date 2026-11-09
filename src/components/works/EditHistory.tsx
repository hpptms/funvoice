import { Box, Button, Collapse, Stack } from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { api, getAdminToken, type WorkEdit } from '../../api/client'
import { describeEdit } from '../../lib/edits'
import { formatDateTime } from '../../lib/format'
import { useRetro } from '../../lib/styleMode'

/** 編集履歴の1行。管理者には「元に戻す」「この人の編集をまとめて戻す」を出す */
export function EditRow({ edit, onReverted, showWork }: { edit: WorkEdit; onReverted?: () => void; showWork?: boolean }) {
  const isAdmin = !!getAdminToken()
  const revert = useMutation({ mutationFn: () => api.admin.revertEdit(edit.id), onSuccess: () => onReverted?.() })
  const revertAll = useMutation({ mutationFn: () => api.admin.revertEditor(edit.id), onSuccess: () => onReverted?.() })
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ py: 1, gap: { xs: 0.5, sm: 1.5 }, alignItems: { sm: 'center' }, borderTop: 1, borderColor: 'divider', fontSize: 13 }}
    >
      <Box sx={{ flex: 1, minWidth: 0, color: edit.reverted ? 'text.disabled' : 'text.primary' }}>
        <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
          {formatDateTime(edit.createdAt, false)}
        </Box>
        <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
          {edit.isAdmin ? '管理者' : `ID:${edit.editorId}`}
        </Box>
        {showWork && (
          <Box component={RouterLink} to={`/works/${edit.workId}`} sx={{ mr: 1, color: 'secondary.main' }}>
            {edit.workTitle}
          </Box>
        )}
        <Box component="span" sx={{ textDecoration: edit.reverted ? 'line-through' : undefined }}>
          {describeEdit(edit)}
        </Box>
        {edit.reverted && (
          <Box component="span" sx={{ ml: 1, color: 'text.secondary' }}>
            （取り消し済み）
          </Box>
        )}
      </Box>
      {isAdmin && !edit.reverted && !edit.isAdmin && (
        <Stack direction="row" spacing={0.5}>
          <Button size="small" disabled={revert.isPending} onClick={() => revert.mutate()}>
            元に戻す
          </Button>
          <Button
            size="small"
            color="error"
            disabled={revertAll.isPending}
            onClick={() => confirm(`ID:${edit.editorId} と同じ回線からの直近7日の編集を、すべて元に戻しますか？`) && revertAll.mutate()}
          >
            この人の編集をまとめて戻す
          </Button>
        </Stack>
      )}
    </Stack>
  )
}

/** 作品ページの編集履歴（誰でも見られる） */
export default function EditHistory({ workId }: { workId: number }) {
  const retro = useRetro()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const { data } = useQuery({ queryKey: ['work-edits', workId], queryFn: () => api.listWorkEdits(workId) })
  const edits = data?.edits ?? []
  if (edits.length === 0) return null
  return (
    <Box sx={{ mt: 2 }}>
      <Button size="small" onClick={() => setOpen((v) => !v)} sx={{ px: 0.5, color: 'text.secondary' }}>
        {retro ? `$ git log（${edits.length}件）` : `編集履歴（${edits.length}件）`} {open ? '▲' : '▼'}
      </Button>
      <Collapse in={open}>
        <Box sx={{ mt: 0.5 }}>
          {edits.map((e) => (
            <EditRow
              key={e.id}
              edit={e}
              onReverted={() => {
                qc.invalidateQueries({ queryKey: ['work-edits', workId] })
                qc.invalidateQueries({ queryKey: ['work', workId] })
                qc.invalidateQueries({ queryKey: ['tags'] })
              }}
            />
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}
