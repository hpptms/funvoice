import { Typography } from '@mui/material'
import type { ReactNode } from 'react'

export default function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center', fontSize: 14 }}>
      {children}
    </Typography>
  )
}
