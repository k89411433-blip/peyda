import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, Loader2, MessageCircle, Send } from 'lucide-react';
import { fnum, type User } from './data';

export type Conversation = {
  id: number; listing_id: number | null; listing_title?: string; listing_image?: string;
  other_id: number; other_name: string; other_avatar?: string; other_phone?: string;
  last_body?: string; last_at?: string; unread?: number;
};
type ChatMessage = { id: number; sender_id: number; body: string; created_at: string };

function clock(value?: string): string {
  if (!value) return '';
  const date = new Date(value.replace(' ', 'T') + 'Z');
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(date);
}

export default function MessagesScreen({ me, notify, initial, clearInitial }: {
  me: User; notify: (message: string) => void; initial: number | null; clearInitial: () => void;
}) {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [active, setActive] = useState<number | null>(initial);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    try {
      const response = await fetch('/api/conversations?userId=' + me.id);
      if (!response.ok) throw new Error('conversations');
      setItems(await response.json());
      setError(false);
    } catch { setError(true); } finally { setLoading(false); }
  }, [me.id]);

  const loadThread = useCallback(async (id: number) => {
    try {
      const response = await fetch('/api/conversations/' + id + '/messages?userId=' + me.id);
      if (!response.ok) throw new Error('messages');
      const data = await response.json() as { messages: ChatMessage[] };
      setMessages(data.messages || []);
    } catch { notify('دریافت پیام‌های این گفتگو انجام نشد.'); }
  }, [me.id, notify]);

  useEffect(() => { void loadList(); }, [loadList]);
  useEffect(() => { if (active) void loadThread(active); else setMessages([]); }, [active, loadThread]);
  useEffect(() => {
    const timer = window.setInterval(() => { void loadList(); if (active) void loadThread(active); }, 6000);
    return () => window.clearInterval(timer);
  }, [active, loadList, loadThread]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [messages.length]);
  useEffect(() => { if (initial) { setActive(initial); clearInitial(); } }, [initial, clearInitial]);

  const send = async () => {
    const body = text.trim();
    if (!body || !active) return;
    setSending(true);
    const optimistic: ChatMessage = { id: Date.now(), sender_id: me.id, body, created_at: new Date().toISOString() };
    setMessages((list) => [...list, optimistic]);
    setText('');
    try {
      const response = await fetch('/api/conversations/' + active + '/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: me.id, body }),
      });
      if (!response.ok) throw new Error('send');
      await loadThread(active);
      void loadList();
    } catch {
      setMessages((list) => list.filter((item) => item.id !== optimistic.id));
      setText(body);
      notify('ارسال پیام انجام نشد؛ دوباره تلاش کنید.');
    } finally { setSending(false); }
  };

  const current = items.find((item) => item.id === active) || null;

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="mb-3 text-lg font-black">پیام‌ها</h1>
      <div className="grid overflow-hidden rounded-3xl bg-white dark:bg-[#17211e] md:grid-cols-[260px_1fr]">
        <aside className={'border-zinc-100 dark:border-white/10 md:block md:border-l ' + (active ? 'hidden' : 'block')}>
          {loading && !items.length && (
            <div className="space-y-2 p-3">{[0, 1, 2].map((row) => <div key={row} className="h-16 animate-pulse rounded-2xl bg-zinc-100 dark:bg-white/5" />)}</div>
          )}
          {!loading && error && (
            <div data-testid="messages-error" className="p-6 text-center text-xs text-zinc-500">
              گفتگوها دریافت نشد.
              <button data-testid="messages-retry" onClick={() => { setLoading(true); void loadList(); }} className="mt-3 block w-full rounded-xl bg-[#12a05c] py-2 text-xs font-bold text-white">تلاش دوباره</button>
            </div>
          )}
          {!loading && !error && !items.length && (
            <div data-testid="messages-empty" className="p-8 text-center text-xs leading-7 text-zinc-500">
              <MessageCircle className="mx-auto mb-2 text-zinc-300" />
              هنوز گفتگویی ندارید.<br />از صفحه هر آگهی می‌توانید به آگهی‌دهنده پیام بدهید.
            </div>
          )}
          {items.map((item) => (
            <button data-testid={'conversation-' + item.id} key={item.id} onClick={() => setActive(item.id)}
              className={'flex w-full items-center gap-3 border-b border-zinc-50 p-3 text-right transition dark:border-white/5 ' + (active === item.id ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'hover:bg-zinc-50 dark:hover:bg-white/5')}>
              <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-emerald-100 text-sm font-black text-[#0b7f47]">
                {item.other_avatar ? <img src={item.other_avatar} alt="" className="size-full object-cover" /> : (item.other_name || 'ک').slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1">
                <b className="block truncate text-[13px]">{item.other_name || 'کاربر پیدا'}</b>
                <small className="block truncate text-[11px] text-zinc-500">{item.last_body || 'گفتگوی تازه'}</small>
                {item.listing_title && <small className="block truncate text-[10px] text-[#12a05c]">{item.listing_title}</small>}
              </span>
              {!!item.unread && <span className="grid size-5 shrink-0 place-items-center rounded-full bg-[#12a05c] text-[9px] font-black text-white">{fnum(item.unread)}</span>}
            </button>
          ))}
        </aside>

        <div className={'flex min-h-[60dvh] flex-col ' + (active ? 'flex' : 'hidden md:flex')}>
          {current ? (
            <>
              <div className="flex items-center gap-2 border-b border-zinc-100 p-3 dark:border-white/10">
                <button data-testid="thread-back" onClick={() => setActive(null)} className="grid size-9 place-items-center rounded-xl hover:bg-zinc-100 dark:hover:bg-white/10 md:hidden"><ChevronRight size={18} /></button>
                {current.listing_image && <img src={current.listing_image} alt="" className="size-9 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-sm">{current.other_name}</b>
                  {current.listing_title && <small className="block truncate text-[10px] text-zinc-500">{current.listing_title}</small>}
                </div>
                {current.other_phone && <a data-testid="thread-call" href={'tel:' + current.other_phone} className="rounded-xl bg-emerald-50 px-3 py-2 text-[11px] font-bold text-[#0b7f47] dark:bg-emerald-950/30">تماس</a>}
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.length ? messages.map((item) => (
                  <div key={item.id} data-testid={'message-' + item.id} className={'flex ' + (item.sender_id === me.id ? 'justify-start' : 'justify-end')}>
                    <p className={'max-w-[80%] break-words rounded-2xl px-3 py-2 text-[13px] leading-6 ' + (item.sender_id === me.id ? 'bg-[#12a05c] text-white' : 'bg-zinc-100 dark:bg-white/10')}>
                      {item.body}
                      <span className={'mt-1 block text-[9px] ' + (item.sender_id === me.id ? 'text-emerald-50' : 'text-zinc-400')}>{clock(item.created_at)}</span>
                    </p>
                  </div>
                )) : <p className="py-10 text-center text-xs text-zinc-500">پیامی در این گفتگو نیست؛ اولین پیام را بفرستید.</p>}
                <div ref={bottom} />
              </div>
              <div className="flex gap-2 border-t border-zinc-100 p-3 dark:border-white/10">
                <input data-testid="chat-input" value={text} onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') void send(); }}
                  className="input min-w-0 flex-1" placeholder="پیام بنویسید..." />
                <button data-testid="send-message" onClick={() => void send()} disabled={sending || !text.trim()} aria-label="ارسال پیام"
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#12a05c] text-white disabled:opacity-50">
                  {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                </button>
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center text-xs text-zinc-500">
              یک گفتگو را از فهرست انتخاب کنید.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
