import { renderStaticPage, type Env } from '../edge/lib'

export const onRequestGet: PagesFunction<Env> = ({ request, env }) => renderStaticPage(env, request, 'faq')
