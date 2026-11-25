# DEMO SHORT-FORM VIDEOS — E-COMMERCE BUILD

> Based on the actual Darro football jersey store build in this workspace.
> Every feature described here exists in the build. Nothing invented.
> Routes referenced: /shop, /cart, /simulator, /admin/overview, /admin/orders, /admin/conversations, /admin/analytics, /admin/products

---

## BUILD INVENTORY (what actually exists)

Before the videos, here is what is actually built and demonstrable:

**Storefront** — /shop
- Product catalog with search bar
- Collection filter tabs (2026/27, etc.)
- Product grid with images, prices (regular + member), best-seller badges
- Product detail pages with size selection, images, material info, related products

**Cart + WhatsApp Checkout** — /cart
- Cart items with quantity controls
- Remove items
- Member pricing applied automatically
- "Order via WhatsApp" button — generates a pre-filled WhatsApp message with the full order

**WhatsApp Automation Simulator** — /simulator
- 4 playbooks, each with multi-message automated sequences:
  1. Speed to Lead — order intake, delivery location buttons, confirmation, customization upsell, admin update
  2. Drop Announcement — pre-drop countdown, reminder opt-in, early-access buttons, order conversion, stats update
  3. Cart Reactivation — abandoned cart reminder, member-price pitch, discount code, recovery stats
  4. Delivery Confirmation — shipment notice, out-for-delivery update, delivery confirmation, admin dashboard update

**Admin Dashboard** — /admin/overview
- 20 KPI cards: Sessions, Visitors, Orders, Conversion Rate, Pageviews, Gross Sales, Net Sales, Discounts, Refunds, AOV, COGS, Gross Profit, Gross Margin, Marketing Spend, ROAS, Add to Carts, Checkouts Started, Purchases, New Customers, Returning Customers
- Revenue & Orders Timeline chart
- Traffic Sources breakdown
- Revenue by Collection
- Top Pages
- Purchase Funnel summary

**Admin Products** — /admin/products
- Per-product: views, add-to-cart rate, units sold, revenue, profit, margin, velocity
- Product editor link

**Admin Orders** — /admin/orders
- Total orders, AOV, gross profit, units sold, net revenue
- Abandonment and recovery stats
- Recovery funnel
- Recent orders table (order number, customer, items, status, source, net sales, profit, date)

**Admin Conversations** — /admin/conversations
- Conversation stats
- Recent WhatsApp conversations list
- Order pipeline with status badges
- Conversation detail panel: customer info, order ref/status, playbook trigger/outcome, "View in Simulator" action, activity log

**Admin Analytics** — /admin/analytics
- Conversion funnel (product views, add-to-carts, checkout starts, purchases)
- Drop rates and conversion rates at each step
- Top 10 products by performance
- Session behavior (pages/session, ATC per visitor)
- Traffic sources

---

## VIDEO 1: "They Messaged 'How Much?' Then Disappeared."

**TYPE:** Problem + Build Demonstration (Storefront + WhatsApp Checkout)
**ANGLE:** Educate + demonstrate expertise
**REUSE:** Instagram Reel, TikTok, YouTube Short, WhatsApp outreach

### TITLE
"They Messaged 'How Much?' Then Disappeared."

### HOOK
"Eight out of ten customers who message your WhatsApp never actually buy. Here is why — and what I built to fix it."

### TALKING POINTS
- Customer sees your product on Instagram. DMs you "how much?"
- You are driving, cooking, or asleep. You reply 4 hours later
- By then they already bought from someone else who replied faster
- Even when you reply fast, the conversation is painful: "what sizes?" "do you deliver?" "how do I pay?" — 15 messages for one order
- I built a storefront that handles all of this so the customer gets every answer instantly and you only handle the final confirmation

### EXACT BUILD/SCREEN TO SHOW
1. Open /shop — show the product grid, search bar, collection filters
2. Click a product (e.g., Manchester United Home 2026/27) — show the product page: images, price (regular 65,000 + member 60,000), sizes, material info
3. Click "Add to Cart" — show the cart counter updating
4. Go to /cart — show the cart with items, quantity controls, member pricing applied
5. Click "Order via WhatsApp" — show the pre-filled WhatsApp message with the full order details

### WHAT TO DEMONSTRATE
- Search for a team name in the search bar
- Filter by collection tab
- Click into a product, scroll through images
- Select a size, click add to cart
- Open cart, adjust quantity
- Click the WhatsApp button — the phone opens WhatsApp with a pre-formatted order message containing product name, size, quantity, and total

