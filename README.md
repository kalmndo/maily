# maily

> wip, don't use this yet

having multiple emails on your own domain is either expensive or limited. google workspace wants $6/month per user, zoho gives you one address for free then wants money.

maily is free. self-host it, point your MX records at cloudflare, and you have a real webmail app on your domain. resend handles outgoing (free tier is 100/day, fine for personal use), cloudflare workers receive incoming mail, supabase stores everything, r2 for attachments.

**features (so far):**
- send & receive
- multiple accounts and mailboxes
- attachments
- admin panel
