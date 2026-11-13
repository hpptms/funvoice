import { Pagination } from '@mui/material'

/** 一覧のページ送り（1ページに収まるときは出さない） */
export default function Pager({ total, perPage, page, onChange }: { total: number; perPage: number; page: number; onChange: (p: number) => void }) {
  const count = Math.ceil(total / perPage)
  if (count <= 1) return null
  return (
    <Pagination
      count={count}
      page={page}
      onChange={(_, p) => {
        onChange(p)
        window.scrollTo({ top: 0 })
      }}
      sx={{ mt: 2, '& ul': { justifyContent: 'center' } }}
    />
  )
}