### WHY THAT FEATURE EXISTS
- Customer does not need to ask "how much?" — the price is right there
- Customer does not need to ask "what sizes?" — sizes are listed
- Customer does not need to ask "how do I pay?" — the WhatsApp button starts the order
- The owner does not need to type out order details — the message is pre-formatted
- Every question the customer would have asked is already answered before they message

### BUSINESS OUTCOME
- Customers who browse at 2am get every answer instantly
- Owner only handles confirmation, not explanation
- One order that used to take 15 messages now takes 2

### CTA
"If you run a product business and want something like this, message me."

---

## VIDEO 2: "The Sale You Lost 2 Days Ago."

**TYPE:** Build Demonstration (WhatsApp Automation — Cart Reactivation)
**ANGLE:** Directly pitch the automation
**REUSE:** Instagram Reel, TikTok, YouTube Short, Sales-call material, WhatsApp outreach

### TITLE
"The Sale You Lost 2 Days Ago."

### HOOK
"Someone added a jersey to their cart, then went quiet. Two days later, this happened — and I did not send a single message."

### TALKING POINTS
- A customer browsed your store, added a product to their cart, then closed the tab
- Most owners never even know this happened — there is no way to see it on Instagram
- I built an automation that catches these customers and brings them back
- The automation waits 2 days, then sends a message with the product they were looking at
- It offers the member price as an incentive
- If they still do not respond, it sends a discount code
- Then it confirms the order and updates the dashboard

### EXACT BUILD/SCREEN TO SHOW
1. Open /simulator — show the playbook selection screen
2. Click "Cart Reactivation" — show the playbook description and message count
3. Press play — watch the automated message sequence:
   - Message 1: "You left something behind" with the product name
   - Message 2: Member price offer
   - Message 3: Discount code with hold expiration
   - Message 4: Order confirmation
   - Message 5: Recovery stats update
4. Show the typing indicator and automated flow

### WHAT TO DEMONSTRATE
- Click through each message in the simulator
- Point out that every message is timed — 2 days, then a reminder, then a discount
- Show the final stats message that updates the admin dashboard
- Emphasize: "I did not type any of these messages. The system sent them on its own."

### WHY THAT FEATURE EXISTS
- On Instagram, a customer who closes your DM is gone forever — you cannot reach them again
- With a connected store, you know exactly what they looked at and when they left
- The automation follows up automatically — the owner does nothing
- The member price and discount code give the customer a reason to come back

### BUSINESS OUTCOME
- Recovered sales that would have been permanently lost
- Each recovered sale is pure recovered revenue — the customer already wanted to buy
- The owner does not need to remember to follow up — the system does it

### CTA
"If you want me to show you what this could look like for your business, apply to work with us."

---

## VIDEO 3: "Your Business in One Screen."

**TYPE:** Build Demonstration (Admin Dashboard)
**ANGLE:** Demonstrate expertise + educate
**REUSE:** Instagram Reel, TikTok, YouTube Short, Sales-call material, Portfolio material

### TITLE
"Your Business in One Screen."

### HOOK
"Most business owners check Instagram for messages, WhatsApp for orders, a notebook for stock, and their bank app for money. I built one screen that shows all of it."

### TALKING POINTS
- Open the dashboard — 20 numbers, all in one place
- Top row: Sessions, Visitors, Orders, Conversion Rate, Pageviews — who is coming to your store
- Second row: Gross Sales, Net Sales, Discounts, Refunds, Average Order Value — the money
- Third row: COGS, Gross Profit, Gross Margin, Marketing Spend, ROAS — what it costs and what you keep
- Fourth row: Add to Carts, Checkouts Started, Purchases, New Customers, Returning Customers — customer behavior
- Below: Revenue timeline, traffic sources, revenue by collection, top pages, purchase funnel
- The owner should not have to open five different apps to figure out what happened this month

### EXACT BUILD/SCREEN TO SHOW
1. Open /admin/overview — let the 20 KPI cards fill the screen
2. Scroll down slowly through the KPI cards — point at key ones:
   - Conversion Rate (sessions to orders)
   - Gross Margin (profit / net)
   - AOV (average order value with units per order)
   - Returning Customers (repeat buyers)
3. Scroll to the Revenue & Orders Timeline chart
4. Scroll to Traffic Sources
5. Scroll to Revenue by Collection
6. Scroll to Top Pages
7. Scroll to Purchase Funnel summary

