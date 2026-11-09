import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { api } from '../../api/client'

const REASONS = ['誹謗中傷・個人攻撃', '個人情報の掲載', '著作権の侵害（無断転載など）', 'スパム・宣伝', 'ネタバレ', 'その他']

export default function ReportDialog({
  postId,
  no,
  open,
  onClose,
  onDone,
}: {
  postId: number
  no: number
  open: boolean
  onClose: () => void
  onDone: () => void
}) {
  const [reason, setReason] = useState(REASONS[0])
  const mutation = useMutation({
    mutationFn: () => api.reportPost(postId, reason),
    onSuccess: () => {
      onDone()
      onClose()
    },
  })
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{no}番のコメントを通報</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          削除すべき不適切なコメントとして運営に通報します。理由を選んでください。
        </Typography>
        <RadioGroup value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <FormControlLabel key={r} value={r} control={<Radio />} label={r} />
          ))}
        </RadioGroup>
        {mutation.isError && <Alert severity="error">{(mutation.error as Error).message}</Alert>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" color="error" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          通報する
        </Button>
      </DialogActions>
    </Dialog>
  )
}
