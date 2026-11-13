import { Alert, Box, Button, Stack, TextField, Typography } from '@mui/material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api, type Work } from '../../api/client'

/** 管理者用: この作品の続編の発表を登録する（Annict にまだ無い発表など）。登録すると投票・予想した人に通知が届く */
export default function AdminSequelForm({ work }: { work: Work }) {
  const qc = useQueryClient()
  const [sequelId, setSequelId] = useState('')
  const [note, setNote] = useState('')
  const create = useMutation({
    mutationFn: () => api.admin.createSequel({ baseWorkId: work.id, sequelWorkId: sequelId ? Number(sequelId) : undefined, note }),
    onSuccess: () => {
      setSequelId('')
      setNote('')
      qc.invalidateQueries({ queryKey: ['work', work.id] })
    },
  })
  const validId = sequelId === '' || /^[1-9]\d{0,17}$/.test(sequelId)
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        続編の発表を登録（続編希望に投票・予想した人に通知が届きます）
      </Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <TextField
          size="small"
          label="続編の作品ID（任意）"
          value={sequelId}
          onChange={(e) => setSequelId(e.target.value.trim())}
          error={!validId}
          sx={{ width: { sm: 180 } }}
        />
        <TextField
          size="small"
          label="メモ（例: 2027年放送決定）"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 100 } }}
          sx={{ flex: 1 }}
        />
        <Button
          variant="outlined"
          disabled={!validId || create.isPending || (!sequelId && !note.trim())}
          onClick={() => confirm('続編の発表として登録し、通知を送りますか？') && create.mutate()}
        >
          登録
        </Button>
      </Stack>
      {create.isError && <Alert severity="error" sx={{ mt: 1 }}>{(create.error as Error).message}</Alert>}
      {create.isSuccess && <Alert severity="success" sx={{ mt: 1 }}>登録しました</Alert>}
    </Box>
  )
}