### WHAT TO DEMONSTRATE
- Point at the Conversion Rate card — "This one number tells you how many visitors actually buy"
- Point at Gross Margin — "This tells you if you are actually making money, not just selling"
- Point at Returning Customers — "This tells you if past buyers are coming back"
- Point at the funnel — "This shows you exactly where customers are disappearing"
- Hover over the timeline chart — "Revenue per day, orders per day, all in one view"

### WHY THAT FEATURE EXISTS
- The owner should not have to open five different places to figure out what happened this month
- These numbers exist so the owner can make decisions: which products to restock, which to drop, where to focus
- Conversion Rate tells you if your store is actually working
- Gross Margin tells you if your pricing is sustainable
- Returning Customers tells you if your follow-up is working
- The funnel tells you exactly where to fix the store

### BUSINESS OUTCOME
- The owner can see the full business in 30 seconds instead of 30 minutes across five apps
- Decisions are based on numbers, not gut feeling
- Problems are visible before they become expensive

### CTA
"I broke down the bigger problem in my full YouTube video."

---

## VIDEO 4: "New Stock. Same Customers. Zero Marketing."

**TYPE:** Build Demonstration (WhatsApp Automation — Drop Announcement)
**ANGLE:** Educate + demonstrate
**REUSE:** Instagram Reel, TikTok, YouTube Short, WhatsApp outreach

### TITLE
"New Stock. Same Customers. Zero Marketing."

### HOOK
"When new stock arrives, most owners post on Instagram and hope 5 percent of their followers see it. I built something that messages every past buyer directly."

### TALKING POINTS
- A past customer is 5 times more likely to buy again than a stranger
- But when new stock arrives, you post on Instagram and hope the algorithm shows it
- I built an automation that messages past buyers directly when a new drop is coming
- It sends a countdown, gives them early access before the public, and takes their order
- The customer feels valued because they got first access
- The owner does not need to manually message 200 people

### EXACT BUILD/SCREEN TO SHOW
1. Open /simulator — select "Drop Announcement" playbook
2. Press play — watch the sequence:
   - Message 1: Pre-drop countdown — "New drop in 3 days"
   - Message 2: Reminder with opt-in — "Want early access?"
   - Message 3: Early access buttons — "Shop now before everyone else"
   - Message 4: Order confirmation
   - Message 5: System stats update — how many ordered

### WHAT TO DEMONSTRATE
- Click through each message
- Point out the countdown timing — the system builds anticipation over days
- Show the early-access buttons — interactive buttons, not just text
- Show the final stats message — the owner gets a summary of how many ordered
- Emphasize: "Every person who got this message already bought from me before. I am not reaching new strangers. I am selling again to people who already trust me."

### WHY THAT FEATURE EXISTS
- Instagram's algorithm decides who sees your post — you do not
- WhatsApp messages go directly to the customer — 90 percent open rate vs 5 percent on Instagram
- Past buyers already trust you — they do not need to be convinced from scratch
- The countdown creates urgency without the owner needing to manually remind people
- Early access makes the customer feel rewarded for their loyalty

### BUSINESS OUTCOME
- New drops sell out faster because past buyers get first access
- No marketing spend needed — the audience already exists in your WhatsApp
- Each repeat purchase is higher margin because there is no acquisition cost

### CTA
"If you run a product business and want something like this, message me."

---

## VIDEO 5: "The Customer Who Ordered at 2 AM."

**TYPE:** Build Demonstration (WhatsApp Automation — Speed to Lead)
**ANGLE:** Demonstrate expertise
**REUSE:** Instagram Reel, TikTok, YouTube Short, Sales-call material

### TITLE
"The Customer Who Ordered at 2 AM."

### HOOK
"A customer ordered a jersey at 2:32 AM. I was asleep in a different time zone. By 2:37 AM, the order was confirmed. I never touched my phone."

### TALKING POINTS
- I sell to customers in Uganda. I am in China. Five-hour time difference
- A customer messages at 2 AM Uganda time — that is 7 AM my time, but I am not checking WhatsApp yet
- Without automation, that customer waits hours for a reply. Some buy from someone else
- I built an automation that confirms the order within minutes — any time, day or night
- The automation collects delivery location, confirms the order, offers customization, and notifies the admin dashboard
- The customer feels taken care of immediately. The owner wakes up to confirmed orders

### EXACT BUILD/SCREEN TO SHOW
1. Open /simulator — select "Speed to Lead" playbook
2. Press play — watch the sequence:
   - Message 1: Order intake — "Thanks for your order! Where should we deliver?"
   - Message 2: Delivery location buttons — interactive buttons for location selection
   - Message 3: Order confirmation — "Your order is confirmed"
   - Message 4: Customization upsell — "Want to add a name or number?"
   - Message 5: Admin update — "New order received" notification to dashboard

