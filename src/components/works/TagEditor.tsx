import AddIcon from '@mui/icons-material/Add'
import CancelIcon from '@mui/icons-material/Cancel'
import LockIcon from '@mui/icons-material/Lock'
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  Popover,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { TAG_KIND_LABEL, api, getAdminToken, type SeasonInput, type Tag, type TagKind, type Work } from '../../api/client'
import { EMPTY_SEASON, seasonNameLabel, seasonValueLabel, toSeasonInput, type SeasonValue } from '../../lib/season'
import { useRetro } from '../../lib/styleMode'
import SeasonSelect from './SeasonSelect'

type AddInput = { tagId: number } | { name: string; kind: TagKind } | SeasonInput

/**
 * 作品のタグ。放送時期／原作・掲載誌／ジャンルの行ごとに「＋」ボタンがあり、押すとその種類のタグを直接追加できる。
 * 誰でも付け外しでき、編集はすべて履歴に残り、管理者が元に戻せる。
 * 作品にもともと登録されている放送時期と、ロック中の作品は管理者だけが編集できる。
 */
export default function TagEditor({ work }: { work: Work }) {
  const retro = useRetro()
  const qc = useQueryClient()
  const isAdmin = !!getAdminToken()
  const canEdit = !work.locked || isAdmin
  const [adding, setAdding] = useState<{ kind: TagKind; anchor: HTMLElement } | null>(null)
  const [undo, setUndo] = useState<Tag | null>(null)
  const originalSeason = seasonNameLabel(work.seasonName)

  const onChanged = (tags: Tag[]) => {
    qc.setQueryData<Work>(['work', work.id], (old) => old && { ...old, tags })
    qc.invalidateQueries({ queryKey: ['work-edits', work.id] })
    qc.invalidateQueries({ queryKey: ['works'] })
    qc.invalidateQueries({ queryKey: ['tags'] })
  }

  const add = useMutation({
    mutationFn: (v: AddInput) => (isAdmin && 'tagId' in v ? api.admin.attachTag(work.id, v.tagId) : api.addWorkTag(work.id, v)),
    onSuccess: ({ tags }) => {
      onChanged(tags)
      setAdding(null)
    },
  })
  const remove = useMutation({
    mutationFn: (tag: Tag) => (isAdmin ? api.admin.detachTag(work.id, tag.id) : api.removeWorkTag(work.id, tag.id)),
    onSuccess: ({ tags }, tag) => {
      onChanged(tags)
      setUndo(tag)
    },
  })

  // 放送時期・原作・ジャンルは、タグが無くても行を出して「＋」から追加できるようにする
  const kinds: TagKind[] = ['season', 'source', 'genre']
  if (work.tags.some((t) => t.kind === 'other')) kinds.push('other')

  return (
    <Box>
      <Stack spacing={1.5}>
        {kinds.map((kind) => {
          const tags = work.tags.filter((t) => t.kind === kind)
          return (
            <Stack key={kind} direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary" sx={{ width: { xs: '100%', sm: 96 }, flexShrink: 0 }}>
                {TAG_KIND_LABEL[kind]}
                {retro && ':'}
              </Typography>
              {tags.map((t) => {
                const protectedSeason = kind === 'season' && t.name === originalSeason && !isAdmin
                const removable = canEdit && !protectedSeason
                return (
                  <Chip
                    key={t.id}
                    label={`#${t.name}`}
                    component={RouterLink}
                    to={`/?tag=${t.id}`}
                    clickable
                    disabled={remove.isPending && remove.variables?.id === t.id}
                    onDelete={
                      removable
                        ? (e: React.SyntheticEvent) => {
                            // タグ自体はリンクなので、×を押したときはページ移動させない
                            e.preventDefault()
                            remove.mutate(t)
                          }
                        : undefined
                    }
                    deleteIcon={<CancelIcon aria-label={`タグ「${t.name}」を外す`} />}
                  />
                )
              })}
              {canEdit && (
                <Tooltip title={`${TAG_KIND_LABEL[kind]}のタグを追加`}>
                  <IconButton
                    size="small"
                    aria-label={`${TAG_KIND_LABEL[kind]}のタグを追加`}
                    onClick={(e) => {
                      add.reset()
                      setAdding({ kind, anchor: e.currentTarget })
                    }}
                    sx={{
                      width: 34,
                      height: 34,
                      border: retro ? 2 : 1,
                      borderStyle: 'dashed',
                      borderColor: 'divider',
                      borderRadius: retro ? 0 : '50%',
                      color: 'primary.main',
                      '@media (pointer: coarse)': { width: 40, height: 40 },
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
              {tags.length === 0 && !canEdit && (
                <Typography variant="body2" color="text.secondary">
                  なし
                </Typography>
              )}
            </Stack>
          )
        })}
      </Stack>

      {canEdit ? (
        <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5 }}>
          {retro && '// '}
          「＋」でタグを追加、「×」で外せます。誰でも編集でき、変更は下の履歴に残ります。
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <LockIcon fontSize="small" /> この作品のタグは、管理者によって編集がロックされています
        </Typography>
      )}
      {remove.isError && (
        <Alert severity="error" sx={{ mt: 1 }} onClose={() => remove.reset()}>
          {(remove.error as Error).message}
        </Alert>
      )}

      <Popover
        open={!!adding}
        anchorEl={adding?.anchor}
        onClose={() => setAdding(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        slotProps={{ paper: { sx: { p: 2, width: 'min(340px, calc(100vw - 32px))' } } }}
      >
        {adding && (
          <>
            <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
              {TAG_KIND_LABEL[adding.kind]}のタグを追加
            </Typography>
            {adding.kind === 'season' ? (
              <SeasonPicker pending={add.isPending} onAdd={(v) => add.mutate(v)} />
            ) : (
              <TagPicker kind={adding.kind} attached={work.tags} pending={add.isPending} onAdd={(v) => add.mutate(v)} />
            )}
            {add.isError && (
              <Alert severity="error" sx={{ mt: 1 }}>
                {(add.error as Error).message}
              </Alert>
            )}
          </>
        )}
      </Popover>

      <Snackbar
        open={!!undo}
        autoHideDuration={6000}
        onClose={() => setUndo(null)}
        message={undo ? `タグ「${undo.name}」を外しました` : ''}
        action={
          <Button
            color="secondary"
            size="small"
            onClick={() => {
              if (undo) add.mutate({ tagId: undo.id })
              setUndo(null)
            }}
          >
            元に戻す
          </Button>
        }
      />
    </Box>
  )
}

/**
 * 原作・掲載誌／ジャンル／その他: 入力欄の下に、その種類の既存タグを候補ボタンとして並べる。
 * （ドロップダウンだとポップアップと重なって表示されるため、候補はポップアップの中に直接並べる）
 */
function TagPicker({ kind, attached, pending, onAdd }: { kind: TagKind; attached: Tag[]; pending: boolean; onAdd: (v: AddInput) => void }) {
  const retro = useRetro()
  const { data, isLoading } = useQuery({ queryKey: ['tags'], queryFn: api.listTags })
  const [input, setInput] = useState('')
  const name = input.trim()
  const attachedIds = new Set(attached.map((t) => t.id))
  const candidates = (data?.tags ?? []).filter((t) => t.kind === kind && !attachedIds.has(t.id))
  const key = (s: string) => s.normalize('NFKC').toLowerCase().replace(/\s+/g, '')
  const matched = name ? candidates.filter((t) => key(t.name).includes(key(name))) : candidates
  const exact = candidates.find((t) => key(t.name) === key(name))
  const alreadyAttached = name && attached.some((t) => t.kind === kind && key(t.name) === key(name))

  const submit = () => {
    if (!name || pending || alreadyAttached) return
    onAdd(exact ? { tagId: exact.id } : { name, kind })
  }

  return (
    <Box>
      <TextField
        autoFocus
        fullWidth
        size="small"
        label="タグ名で探す・新しく作る"
        placeholder={kind === 'source' ? '例: 少年ジャンプ' : '例: 熱血'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
        slotProps={{ htmlInput: { maxLength: 20 } }}
        disabled={pending}
      />
      {name && !exact && !alreadyAttached && (
        <Button fullWidth variant="contained" startIcon={<AddIcon />} onClick={submit} disabled={pending} sx={{ mt: 1, justifyContent: 'flex-start' }}>
          「{name}」を新しく追加
        </Button>
      )}
      {alreadyAttached && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          「{name}」はすでに付いています
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary" component="p" sx={{ mt: 1.5, mb: 0.5 }}>
        {name ? '一致するタグ' : 'よく使われるタグ'}（押すと追加）
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, maxHeight: 200, overflowY: 'auto', py: 0.5 }}>
        {isLoading && <Typography variant="body2">読み込み中…</Typography>}
        {!isLoading && matched.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            {name ? '一致するタグはありません' : '追加できるタグはありません'}
          </Typography>
        )}
        {[...matched]
          .sort((a, b) => (b.workCount ?? 0) - (a.workCount ?? 0))
          .slice(0, 40)
          .map((t) => (
            <Chip
              key={t.id}
              label={`#${t.name}`}
              clickable
              disabled={pending}
              onClick={() => onAdd({ tagId: t.id })}
              icon={<AddIcon />}
              variant="outlined"
              sx={retro ? undefined : { borderRadius: 99 }}
            />
          ))}
      </Box>
    </Box>
  )
}

/** 放送時期: 年と季節を選んで追加（自由入力はさせない）。年だけ・不明も選べる */
function SeasonPicker({ pending, onAdd }: { pending: boolean; onAdd: (v: AddInput) => void }) {
  const [value, setValue] = useState<SeasonValue>(EMPTY_SEASON)
  const input = toSeasonInput(value)
  const label = seasonValueLabel(value)
  return (
    <Stack spacing={1.5}>
      <SeasonSelect value={value} onChange={setValue} allowUnset={false} size="small" />
      <Typography variant="caption" color="text.secondary">
        季節が分からない・1クールではない場合は「未選択」、時期が分からない場合は放送年で「不明」を選んでください
      </Typography>
      <Button variant="contained" disabled={!input || pending} onClick={() => input && onAdd(input)}>
        {label ? `「${label}」を追加` : '放送年を選んでください'}
      </Button>
    </Stack>
  )
}