### WHAT TO DEMONSTRATE
- Click through each message in the simulator
- Show the interactive delivery location buttons — not just text, real buttons
- Show the upsell message — the system automatically offers customization after the order
- Show the admin update message — the dashboard gets notified automatically
- Emphasize: "From first message to confirmed order — five minutes. I was asleep."

### WHY THAT FEATURE EXISTS
- Speed kills competition — the first business to reply usually gets the sale
- The owner cannot be awake 24 hours, but customers shop at all hours
- Interactive buttons make it easy for the customer — they tap instead of type
- The upsell happens automatically — the customer just bought, they are in buying mode, so offer them one more thing
- The admin notification means the owner wakes up to a dashboard already updated

### BUSINESS OUTCOME
- No customer waits for a reply, regardless of time zone
- The upsell increases order value without the owner needing to manually suggest it
- The owner starts the day with confirmed orders, not pending inquiries

### CTA
"Watch the full breakdown on YouTube."

---

## VIDEO 6: "200 WhatsApp Chats. Zero Order Tracking."

**TYPE:** Build Demonstration (Admin Conversations)
**ANGLE:** Problem + expertise demonstration
**REUSE:** Instagram Reel, TikTok, YouTube Short, Sales-call material, Portfolio material

### TITLE
"200 WhatsApp Chats. Zero Order Tracking."

### HOOK
"You have 200 WhatsApp conversations. Can you tell me which ones have paid, which are waiting for delivery, and which went quiet? Without scrolling for an hour?"

### TALKING POINTS
- Most owners manage orders through WhatsApp chats — scrolling, searching, guessing
- You cannot sort by order status. You cannot filter by who paid. You cannot see who went quiet
- I built a conversation dashboard that shows every WhatsApp chat next to its order status
- Each conversation shows the customer, the last message, the playbook phase, and the order status
- The order pipeline shows you exactly how many conversations are in each stage
- You can click into any conversation and see the full detail — order ref, playbook trigger, activity log

### EXACT BUILD/SCREEN TO SHOW
1. Open /admin/conversations — show the conversation stats at the top
2. Scroll to the conversation list — show each row: customer name, last message, playbook phase, order status badge, order ref
3. Point at the order pipeline — show the counts at each stage (new, confirmed, delivered, etc.)
4. Click into a conversation detail panel — show:
   - Customer info
   - Order ref and status
   - Playbook trigger and outcome
   - "View in Simulator" action button
   - Activity log
5. Click "View in Simulator" — show how it jumps back to the simulator to replay the conversation

### WHAT TO DEMONSTRATE
- Scroll through the conversation list — point at different order status badges
- Show the pipeline counts — "These 12 conversations are waiting for delivery. These 8 went quiet."
- Click into one conversation — show the detail panel
- Point at the "View in Simulator" button — show how you can replay the exact conversation flow
- Show the activity log — every message and action is timestamped

### WHY THAT FEATURE EXISTS
- The owner should not need to scroll through 200 WhatsApp chats to find one order
- Order status should be visible at a glance — who paid, who is waiting, who went quiet
- The playbook trigger shows exactly which automation is running for each customer
- The activity log creates accountability — you can see exactly what the system did and when
- The "View in Simulator" link means you can replay any conversation to debug or improve it

### BUSINESS OUTCOME
- The owner can find any order in seconds, not minutes
- No order falls through the cracks — every conversation has a status
- The pipeline shows bottlenecks — if 15 conversations are stuck at "waiting for payment," that is visible
- The activity log proves the automation is working correctly

### CTA
"If you want me to show you what this could look like for your business, apply to work with us."

---

## VIDEO 7: "Where Are the 97 Going?"

**TYPE:** Build Demonstration (Admin Analytics — Conversion Funnel)
**ANGLE:** Educate
**REUSE:** Instagram Reel, TikTok, YouTube Short, WhatsApp outreach

### TITLE
"Where Are the 97 Going?"

### HOOK
"If 100 people look at your products but only 3 buy — where are the other 97 going? I built a funnel that shows you exactly where they disappear."

### TALKING POINTS
- Most owners know their total sales but not where customers are dropping off
- The journey has steps: product view, add to cart, checkout start, purchase
- If you do not know which step loses people, you cannot fix it
- I built a conversion funnel that shows exactly how many people make it to each step
- It shows drop rates and conversion rates at every stage
- Below the funnel: top 10 products by performance, session behavior, traffic sources
- This is the difference between guessing and knowing

### EXACT BUILD/SCREEN TO SHOW
1. Open /admin/analytics — show the header KPIs: Product Views, Add to Carts, Checkout Starts, Purchases
2. Scroll to the conversion funnel — show each step with its numbers:
   - Product Views (top of funnel)
   - Add to Carts
   - Checkout Starts
   - Purchases (bottom of funnel)
3. Point at the drop rates between steps — "This percentage of people left at this step"
4. Point at the overall conversion rate — "Product view to purchase"
5. Scroll down to top 10 products by performance
6. Scroll to session behavior — pages per session, ATC per visitor
7. Scroll to traffic sources

### WHAT TO DEMONSTRATE
- Point at the biggest drop in the funnel — "This is where you are losing the most people"
- Show the top 10 products — "These are your best performers, these are the ones to push"
- Show traffic sources — "This tells you where your customers are coming from"
- Emphasize: "If the biggest drop is between product view and add-to-cart, your product pages need work. If it is between checkout start and purchase, your checkout needs work. You cannot know this without a funnel."

### WHY THAT FEATURE EXISTS
- Total sales only tells you the outcome — the funnel tells you the cause
- If you do not know where customers drop off, you are guessing at the fix
- The top products list tells you which products to restock and which to drop
- Session behavior tells you if people are browsing or bouncing
- Traffic sources tell you where to focus your effort — which channel actually brings buyers

### BUSINESS OUTCOME
- The owner can identify the exact step that loses the most customers
- Fixes are targeted — improve product pages, checkout, or traffic based on data
- Product decisions are based on performance, not emotion
- The owner knows which traffic source actually produces buyers, not just visitors

### CTA
"I broke down the bigger problem in my full YouTube video."

---

## CONTENT REUSE MATRIX

| Video | Instagram Reel | TikTok | YouTube Short | WhatsApp Outreach | Sales-Call Material | Portfolio Material |
|---|---|---|---|---|---|---|
| 1. "They Messaged 'How Much?'" | Yes | Yes | Yes | Yes | Yes | Yes |
| 2. "The Sale You Lost" | Yes | Yes | Yes | Yes | Yes | No |
| 3. "Your Business in One Screen" | Yes | Yes | Yes | No | Yes | Yes |
| 4. "New Stock. Same Customers." | Yes | Yes | Yes | Yes | Yes | No |
| 5. "The Customer Who Ordered at 2 AM" | Yes | Yes | Yes | No | Yes | Yes |
| 6. "200 WhatsApp Chats" | Yes | Yes | Yes | Yes | Yes | Yes |
| 7. "Where Are the 97 Going?" | Yes | Yes | Yes | Yes | No | No |

---

## THE ONE VIDEO WITH HIGHEST POTENTIAL

### Video 2: "The Sale You Lost 2 Days Ago." (Cart Reactivation)

**Why this one has the highest potential to generate a business conversation:**

1. It demonstrates recovered revenue — the most universal business pain. Every product business owner has lost sales they did not even know about. This video makes that loss visible, then shows the solution.

2. The automation is the wow moment. Watching messages send themselves — without the owner touching anything — is visually compelling and immediately understandable. It does not require technical knowledge to appreciate.

3. The timing creates tension. "Two days later" implies the customer was already gone. The recovery feels like found money. Business owners think: "How many sales have I lost like this?"

4. It directly connects to a purchase decision. The viewer can immediately see: "I need this automation because I am losing sales right now without knowing it." The gap between problem and solution is clear and the value is obvious.

5. It works across all platforms. The visual of automated messages appearing in sequence is engaging on Reels, TikTok, and Shorts. The concept is simple enough to explain in 30-60 seconds.

6. The CTA is natural. "Apply to work with us" fits because the viewer has just seen a system they cannot build themselves — they need you to build it for them.

The other videos educate and build trust. This one creates urgency. Urgency drives conversations.

---

## RECORDING NOTES

- Record in two browser tabs: one for the storefront/simulator, one for the admin dashboard
- Use OBS Studio or Windows Game Bar for screen recording
- Keep face visible in a small window during screen recordings
- Each video should be 45-90 seconds for Reels/TikTok/Shorts
- If recording for YouTube Shorts, keep under 60 seconds
- For sales-call material, you can play the full simulator sequence without time limits
- Speak in business-owner language: "customers," "orders," "sales," "recover" — not "API," "playbook," "webhook"
- The simulator has a playback speed control — slow it down if you need to speak over each message
- For the admin dashboard videos, scroll slowly — the KPI cards are dense and viewers need time to read them
